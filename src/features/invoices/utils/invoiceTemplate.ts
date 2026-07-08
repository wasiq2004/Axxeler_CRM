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
  { key: 'companyLogoImg', label: 'Your company logo as a ready <img> tag' },
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

  const logoUrl = (company.logo || '').toString().trim();
  const mkLogo = (h: number) =>
    logoUrl
      ? `<img src="${esc(logoUrl)}" alt="${esc(company.name)}" style="height:${h}px;max-width:${h * 4}px;object-fit:contain;display:block;margin-bottom:14px;" />`
      : '';
  const companyLogoImg = mkLogo(56);

  return {
    companyName: esc(company.name),
    companyAddress: esc(company.address),
    companyPhone: esc(company.phone),
    companyEmail: esc(company.email),
    companyWebsite: esc(company.website),
    companyLogo: esc(company.logo),
    // Ready-to-drop <img> for the logo (empty when none set, so no broken image).
    companyLogoImg,
    companyLogoImgSm: mkLogo(40),
    companyLogoImgLg: mkLogo(80),
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
      {{companyLogoImg}}
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#0079C1;">{{companyName}}</h1>
      <p style="margin:6px 0 0;white-space:pre-line;color:#64748b;font-size:13px;">{{companyAddress}}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">{{companyPhone}} · {{companyEmail}}</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:13px;">{{companyWebsite}}</p>
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

// ─── Visual (no-HTML) template builder ────────────────────────────────────────
// A professional set of options non-technical users can tweak; we generate the
// full template HTML from them. The chosen options are embedded in the template
// as a base64 comment so the builder can reopen and edit them later.
export interface TemplateConfig {
  layout: 'classic' | 'band' | 'minimal' | 'sidebar';
  accentColor: string;
  textColor: string;
  fontFamily: string;
  fontScale: 'sm' | 'md' | 'lg';
  showLogo: boolean;
  logoSize: 'sm' | 'md' | 'lg';
  accentTableHeader: boolean;
  rounded: boolean;
  showAddress: boolean;
  showWebsite: boolean;
  showPaymentTerms: boolean;
  showBankDetails: boolean;
  footerNote: string;
}

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Sans (modern)', value: "'Segoe UI',Roboto,Helvetica,Arial,sans-serif" },
  { label: 'Serif (classic)', value: "Georgia,'Times New Roman',serif" },
  { label: 'Rounded', value: "'Trebuchet MS',Verdana,sans-serif" },
  { label: 'Monospace', value: "'Courier New',monospace" },
];

export const LAYOUT_OPTIONS: { value: TemplateConfig['layout']; label: string; hint: string }[] = [
  { value: 'classic', label: 'Classic', hint: 'Company left, accent underline' },
  { value: 'band', label: 'Color band', hint: 'Bold colored header bar' },
  { value: 'minimal', label: 'Minimal', hint: 'Clean, lots of whitespace' },
  { value: 'sidebar', label: 'Sidebar', hint: 'Accent strip down the side' },
];

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  layout: 'classic',
  accentColor: '#0079C1',
  textColor: '#1e293b',
  fontFamily: FONT_OPTIONS[0].value,
  fontScale: 'md',
  showLogo: true,
  logoSize: 'md',
  accentTableHeader: false,
  rounded: false,
  showAddress: true,
  showWebsite: true,
  showPaymentTerms: true,
  showBankDetails: true,
  footerNote: 'Thank you for your business.',
};

const CFG_MARK = 'TPLCFG:';

export const parseTemplateConfig = (html: string): TemplateConfig | null => {
  const m = html.match(/<!--\s*TPLCFG:([A-Za-z0-9+/=]+)\s*-->/);
  if (!m) return null;
  try {
    const json = typeof atob === 'function' ? atob(m[1]) : Buffer.from(m[1], 'base64').toString('utf-8');
    const raw = JSON.parse(json) as Partial<TemplateConfig> & { headerStyle?: string };
    // Back-compat: earlier templates used `headerStyle` instead of `layout`.
    if (!raw.layout && raw.headerStyle) raw.layout = raw.headerStyle === 'band' ? 'band' : raw.headerStyle === 'minimal' ? 'minimal' : 'classic';
    return { ...DEFAULT_TEMPLATE_CONFIG, ...raw };
  } catch {
    return null;
  }
};

