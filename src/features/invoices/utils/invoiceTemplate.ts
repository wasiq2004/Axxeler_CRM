import DOMPurify from 'dompurify';
import type { Invoice } from '@/types';

// Sanitize author-supplied invoice HTML before it is ever injected into the DOM
// (preview panels) or captured for a PDF. Strips <script>, on* handlers and
// javascript: URLs while keeping normal invoice markup + inline styles.
export const sanitizeInvoiceHtml = (html: string): string =>
  DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

// ── Merge fields available to invoice HTML templates ──────────────────────────
// Authors reference these as {{fieldName}} in their HTML.
export const MERGE_FIELDS: { key: string; label: string }[] = [
  { key: 'companyName', label: 'Your company name' },
  { key: 'companyAddress', label: 'Your company address' },
  { key: 'companyPhone', label: 'Your company phone' },
  { key: 'companyEmail', label: 'Your company email' },
  { key: 'companyWebsite', label: 'Your company website' },
  { key: 'companyLogo', label: 'Your company logo URL (use in <img src>)' },
  { key: 'invoiceNumber', label: 'Invoice number' },
  { key: 'invoiceType', label: 'Invoice type (General / Tax)' },
  { key: 'invoiceTypeLabel', label: 'Title — "TAX INVOICE" or "INVOICE"' },
  { key: 'status', label: 'Invoice status' },
  { key: 'issueDate', label: 'Issue date' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'clientName', label: 'Client name' },
  { key: 'clientCompany', label: 'Client company' },
  { key: 'clientEmail', label: 'Client email' },
  { key: 'currencySymbol', label: 'Currency symbol' },
  { key: 'subtotal', label: 'Subtotal (formatted)' },
  { key: 'taxRate', label: 'Tax rate %' },
  { key: 'taxAmount', label: 'Tax amount (formatted)' },
  { key: 'taxRow', label: 'Tax <tr> row (empty for General invoices)' },
  { key: 'total', label: 'Grand total (formatted)' },
  { key: 'paymentTerms', label: 'Payment ref / terms (raw text)' },
  { key: 'paymentTermsBlock', label: 'Payment ref/terms block (empty if none)' },
  { key: 'bankDetails', label: 'Bank account details (raw text)' },
  { key: 'bankDetailsBlock', label: 'Bank account details block (empty if none)' },
  { key: 'itemRows', label: 'Line-item <tr> rows (put inside your own <table>)' },
  { key: 'itemsTable', label: 'A complete, ready-styled line-items table' },
];

export interface CompanyInfoLike {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  bankDetails?: string;
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const money = (n: number, symbol: string) =>
  `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Build the merge-field values for a given invoice.
export const buildInvoiceContext = (
  invoice: Invoice,
  company: CompanyInfoLike,
  currencySymbol: string,
): Record<string, string> => {
  const items = invoice.items || [];
  const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const taxRate = Number(invoice.taxRate || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const invoiceType = invoice.invoiceType === 'General' ? 'General' : 'Tax';
  const paymentTerms = (invoice.paymentTerms || '').toString();
  const bankDetails = (company.bankDetails || '').toString();

  // Conditional, pre-styled blocks so templates stay simple and General invoices
  // cleanly omit the tax row.
  const taxRow =
    taxRate > 0
      ? `<tr><td style="padding:6px 0;">Tax (${esc(taxRate)}%)</td><td style="padding:6px 0;text-align:right;">${money(taxAmount, currencySymbol)}</td></tr>`
      : '';
  const paymentTermsBlock = paymentTerms.trim()
    ? `<div style="margin-top:24px;"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Payment Ref / Terms</p><p style="margin:0;white-space:pre-line;color:#475569;font-size:13px;">${esc(paymentTerms)}</p></div>`
    : '';
  const bankDetailsBlock = bankDetails.trim()
    ? `<div style="margin-top:16px;"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Bank Account Details</p><p style="margin:0;white-space:pre-line;color:#475569;font-size:13px;">${esc(bankDetails)}</p></div>`
    : '';

  const itemRows = items
    .map(
      (i) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">${esc(i.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;">${esc(i.quantity)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;">${money(Number(i.price), currencySymbol)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;">${money(Number(i.price) * Number(i.quantity), currencySymbol)}</td>
      </tr>`,
    )
    .join('');

  const itemsTable = `<table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
    <thead>
      <tr style="background:#f8fafc;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:#64748b;">
        <th style="padding:10px 12px;text-align:left;">Description</th>
        <th style="padding:10px 12px;text-align:center;">Qty</th>
        <th style="padding:10px 12px;text-align:right;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>`;

  return {
    companyName: esc(company.name),
    companyAddress: esc(company.address),
    companyPhone: esc(company.phone),
    companyEmail: esc(company.email),
    companyWebsite: esc(company.website),
    companyLogo: esc(company.logo),
    invoiceNumber: esc(invoice.invoiceNumber),
    invoiceType: esc(invoiceType),
    invoiceTypeLabel: invoiceType === 'Tax' ? 'TAX INVOICE' : 'INVOICE',
    status: esc(invoice.status),
    issueDate: esc(invoice.issueDate),
    dueDate: esc(invoice.dueDate),
    clientName: esc(invoice.clientName),
    clientCompany: esc(invoice.clientCompany),
    clientEmail: esc(invoice.clientEmail),
    currencySymbol: currencySymbol,
    subtotal: money(subtotal, currencySymbol),
    taxRate: esc(taxRate),
    taxAmount: money(taxAmount, currencySymbol),
    total: money(total, currencySymbol),
    paymentTerms: esc(paymentTerms),
    bankDetails: esc(bankDetails),
    // Trusted HTML we build above — not escaped.
    taxRow,
    paymentTermsBlock,
    bankDetailsBlock,
    itemRows,
    itemsTable,
  };
};

