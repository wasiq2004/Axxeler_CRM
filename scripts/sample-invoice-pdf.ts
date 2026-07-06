// Generates sample invoice PDFs using the SAME PDFKit layout the server uses for
// GET /api/invoices/:id/pdf. Run: npx tsx scripts/sample-invoice-pdf.ts
import PDFDocument from 'pdfkit';
import fs from 'node:fs';

// Mirrors the symbols the server route uses (invoices.routes.ts), incl. the
// PDF-safe fallback for glyphs Helvetica can't render (₹, د.إ).
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', CAD: 'C$', JPY: '¥', AED: 'د.إ', SGD: 'S$',
};
const PDF_SAFE_SYMBOLS: Record<string, string> = { '₹': 'Rs. ', 'د.إ': 'AED ' };
const rawSymbol = CURRENCY_SYMBOLS['INR'];
const pdfSymbol = PDF_SAFE_SYMBOLS[rawSymbol] || rawSymbol;

const branding = {
  name: 'Axxeler CRM Inc.',
  currencyCode: 'INR',
  currencySymbol: pdfSymbol,
  bankDetails:
    'Bank: HDFC Bank\nAccount Name: Axxeler CRM Inc.\nAccount No: 5010 0123 4567 89\nIFSC: HDFC0001234\nBranch: MG Road, Bengaluru',
};

type Item = { description: string; quantity: number; price: number };
type Invoice = {
  invoiceNumber: string;
  invoiceType: 'General' | 'Tax';
  status: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  paymentTerms: string | null;
  items: Item[];
};

const money = (n: number) =>
  `${branding.currencySymbol}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function renderInvoice(invoice: Invoice, outFile: string) {
  const subtotal = invoice.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * ((invoice.taxRate || 0) / 100);
  const total = subtotal + tax;

  const doc = new PDFDocument({ margin: 56, size: 'A4' });
  doc.pipe(fs.createWriteStream(outFile));

  const PRIMARY = '#0079C1';
  const GRAY = '#64748b';
  const LIGHT = '#f1f5f9';
  const pageWidth = doc.page.width - 112;

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill(PRIMARY);
  const invoiceTitle = invoice.invoiceType === 'Tax' ? 'TAX INVOICE' : 'INVOICE';
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text(invoiceTitle, 56, 30);
  doc.fontSize(11).font('Helvetica').text(`#${invoice.invoiceNumber}`, 56, 62);
  doc.fontSize(13).font('Helvetica-Bold').text(branding.name, doc.page.width - 250, 30, { width: 200, align: 'right' });
  doc.fontSize(10).font('Helvetica-Bold').text(invoice.status.toUpperCase(), doc.page.width - 250, 52, { width: 200, align: 'right' });

  // Bill to
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('BILL TO', 56, 110, { characterSpacing: 1.5 });
  doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold').text(invoice.clientName, 56, 125);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(invoice.clientCompany || '', 56, 142).text(invoice.clientEmail, 56, 157);

  // Dates
  const dateX = doc.page.width - 220;
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('INVOICE DATE', dateX, 110, { characterSpacing: 1 });
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(invoice.issueDate, dateX, 125);
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('DUE DATE', dateX, 145, { characterSpacing: 1 });
  doc.fillColor('#dc2626').fontSize(10).font('Helvetica-Bold').text(invoice.dueDate, dateX, 160);

  doc.moveTo(56, 185).lineTo(56 + pageWidth, 185).strokeColor(LIGHT).lineWidth(1).stroke();

  // Table header
  const tableTop = 200;
  doc.rect(56, tableTop, pageWidth, 26).fill(LIGHT);
  doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPTION', 66, tableTop + 9);
  doc.text('QTY', 350, tableTop + 9, { width: 50, align: 'right' });
  doc.text('UNIT PRICE', 405, tableTop + 9, { width: 80, align: 'right' });
  doc.text('AMOUNT', 490, tableTop + 9, { width: 70, align: 'right' });

  let y = tableTop + 32;
  invoice.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(56, y - 4, pageWidth, 24).fill('#fafafa');
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(item.description, 66, y, { width: 280 });
    doc.text(String(item.quantity), 350, y, { width: 50, align: 'right' });
    doc.text(money(item.price), 405, y, { width: 80, align: 'right' });
    doc.text(money(item.price * item.quantity), 490, y, { width: 70, align: 'right' });
    y += 28;
  });

  y += 10;
  doc.moveTo(56, y).lineTo(56 + pageWidth, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  y += 14;

  const totalsX = 320;
  const valX = totalsX + 100;
  const valW = 119;
  doc.fillColor(GRAY).fontSize(10).font('Helvetica');
  doc.text('Subtotal:', totalsX, y, { width: 100 });
  doc.text(money(subtotal), valX, y, { width: valW, align: 'right', lineBreak: false });
  y += 18;
  if (invoice.taxRate > 0) {
    doc.text(`Tax (${invoice.taxRate}%):`, totalsX, y, { width: 100 });
    doc.text(money(tax), valX, y, { width: valW, align: 'right', lineBreak: false });
    y += 18;
  }
  doc.moveTo(totalsX, y).lineTo(valX + valW, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
  y += 10;
  doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold');
  doc.text('TOTAL', totalsX, y, { width: 100 });
  doc.text(money(total), valX, y, { width: valW, align: 'right', lineBreak: false });

  // Payment terms + bank details
  let infoY = y + 40;
  if (invoice.paymentTerms && invoice.paymentTerms.trim()) {
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('PAYMENT REF / TERMS', 56, infoY, { characterSpacing: 1 });
    infoY += 14;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(invoice.paymentTerms.trim(), 56, infoY, { width: 300 });
    infoY += doc.heightOfString(invoice.paymentTerms.trim(), { width: 300 }) + 16;
  }
  if (branding.bankDetails && branding.bankDetails.trim()) {
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('BANK ACCOUNT DETAILS', 56, infoY, { characterSpacing: 1 });
    infoY += 14;
    doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(branding.bankDetails.trim(), 56, infoY, { width: 300 });
  }

  doc.page.margins.bottom = 0;
  const footerY = doc.page.height - 70;
  doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT);
  doc.fillColor(GRAY).fontSize(9).font('Helvetica').text('Thank you for your business.', 56, footerY + 20, { align: 'center', width: doc.page.width - 112, lineBreak: false });
  doc.fillColor('#94a3b8').fontSize(8).text(`Generated by ${branding.name}`, 56, footerY + 38, { align: 'center', width: doc.page.width - 112, lineBreak: false });

  doc.end();
}

