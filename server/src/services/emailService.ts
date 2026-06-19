import { Resend } from 'resend';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Resolve the company/brand name from settings, falling back to a neutral label.
const getBrandName = async (): Promise<string> => {
  try {
    const company = await prisma.companySetting.findUnique({ where: { id: 'company' } });
    return company?.name?.trim() || 'CRM';
  } catch {
    return 'CRM';
  }
};

const send = async (to: string, subject: string, html: string) => {
  if (!resend) {
    console.log(`[email:dev] TO: ${to} | SUBJECT: ${subject}`);
    return { id: `dev_email_${Date.now()}` };
  }
  const result = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

const baseTemplate = (content: string, brandName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0079C1 0%, #005fa3 100%); padding: 32px 40px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }
    .body { padding: 36px 40px; }
    .footer { padding: 20px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-red { background: #fee2e2; color: #dc2626; }
    .badge-yellow { background: #fef9c3; color: #a16207; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 14px; text-align: left; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #374151; }
    .total-row td { font-weight: 700; background: #f8fafc; }
    .btn { display: inline-block; padding: 12px 24px; background: #0079C1; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .info-label { color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Sent by ${brandName} &bull; This is an automated email</p>
    </div>
  </div>
</body>
</html>
`;

export const emailService = {
  async send(to: string, subject: string, html: string) {
    return send(to, subject, html);
  },

  async sendInvoiceEmail(invoice: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    issueDate: string;
    dueDate: string;
    taxRate: number;
    status: string;
    items: Array<{ description: string; quantity: number; price: number }>;
  }) {
    const brandName = await getBrandName();
    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const tax = subtotal * (Number(invoice.taxRate) / 100);
    const total = subtotal + tax;

    const itemRows = invoice.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">$${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right">$${(Number(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const html = baseTemplate(`
      <div class="header">
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p>From ${brandName}</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Hi <strong>${invoice.clientName}</strong>,<br/><br/>
          Please find your invoice details below. Payment is due by <strong>${invoice.dueDate}</strong>.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
          <div class="info-row"><span class="info-label">Invoice #</span><span class="info-value">${invoice.invoiceNumber}</span></div>
          <div class="info-row"><span class="info-label">Company</span><span class="info-value">${invoice.clientCompany}</span></div>
          <div class="info-row"><span class="info-label">Issue Date</span><span class="info-value">${invoice.issueDate}</span></div>
          <div class="info-row" style="border:none"><span class="info-label">Due Date</span><span class="info-value"><strong>${invoice.dueDate}</strong></span></div>
        </div>
        <table>
          <thead>
            <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Amount</th></tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr class="total-row"><td colspan="3">Subtotal</td><td style="text-align:right">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
            ${invoice.taxRate > 0 ? `<tr class="total-row"><td colspan="3">Tax (${invoice.taxRate}%)</td><td style="text-align:right">$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
            <tr class="total-row"><td colspan="3" style="font-size:16px">Total Due</td><td style="text-align:right;font-size:16px;color:#0079C1">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          </tbody>
        </table>
        <p style="color:#64748b;font-size:13px;margin-top:24px">
          If you have any questions about this invoice, please don't hesitate to reach out to us.
        </p>
      </div>
    `, brandName);

    return send(invoice.clientEmail, `Invoice ${invoice.invoiceNumber} from ${brandName}`, html);
  },

  async sendTaskReminderEmail(params: {
    assigneeName: string;
    assigneeEmail: string;
    taskTitle: string;
    taskDescription?: string;
    dueDate: string;
    priority: string;
    relatedTo?: { type: string; name: string } | null;
  }) {
    const brandName = await getBrandName();
    const priorityBadge = params.priority === 'High'
      ? `<span class="badge badge-red">High Priority</span>`
      : params.priority === 'Medium'
      ? `<span class="badge badge-yellow">Medium Priority</span>`
      : `<span class="badge badge-blue">Low Priority</span>`;

    const html = baseTemplate(`
      <div class="header">
        <h1>Task Reminder</h1>
        <p>Due tomorrow — don't forget!</p>
      </div>
      <div class="body">
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          Hi <strong>${params.assigneeName}</strong>,<br/><br/>
          This is a friendly reminder that the following task is due <strong>tomorrow</strong>.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid #0079C1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <h2 style="margin:0;font-size:18px;color:#1e293b;font-weight:800">${params.taskTitle}</h2>
            ${priorityBadge}
          </div>
          ${params.taskDescription ? `<p style="color:#475569;font-size:14px;margin:12px 0">${params.taskDescription}</p>` : ''}
          <div class="info-row"><span class="info-label">Due Date</span><span class="info-value" style="color:#dc2626"><strong>${params.dueDate}</strong></span></div>
          ${params.relatedTo ? `<div class="info-row" style="border:none"><span class="info-label">Related To</span><span class="info-value">${params.relatedTo.type}: ${params.relatedTo.name}</span></div>` : ''}
        </div>
        <p style="color:#64748b;font-size:13px">
          Log in to ${brandName} to update the status of this task.
        </p>
      </div>
    `, brandName);

    return send(
      params.assigneeEmail,
      `Reminder: "${params.taskTitle}" is due tomorrow`,
      html,
    );
  },
};