// Replace {{field}} tokens in the template with context values. Unknown tokens
// are left as an empty string so a typo never leaks a raw {{token}} onto the PDF.
export const renderInvoiceTemplate = (html: string, ctx: Record<string, string>): string =>
  html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) =>
    Object.prototype.hasOwnProperty.call(ctx, key) ? ctx[key] : '',
  );

// A clean, professional starting template. Users can duplicate and customise it.
export const DEFAULT_INVOICE_TEMPLATE = `<div style="max-width:800px;margin:0 auto;padding:48px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;background:#ffffff;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0079C1;padding-bottom:24px;margin-bottom:32px;">
    <div>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#0079C1;">{{companyName}}</h1>
      <p style="margin:6px 0 0;white-space:pre-line;color:#64748b;font-size:13px;">{{companyAddress}}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">{{companyPhone}} · {{companyEmail}}</p>
    </div>
    <div style="text-align:right;">
      <h2 style="margin:0;font-size:30px;font-weight:800;letter-spacing:2px;color:#0f172a;">{{invoiceTypeLabel}}</h2>
      <p style="margin:6px 0 0;color:#64748b;font-size:13px;">#{{invoiceNumber}}</p>
      <span style="display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:700;text-transform:uppercase;">{{status}}</span>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:32px;font-size:14px;">
    <div>
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Billed To</p>
      <p style="margin:0;font-weight:700;">{{clientName}}</p>
      <p style="margin:2px 0 0;color:#475569;">{{clientCompany}}</p>
      <p style="margin:2px 0 0;color:#475569;">{{clientEmail}}</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Details</p>
      <p style="margin:0;color:#475569;"><strong>Issued:</strong> {{issueDate}}</p>
      <p style="margin:2px 0 0;color:#475569;"><strong>Due:</strong> {{dueDate}}</p>
    </div>
  </div>

  {{itemsTable}}

  <div style="display:flex;justify-content:flex-end;margin-top:24px;">
    <table style="width:280px;font-size:14px;color:#334155;">
      <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">{{subtotal}}</td></tr>
      {{taxRow}}
      <tr style="border-top:2px solid #e2e8f0;"><td style="padding:10px 0;font-weight:800;font-size:16px;">Total Due</td><td style="padding:10px 0;text-align:right;font-weight:800;font-size:16px;color:#0079C1;">{{total}}</td></tr>
    </table>
  </div>

  {{paymentTermsBlock}}
  {{bankDetailsBlock}}

  <p style="margin-top:48px;padding-top:20px;border-top:1px solid #eef2f7;text-align:center;color:#94a3b8;font-size:12px;">
    Thank you for your business. · {{companyName}}
  </p>
</div>`;