const items: Item[] = [
  { description: 'Enterprise CRM Plan — Annual Subscription', quantity: 1, price: 60000 },
  { description: 'Onboarding & Data Migration', quantity: 1, price: 25000 },
  { description: 'Custom WhatsApp Integration', quantity: 1, price: 15000 },
  { description: 'Priority Support (per month)', quantity: 12, price: 2000 },
];

renderInvoice(
  {
    invoiceNumber: 'INV-0001',
    invoiceType: 'Tax',
    status: 'Due',
    clientName: 'Rahul Sharma',
    clientCompany: 'Acme Technologies Pvt. Ltd.',
    clientEmail: 'accounts@acmetech.in',
    issueDate: '2026-07-04',
    dueDate: '2026-07-19',
    taxRate: 18,
    paymentTerms: 'Payment due within 15 days via NEFT/UPI. Please quote invoice no. as reference. PO: ACME-2026-118',
    items,
  },
  'sample-tax-invoice.pdf',
);

renderInvoice(
  {
    invoiceNumber: 'INV-0002',
    invoiceType: 'General',
    status: 'Draft',
    clientName: 'Priya Nair',
    clientCompany: 'BlueOcean Retail',
    clientEmail: 'priya@blueocean.co',
    issueDate: '2026-07-04',
    dueDate: '2026-07-14',
    taxRate: 0,
    paymentTerms: 'Payable on receipt. Bank transfer preferred.',
    items: items.slice(0, 2),
  },
  'sample-general-invoice.pdf',
);

console.log('Wrote sample-tax-invoice.pdf and sample-general-invoice.pdf');
