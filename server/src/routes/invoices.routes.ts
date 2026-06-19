import PDFDocument from 'pdfkit';
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { razorpayService } from '../services/razorpayService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { normalizeEnum, presentEnum } from '../utils/enums.js';

const router = Router();
router.use(requireAuth);

const include = { items: true, payments: true };

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', CAD: 'C$', JPY: '¥', AED: 'د.إ', SGD: 'S$',
};

// Load company branding (name + currency symbol) for documents/emails.
const getCompanyBranding = async () => {
  const company = await prisma.companySetting.findUnique({ where: { id: 'company' } });
  const currencyCode = company?.currency || 'USD';
  return {
    name: company?.name?.trim() || 'Your Company',
    currencyCode,
    currencySymbol: CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `,
  };
};

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  clientName: z.string(),
  clientCompany: z.string(),
  clientEmail: z.string().email(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.string().default('Draft'),
  taxRate: z.coerce.number().default(0),
  items: z.array(z.object({ id: z.string().optional(), description: z.string(), quantity: z.coerce.number().int(), price: z.coerce.number() })).default([]),
});

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
    const body = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: {
        ...body,
        status: normalizeEnum(body.status) as any,
        items: { create: body.items.map(({ id: _id, ...item }) => item) },
      },
      include,
    });
    const presented = presentInvoice(invoice);
    // Auto-send invoice email to client (fire-and-forget)
    emailService.sendInvoiceEmail(presented).catch((err: Error) =>
      console.error('[invoice-email] Failed to send invoice email:', err.message),
    );
    res.status(201).json({ success: true, data: presented });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = invoiceSchema.partial().parse(req.body);
    const invoice = await prisma.$transaction(async (tx) => {
      if (body.items) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
      }
      return tx.invoice.update({
        where: { id: req.params.id },
        data: {
          invoiceNumber: body.invoiceNumber,
          clientName: body.clientName,
          clientCompany: body.clientCompany,
          clientEmail: body.clientEmail,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          status: body.status ? (normalizeEnum(body.status) as any) : undefined,
          taxRate: body.taxRate,
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
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.post(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.string() }).parse(req.body);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: normalizeEnum(body.status) as any }, include });
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include });
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
    const sym = branding.currencySymbol;
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
    doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text('INVOICE', 56, 30);
    doc.fontSize(11).font('Helvetica').text(`#${invoice.invoiceNumber}`, 56, 62);

    // Issuing company name (top right) + status badge
    doc.fontSize(13).font('Helvetica-Bold')
       .text(branding.name, doc.page.width - 250, 30, { width: 200, align: 'right' });
    doc.fontSize(10).font('Helvetica-Bold')
       .text(presentEnum(invoice.status).toUpperCase(), doc.page.width - 250, 52, { width: 200, align: 'right' });

    // Bill to section
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold')
       .text('BILL TO', 56, 110, { characterSpacing: 1.5 });
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold')
       .text(invoice.clientName, 56, 125);
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(invoice.clientCompany || '', 56, 142)
       .text(invoice.clientEmail, 56, 157);

    // Dates section (right side)
    const dateX = doc.page.width - 220;
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('INVOICE DATE', dateX, 110, { characterSpacing: 1 });
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(invoice.issueDate.toISOString().slice(0, 10), dateX, 125);
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('DUE DATE', dateX, 145, { characterSpacing: 1 });
    doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text(invoice.dueDate.toISOString().slice(0, 10), dateX, 160);

    // Divider
    doc.moveTo(56, 185).lineTo(56 + pageWidth, 185).strokeColor(LIGHT).lineWidth(1).stroke();

    // Table header
    const tableTop = 200;
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

    const totalsX = 400;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica');
    doc.text('Subtotal:', totalsX, y, { width: 80 });
    doc.text(`${sym}${fmt(subtotal)}`, totalsX + 80, y, { width: 76, align: 'right' });
    y += 18;
    if (Number(invoice.taxRate) > 0) {
      doc.text(`Tax (${Number(invoice.taxRate)}%):`, totalsX, y, { width: 80 });
      doc.text(`${sym}${fmt(tax)}`, totalsX + 80, y, { width: 76, align: 'right' });
      y += 18;
    }
    doc.moveTo(totalsX, y).lineTo(totalsX + 156, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 10;
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold');
    doc.text('TOTAL', totalsX, y, { width: 80 });
    doc.text(`${sym}${fmt(total)}`, totalsX + 80, y, { width: 76, align: 'right' });

    // Footer
    const footerY = doc.page.height - 70;
    doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
       .text('Thank you for your business.', 56, footerY + 20, { align: 'center', width: doc.page.width - 112 });
    doc.fillColor('#94a3b8').fontSize(8)
       .text(`Generated by ${branding.name}`, 56, footerY + 38, { align: 'center', width: doc.page.width - 112 });

    doc.end();
  }),
);

router.post(
  '/:id/payments/razorpay/order',
  asyncHandler(async (req, res) => {
    const body = z.object({ currency: z.string().default('INR') }).parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    const order = await razorpayService.createOrder(totalFor(invoice), body.currency, invoice.invoiceNumber);
    await prisma.payment.create({
      data: { invoiceId: invoice.id, provider: 'razorpay', providerOrderId: order.id, amount: totalFor(invoice), currency: body.currency, status: 'created', rawPayload: order },
    });
    res.json({ success: true, data: order });
  }),
);

router.post(
  '/:id/payments/razorpay/verify',
  asyncHandler(async (req, res) => {
    const body = z.object({ razorpay_order_id: z.string(), razorpay_payment_id: z.string(), razorpay_signature: z.string() }).parse(req.body);
    razorpayService.verifySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'Paid' }, include });
    await prisma.payment.updateMany({
      where: { invoiceId: req.params.id, providerOrderId: body.razorpay_order_id },
      data: { providerPaymentId: body.razorpay_payment_id, status: 'paid', rawPayload: body },
    });
    res.json({ success: true, data: presentInvoice(invoice) });
  }),
);

export default router;
