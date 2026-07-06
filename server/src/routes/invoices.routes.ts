import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { razorpayService } from '../services/razorpayService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { normalizeEnum, presentEnum } from '../utils/enums.js';

const router = Router();
router.use(requireAuth);
// Invoices are finance data — restrict to admins and managers (mirrors the
// client route guard). Team members are blocked at the API, not just the UI.
router.use(allowRoles('admin', 'manager'));

const include = { items: true, payments: true };

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', CAD: 'C$', JPY: '¥', AED: 'د.إ', SGD: 'S$',
};

// Load company branding (name, contact, logo, currency) for documents/emails.
const getCompanyBranding = async () => {
  const company = await prisma.companySetting.findUnique({ where: { id: 'company' } });
  const currencyCode = company?.currency || 'USD';
  return {
    name: company?.name?.trim() || 'Your Company',
    address: company?.address?.trim() || '',
    phone: company?.phone?.trim() || '',
    email: company?.email?.trim() || '',
    website: company?.website?.trim() || '',
    logo: company?.logo?.trim() || '',
    currencyCode,
    currencySymbol: CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `,
    bankDetails: company?.bankDetails || '',
  };
};

// PDFKit only embeds PNG/JPEG. Resolve the configured logo (an /api/uploads path
// on disk, or an http(s) URL) to a usable image buffer; return null on anything
// it can't safely embed (SVG, missing file, network error, frontend-only asset).
const isPngOrJpeg = (buf: Buffer) =>
  buf.length >= 3 &&
  ((buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) || // PNG
    (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)); // JPEG

const loadLogoBuffer = async (logo: string): Promise<Buffer | null> => {
  try {
    if (!logo) return null;
    let buf: Buffer | null = null;
    if (/^https?:\/\//i.test(logo)) {
      const res = await axios.get<ArrayBuffer>(logo, { responseType: 'arraybuffer', timeout: 5000, maxContentLength: 5 * 1024 * 1024 });
      buf = Buffer.from(res.data);
    } else if (logo.startsWith('/api/uploads/')) {
      const file = path.join(env.UPLOAD_DIR, path.basename(logo));
      if (fs.existsSync(file)) buf = fs.readFileSync(file);
    }
    return buf && isPngOrJpeg(buf) ? buf : null;
  } catch {
    return null;
  }
};

const invoiceSchema = z.object({
  // Optional on create — the server assigns a unique sequential number.
  invoiceNumber: z.string().optional(),
  clientName: z.string(),
  clientCompany: z.string(),
  clientEmail: z.string().email(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.string().default('Draft'),
  // General invoices carry no tax; Tax invoices apply taxRate.
  invoiceType: z.enum(['General', 'Tax']).default('Tax'),
  taxRate: z.coerce.number().default(0),
  paymentTerms: z.string().nullable().optional(),
  // Preserve explicit null so the user can clear a template back to "Standard";
  // `undefined` (field omitted) means "leave unchanged" on update.
  templateId: z.string().nullable().optional(),
  customHtml: z.string().nullable().optional(),
  items: z.array(z.object({ id: z.string().optional(), description: z.string(), quantity: z.coerce.number().int(), price: z.coerce.number() })).default([]),
});

// Enforce server-side: a General invoice is always tax-free, whatever the client sent.
const enforceTaxRule = <T extends { invoiceType?: string; taxRate?: number }>(body: T): T =>
  body.invoiceType === 'General' ? { ...body, taxRate: 0 } : body;

const presentInvoice = (invoice: any) => ({
  ...invoice,
  status: presentEnum(invoice.status),
  issueDate: invoice.issueDate?.toISOString().slice(0, 10),
  dueDate: invoice.dueDate?.toISOString().slice(0, 10),
  taxRate: Number(invoice.taxRate),
  items: invoice.items?.map((item: any) => ({ ...item, price: Number(item.price) })) || [],
});

// Compute money with Prisma.Decimal to avoid floating-point rounding errors.
// Returns Decimals rounded to 2 dp; callers convert to number/string at the edge.
const computeTotals = (invoice: any) => {
  const subtotal = (invoice.items || []).reduce(
    (sum: Prisma.Decimal, item: any) => sum.plus(new Prisma.Decimal(item.price).times(item.quantity)),
    new Prisma.Decimal(0),
  );
  const tax = subtotal.times(new Prisma.Decimal(invoice.taxRate || 0).div(100));
  const total = subtotal.plus(tax).toDecimalPlaces(2);
  return { subtotal: subtotal.toDecimalPlaces(2), tax: tax.toDecimalPlaces(2), total };
};

const totalFor = (invoice: any) => computeTotals(invoice).total.toNumber();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({ include, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: invoices.map(presentInvoice) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = enforceTaxRule(invoiceSchema.parse(req.body));
    // Assign a unique, sequential invoice number server-side. Retry on the rare
    // race where two invoices grab the same number concurrently.
    let invoice: Awaited<ReturnType<typeof prisma.invoice.create>> | undefined;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const invoiceNumber = body.invoiceNumber?.trim() || `INV-${String((await prisma.invoice.count()) + 1 + attempt).padStart(4, '0')}`;
      try {
        invoice = await prisma.invoice.create({
          data: {
            ...body,
            invoiceNumber,
            status: normalizeEnum(body.status) as any,
            items: { create: body.items.map(({ id: _id, ...item }) => item) },
          },
          include,
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002') {
          // A client-supplied number that collides is a real error; an auto-number collision just retries.
          if (body.invoiceNumber?.trim()) throw new HttpError(409, 'Invoice number already exists');
          continue;
        }
        throw err;
      }
    }
    if (!invoice) throw new HttpError(500, 'Could not allocate a unique invoice number, please retry');
    const presented = presentInvoice(invoice);
    // Only email the client for non-draft invoices — drafts shouldn't reach them.
    if (invoice.status !== 'Draft') {
      emailService.sendInvoiceEmail(presented).catch((err: Error) =>
        console.error('[invoice-email] Failed to send invoice email:', err.message),
      );
    }
    res.status(201).json({ success: true, data: presented });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id as string }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = enforceTaxRule(invoiceSchema.partial().parse(req.body));
    const invoice = await prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id as string } });
      }
      return tx.invoice.update({
        where: { id: req.params.id as string },
        data: {
          invoiceNumber: body.invoiceNumber,
          clientName: body.clientName,
          clientCompany: body.clientCompany,
          clientEmail: body.clientEmail,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          status: body.status ? (normalizeEnum(body.status) as any) : undefined,
          invoiceType: body.invoiceType,
          taxRate: body.taxRate,
          paymentTerms: body.paymentTerms,
          templateId: body.templateId,
          customHtml: body.customHtml,
          items: body.items ? { create: body.items.map(({ id: _id, ...item }) => item) } : undefined,
        },
        include,
      });
    });
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.invoice.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  }),
);

router.post(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.string() }).parse(req.body);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id as string }, data: { status: normalizeEnum(body.status) as any }, include });
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id as string }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    await emailService.send(invoice.clientEmail, `Invoice ${invoice.invoiceNumber}`, `<p>Your invoice ${invoice.invoiceNumber} total is ${totalFor(invoice).toFixed(2)}.</p>`);
    res.json({ success: true });
  }),
);

router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id as string }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');

    const branding = await getCompanyBranding();
    // PDFKit's built-in Helvetica lacks some currency glyphs (₹, د.إ), which would
    // render as garbage. Map those to ASCII-safe equivalents for the PDF only.
    const PDF_SAFE_SYMBOLS: Record<string, string> = { '₹': 'Rs. ', 'د.إ': 'AED ' };
    const sym = PDF_SAFE_SYMBOLS[branding.currencySymbol] || branding.currencySymbol;
    const logoBuf = await loadLogoBuffer(branding.logo);
    const { subtotal, tax, total } = computeTotals(invoice);
    const fmt = (n: Prisma.Decimal | number) => new Prisma.Decimal(n).toFixed(2);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    doc.pipe(res);

    const PRIMARY = '#0079C1';
    const GRAY = '#64748b';
    const LIGHT = '#f1f5f9';
    const pageWidth = doc.page.width - 112; // account for margins

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);
    const invoiceTitle = (invoice as any).invoiceType === 'Tax' ? 'TAX INVOICE' : 'INVOICE';
    doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text(invoiceTitle, 56, 30);
    doc.fontSize(11).font('Helvetica').text(`#${invoice.invoiceNumber}`, 56, 62);
    doc.fontSize(13).font('Helvetica-Bold').text(branding.name, doc.page.width - 250, 34, { width: 194, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold').text(presentEnum(invoice.status).toUpperCase(), doc.page.width - 250, 56, { width: 194, align: 'right' });

    // ── FROM (company branding, from Settings) — left column ──────────────
    let leftY = 112;
    if (logoBuf) {
      try {
        doc.image(logoBuf, 56, leftY, { fit: [150, 46] });
        leftY += 54;
      } catch {
        /* ignore an unembeddable image */
      }
    }
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('FROM', 56, leftY, { characterSpacing: 1.5 });
    leftY += 13;
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text(branding.name, 56, leftY, { width: 250 });
    leftY += 16;
    doc.fillColor(GRAY).fontSize(9).font('Helvetica');
    if (branding.address) {
      doc.text(branding.address, 56, leftY, { width: 250 });
      leftY += doc.heightOfString(branding.address, { width: 250 }) + 3;
    }
    const contactLine = [branding.phone, branding.email].filter(Boolean).join('   ·   ');
    if (contactLine) { doc.text(contactLine, 56, leftY, { width: 250 }); leftY += 12; }
    if (branding.website) { doc.text(branding.website, 56, leftY, { width: 250 }); leftY += 12; }

    // ── BILL TO + dates — right column ────────────────────────────────────
    const rightX = 330;
    let rightY = 112;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('BILL TO', rightX, rightY, { characterSpacing: 1.5 });
    rightY += 13;
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text(invoice.clientName, rightX, rightY, { width: 209 });
    rightY += 16;
    doc.fillColor(GRAY).fontSize(9).font('Helvetica');
    if (invoice.clientCompany) { doc.text(invoice.clientCompany, rightX, rightY, { width: 209 }); rightY += 12; }
    doc.text(invoice.clientEmail, rightX, rightY, { width: 209 });
    rightY += 20;
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text('INVOICE DATE', rightX, rightY, { characterSpacing: 1 });
    doc.text('DUE DATE', rightX + 110, rightY, { characterSpacing: 1 });
    rightY += 12;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(invoice.issueDate.toISOString().slice(0, 10), rightX, rightY);
    doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text(invoice.dueDate.toISOString().slice(0, 10), rightX + 110, rightY);
    rightY += 18;

    // Table starts below whichever column ran longer.
    const tableTop = Math.max(leftY, rightY) + 18;
    doc.moveTo(56, tableTop - 12).lineTo(56 + pageWidth, tableTop - 12).strokeColor(LIGHT).lineWidth(1).stroke();

    // Table header
    doc.rect(56, tableTop, pageWidth, 26).fill(LIGHT);
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 66, tableTop + 9);
    doc.text('QTY', 350, tableTop + 9, { width: 50, align: 'right' });
    doc.text('UNIT PRICE', 405, tableTop + 9, { width: 80, align: 'right' });
    doc.text('AMOUNT', 490, tableTop + 9, { width: 70, align: 'right' });

    // Table rows
    let y = tableTop + 32;
    invoice.items.forEach((item: any, i: number) => {
      if (i % 2 === 0) doc.rect(56, y - 4, pageWidth, 24).fill('#fafafa');
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(item.description, 66, y, { width: 280 });
      doc.text(String(item.quantity), 350, y, { width: 50, align: 'right' });
      doc.text(`${sym}${fmt(Number(item.price))}`, 405, y, { width: 80, align: 'right' });
      doc.text(`${sym}${fmt(Number(item.price) * item.quantity)}`, 490, y, { width: 70, align: 'right' });
      y += 28;
    });

    // Totals
    y += 10;
    doc.moveTo(56, y).lineTo(56 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 14;

    const totalsX = 320;
    const valX = totalsX + 100; // value column, right-aligned, ends at the right margin
    const valW = 119;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica');
    doc.text('Subtotal:', totalsX, y, { width: 100 });
    doc.text(`${sym}${fmt(subtotal)}`, valX, y, { width: valW, align: 'right', lineBreak: false });
    y += 18;
    if (Number(invoice.taxRate) > 0) {
      doc.text(`Tax (${Number(invoice.taxRate)}%):`, totalsX, y, { width: 100 });
      doc.text(`${sym}${fmt(tax)}`, valX, y, { width: valW, align: 'right', lineBreak: false });
      y += 18;
    }
    doc.moveTo(totalsX, y).lineTo(valX + valW, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 10;
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold');
    doc.text('TOTAL', totalsX, y, { width: 100 });
    doc.text(`${sym}${fmt(total)}`, valX, y, { width: valW, align: 'right', lineBreak: false });

    // Payment terms + bank details (left column, below the items)
    let infoY = y + 40;
    const paymentTerms = (invoice as any).paymentTerms as string | null;
    if (paymentTerms && paymentTerms.trim()) {
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('PAYMENT REF / TERMS', 56, infoY, { characterSpacing: 1 });
      infoY += 14;
      doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(paymentTerms.trim(), 56, infoY, { width: 300 });
      infoY += doc.heightOfString(paymentTerms.trim(), { width: 300 }) + 16;
    }
    if (branding.bankDetails && branding.bankDetails.trim()) {
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('BANK ACCOUNT DETAILS', 56, infoY, { characterSpacing: 1 });
      infoY += 14;
      doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(branding.bankDetails.trim(), 56, infoY, { width: 300 });
    }

    // Footer — anchored to the bottom of the page. Drop the bottom margin first so
    // PDFKit doesn't push this text onto a new blank page (text below the margin
    // would otherwise auto-paginate).
    doc.page.margins.bottom = 0;
    const footerY = doc.page.height - 70;
    doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text('Thank you for your business.', 56, footerY + 20, { align: 'center', width: doc.page.width - 112, lineBreak: false });
    doc.fillColor('#94a3b8').fontSize(8)
       .text(`Generated by ${branding.name}`, 56, footerY + 38, { align: 'center', width: doc.page.width - 112, lineBreak: false });

    doc.end();
  }),
);

router.post(
  '/:id/payments/razorpay/order',
  asyncHandler(async (req, res) => {
    const body = z.object({ currency: z.string().default('INR') }).parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id as string }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    const order = await razorpayService.createOrder(totalFor(invoice), body.currency, invoice.invoiceNumber);
    await prisma.payment.create({
      data: { invoiceId: invoice.id, provider: 'razorpay', providerOrderId: order.id, amount: totalFor(invoice), currency: body.currency, status: 'created', rawPayload: order as any },
    });
    res.json({ success: true, data: order });
  }),
);

router.post(
  '/:id/payments/razorpay/verify',
  asyncHandler(async (req, res) => {
    const body = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }).parse(req.body);
    razorpayService.verifySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id as string }, data: { status: 'Paid' }, include });
    await prisma.payment.updateMany({
      where: { invoiceId: req.params.id as string, providerOrderId: body.razorpay_order_id },
      data: { providerPaymentId: body.razorpay_payment_id, status: 'paid', rawPayload: body },
    });
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

export default router;