export const stripTemplateConfig = (html: string): string =>
  html.replace(/<!--\s*TPLCFG:[A-Za-z0-9+/=]+\s*-->\s*/g, '');

// Generate a complete invoice template (with {{merge}} fields intact) from config.
export const buildTemplateFromConfig = (cfg: TemplateConfig): string => {
  const c = { ...DEFAULT_TEMPLATE_CONFIG, ...cfg };
  const accent = c.accentColor || '#0079C1';
  const text = c.textColor || '#1e293b';
  const font = c.fontFamily || DEFAULT_TEMPLATE_CONFIG.fontFamily;
  const base = c.fontScale === 'sm' ? 12 : c.fontScale === 'lg' ? 15 : 13.5;
  const name = base + 12, title = base + 16, totalSz = base + 3, small = base - 1.5, label = Math.max(9.5, base - 2.5);
  const radius = c.rounded ? '14px' : '0';
  const logoField = !c.showLogo ? '' : c.logoSize === 'sm' ? '{{companyLogoImgSm}}' : c.logoSize === 'lg' ? '{{companyLogoImgLg}}' : '{{companyLogoImg}}';
  const footer = esc(c.footerNote || '');
  const b64 = (() => { const j = JSON.stringify(c); return typeof btoa === 'function' ? btoa(j) : Buffer.from(j, 'utf-8').toString('base64'); })();

  // Company + client blocks (reused across layouts).
  const addr = c.showAddress ? `<p style="margin:6px 0 0;white-space:pre-line;color:#64748b;font-size:${small}px;">{{companyAddress}}</p>` : '';
  const web = c.showWebsite ? `<p style="margin:4px 0 0;color:#64748b;font-size:${small}px;">{{companyWebsite}}</p>` : '';
  const companyLight = `<div>${logoField}
      <h1 style="margin:0;font-size:${name}px;font-weight:800;color:${accent};">{{companyName}}</h1>
      ${addr}
      <p style="margin:4px 0 0;color:#64748b;font-size:${small}px;">{{companyPhone}} · {{companyEmail}}</p>
      ${web}
    </div>`;
  const metaLight = `<div style="text-align:right;">
      <h2 style="margin:0;font-size:${title}px;font-weight:800;letter-spacing:2px;color:#0f172a;">{{invoiceTypeLabel}}</h2>
      <p style="margin:6px 0 0;color:#64748b;font-size:${small}px;">#{{invoiceNumber}}</p>
      <span style="display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;background:${accent}1a;color:${accent};font-size:${label}px;font-weight:700;text-transform:uppercase;">{{status}}</span>
    </div>`;

  // Header per layout.
  let headerHtml: string;
  let bodyTopPad = '44px';
  const pad = '44px';
  if (c.layout === 'band') {
    const addrD = c.showAddress ? `<p style="margin:6px 0 0;white-space:pre-line;font-size:${small}px;opacity:.9;">{{companyAddress}}</p>` : '';
    const webD = c.showWebsite ? `<p style="margin:4px 0 0;font-size:${small}px;opacity:.9;">{{companyWebsite}}</p>` : '';
    headerHtml = `<div style="background:${accent};color:#fff;padding:32px ${pad};display:flex;justify-content:space-between;align-items:flex-start;">
      <div>${c.showLogo ? `<div style="background:#fff;display:inline-block;padding:6px 10px;border-radius:8px;margin-bottom:12px;">${logoField}</div>` : ''}
        <h1 style="margin:0;font-size:${name}px;font-weight:800;">{{companyName}}</h1>
        ${addrD}
        <p style="margin:4px 0 0;font-size:${small}px;opacity:.9;">{{companyPhone}} · {{companyEmail}}</p>
        ${webD}
      </div>
      <div style="text-align:right;">
        <h2 style="margin:0;font-size:${title}px;font-weight:800;letter-spacing:2px;">{{invoiceTypeLabel}}</h2>
        <p style="margin:6px 0 0;font-size:${small}px;opacity:.9;">#{{invoiceNumber}}</p>
        <span style="display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;background:rgba(255,255,255,.2);font-size:${label}px;font-weight:700;text-transform:uppercase;">{{status}}</span>
      </div>
    </div>`;
    bodyTopPad = '28px';
  } else {
    const border = c.layout === 'classic' ? `border-bottom:3px solid ${accent};` : c.layout === 'sidebar' ? `border-bottom:1px solid #eef2f7;` : '';
    headerHtml = `<div style="padding:${pad} ${pad} 0;"><div style="display:flex;justify-content:space-between;align-items:flex-start;${border}padding-bottom:24px;margin-bottom:8px;">
      ${companyLight}
      ${metaLight}
    </div></div>`;
    bodyTopPad = '20px';
  }

  const thBg = c.accentTableHeader ? accent : '#f8fafc';
  const thColor = c.accentTableHeader ? '#ffffff' : '#64748b';
  const itemsTable = `<table style="width:100%;border-collapse:collapse;font-size:${base}px;color:${text};">
      <thead><tr style="background:${thBg};color:${thColor};text-transform:uppercase;font-size:${label}px;letter-spacing:.05em;">
        <th style="padding:10px 12px;text-align:left;">Description</th>
        <th style="padding:10px 12px;text-align:center;">Qty</th>
        <th style="padding:10px 12px;text-align:right;">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;">Amount</th>
      </tr></thead>
      <tbody>{{itemRows}}</tbody>
    </table>`;

  const pt = c.showPaymentTerms ? '{{paymentTermsBlock}}' : '';
  const bd = c.showBankDetails ? '{{bankDetailsBlock}}' : '';
  const outerBorder = c.layout === 'sidebar' ? `border-left:8px solid ${accent};` : '';

  return `<!--${CFG_MARK}${b64}-->
<div style="max-width:800px;margin:0 auto;font-family:${font};color:${text};background:#ffffff;border-radius:${radius};overflow:hidden;${outerBorder}">
  ${headerHtml}
  <div style="padding:${bodyTopPad} ${pad} 44px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:28px;font-size:${base}px;">
      <div>
        <p style="margin:0 0 6px;font-size:${label}px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Billed To</p>
        <p style="margin:0;font-weight:700;">{{clientName}}</p>
        <p style="margin:2px 0 0;color:#475569;">{{clientCompany}}</p>
        <p style="margin:2px 0 0;color:#475569;">{{clientEmail}}</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0 0 6px;font-size:${label}px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:700;">Details</p>
        <p style="margin:0;color:#475569;"><strong>Issued:</strong> {{issueDate}}</p>
        <p style="margin:2px 0 0;color:#475569;"><strong>Due:</strong> {{dueDate}}</p>
      </div>
    </div>

    ${itemsTable}

    <div style="display:flex;justify-content:flex-end;margin-top:24px;">
      <table style="width:280px;font-size:${base}px;color:#334155;">
        <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">{{subtotal}}</td></tr>
        {{taxRow}}
        <tr style="border-top:2px solid #e2e8f0;"><td style="padding:10px 0;font-weight:800;font-size:${totalSz}px;">Total Due</td><td style="padding:10px 0;text-align:right;font-weight:800;font-size:${totalSz}px;color:${accent};">{{total}}</td></tr>
      </table>
    </div>

    ${pt}
    ${bd}

    <p style="margin-top:44px;padding-top:20px;border-top:1px solid #eef2f7;text-align:center;color:#94a3b8;font-size:${small}px;">
      ${footer} · {{companyName}}
    </p>
  </div>
</div>`;
};

// The single source of truth for an invoice's HTML: a per-invoice custom design,
// else its selected template, else the built-in default. Used by the detail view,
// the PDF download and the designer so every surface renders identically.
export const resolveInvoiceHtml = async (
  invoice: { customHtml?: string | null; templateId?: string | null },
  crmApi: { getInvoiceTemplates: () => Promise<any> },
): Promise<string> => {
  if (invoice.customHtml && invoice.customHtml.trim()) return invoice.customHtml;
  if (invoice.templateId) {
    try {
      const res = await crmApi.getInvoiceTemplates();
      const t = (res.data || []).find((x: any) => x.id === invoice.templateId);
      if (t?.html) return t.html;
    } catch {
      /* fall through to default */
    }
  }
  return DEFAULT_INVOICE_TEMPLATE;
};
