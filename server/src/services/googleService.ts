import { google } from 'googleapis';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export const DEFAULT_LEAD_MAPPING: Record<string, string> = {
  'CRM ID': 'id',
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Email': 'email',
  'Phone': 'phone',
  'Company': 'company',
  'Status': 'status',
  'Source': 'source',
  'Score': 'score',
  'Tags': 'tags',
  'Created At': 'createdAt',
};

export const DEFAULT_CONTACT_MAPPING: Record<string, string> = {
  'CRM ID': 'id',
  'Name': 'name',
  'Phone': 'phone',
  'Email': 'email',
  'Tags': 'tags',
  'Source': 'source',
  'Group': 'groupName',
  'Created At': 'createdAt',
};

async function _getGoogleCreds(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
  const record = await prisma.integrationConfig.findUnique({ where: { provider: 'google_oauth_app' } });
  const cfg = (record?.config || {}) as Record<string, string>;
  const defaultRedirect =
    cfg.redirectUri ||
    env.GOOGLE_REDIRECT_URI ||
    `${(env.CLIENT_ORIGIN || 'http://localhost:3000').replace(':3000', ':4000')}/api/google/callback`;
  return {
    clientId: cfg.clientId || env.GOOGLE_CLIENT_ID || '',
    clientSecret: cfg.clientSecret || env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: defaultRedirect,
  };
}

async function createOAuth2Client() {
  const creds = await _getGoogleCreds();
  return new google.auth.OAuth2(creds.clientId, creds.clientSecret, creds.redirectUri);
}

async function getAuthenticatedClient() {
  const record = await prisma.integrationConfig.findUnique({ where: { provider: 'google' } });
  const cfg = (record?.config || {}) as Record<string, string>;
  if (!cfg.refreshToken) throw new Error('Google account not connected');

  const auth = await createOAuth2Client();
  auth.setCredentials({
    refresh_token: cfg.refreshToken,
    access_token: cfg.accessToken || undefined,
    expiry_date: cfg.tokenExpiry ? Number(cfg.tokenExpiry) : undefined,
  });

  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const updated = { ...cfg, accessToken: tokens.access_token };
      if (tokens.expiry_date) updated.tokenExpiry = String(tokens.expiry_date);
      await prisma.integrationConfig.update({
        where: { provider: 'google' },
        data: { config: updated },
      });
    }
  });

  return auth;
}

function recordToRow(record: Record<string, any>, mapping: Record<string, string>): string[] {
  return Object.values(mapping).map(field => {
    let val = record[field];
    if (Array.isArray(val)) val = val.join(', ');
    if (val instanceof Date) val = val.toISOString().slice(0, 10);
    return val != null ? String(val) : '';
  });
}

export const googleService = {
  async getAuthUrl(state?: string): Promise<string> {
    const auth = await createOAuth2Client();
    return auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state,
    });
  },

  async exchangeCode(code: string) {
    const auth = await createOAuth2Client();
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data: userInfo } = await oauth2.userinfo.get();

    return { tokens, userInfo };
  },

  async getConnection() {
    const record = await prisma.integrationConfig.findUnique({ where: { provider: 'google' } });
    const cfg = (record?.config || {}) as Record<string, string>;
    if (!cfg.refreshToken) return { connected: false };
    return { connected: true, email: cfg.email, name: cfg.name };
  },

  async listSpreadsheets() {
    const auth = await getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });
    const { data } = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id,name)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    });
    return data.files || [];
  },

  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const { data } = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title',
    });
    return (data.sheets || []).map(s => s.properties?.title || '').filter(Boolean);
  },

  async initializeSheet(spreadsheetId: string, sheetName: string, mapping: Record<string, string>): Promise<void> {
    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const headers = Object.keys(mapping);
    const range = `'${sheetName}'!A1`;
    try {
      const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName}'!A1:1` });
      if (data.values && data.values[0]?.[0] === headers[0]) return;
    } catch {
      // ignore — sheet may be empty
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  },

  async syncRecordToSheet(entityType: 'leads' | 'contacts', record: Record<string, any>): Promise<void> {
    const config = await prisma.googleSyncConfig.findFirst({ where: { entityType, isActive: true } });
    if (!config) return;

    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const mapping = config.columnMapping as Record<string, string>;
    const { spreadsheetId, sheetName } = config;

    const { data: colA } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:A`,
    });

    const rows = colA.values || [];
    const values = recordToRow(record, mapping);

    // Row 0 is header, data starts at row index 1
    const dataRows = rows.slice(1);
    const matchIndex = dataRows.findIndex(r => r[0] === record.id);

    if (matchIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [values] },
      });
    } else {
      const sheetRow = matchIndex + 2; // +1 for header, +1 for 1-based index
      const endCol = String.fromCharCode(64 + Object.keys(mapping).length);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A${sheetRow}:${endCol}${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      });
    }

    await prisma.googleSyncConfig.update({
      where: { id: config.id },
      data: { lastSyncedAt: new Date() },
    });
  },

  async fullSync(entityType: 'leads' | 'contacts'): Promise<{ synced: number }> {
    const config = await prisma.googleSyncConfig.findFirst({ where: { entityType, isActive: true } });
    if (!config) throw new Error(`No active Google sync config for ${entityType}`);

    const mapping = config.columnMapping as Record<string, string>;
    await googleService.initializeSheet(config.spreadsheetId, config.sheetName, mapping);

    let records: any[] = [];
    if (entityType === 'leads') {
      records = await prisma.lead.findMany({ orderBy: { createdAt: 'asc' } });
    } else {
      records = await prisma.contact.findMany({ orderBy: { createdAt: 'asc' } });
    }

    const auth = await getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const headers = Object.keys(mapping);
    const allRows = [headers, ...records.map(r => recordToRow(r, mapping))];

    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: `'${config.sheetName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: allRows },
    });

    await prisma.googleSyncConfig.update({
      where: { id: config.id },
      data: { lastSyncedAt: new Date() },
    });

    return { synced: records.length };
  },

  async handleSheetWebhook(
    webhookToken: string,
    rowData: Record<string, string>,
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; id?: string }> {
    const config = await prisma.googleSyncConfig.findUnique({ where: { webhookToken } });
    if (!config || !config.isActive) throw new Error('Invalid webhook token');

    const mapping = config.columnMapping as Record<string, string>;
    const reversed: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      reversed[header] = field;
    }

    const crmRecord: Record<string, any> = {};
    for (const [header, value] of Object.entries(rowData)) {
      const field = reversed[header];
      if (field && field !== 'id' && field !== 'createdAt' && value !== '') {
        crmRecord[field] = value;
      }
    }

    const crmId = rowData['CRM ID'] || '';

    if (config.entityType === 'leads') {
      if (crmId) {
        const existing = await prisma.lead.findUnique({ where: { id: crmId } });
        if (existing) {
          await prisma.lead.update({ where: { id: crmId }, data: crmRecord });
          return { action: 'updated', id: crmId };
        }
      }
      if (crmRecord.firstName && crmRecord.email) {
        const created = await prisma.lead.create({
          data: {
            firstName: crmRecord.firstName || '',
            lastName: crmRecord.lastName || '',
            email: crmRecord.email || '',
            phone: crmRecord.phone || '',
            company: crmRecord.company || '',
            source: crmRecord.source || 'Google Sheets',
            status: 'New' as any,
          },
        });
        return { action: 'created', id: created.id };
      }
    } else if (config.entityType === 'contacts') {
      if (crmId) {
        const existing = await prisma.contact.findUnique({ where: { id: crmId } });
        if (existing) {
          await prisma.contact.update({ where: { id: crmId }, data: crmRecord });
          return { action: 'updated', id: crmId };
        }
      }
      if (crmRecord.phone) {
        const phone = String(crmRecord.phone);
        const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
        const existing = await prisma.contact.findUnique({ where: { normalizedPhone } });
        if (existing) {
          await prisma.contact.update({ where: { id: existing.id }, data: crmRecord });
          return { action: 'updated', id: existing.id };
        }
        const created = await prisma.contact.create({
          data: {
            name: crmRecord.name || '',
            phone,
            normalizedPhone,
            tags: crmRecord.tags ? crmRecord.tags.split(',').map((t: string) => t.trim()) : [],
            source: crmRecord.source || 'Google Sheets',
            customFields: {},
          },
        });
        return { action: 'created', id: created.id };
      }
    }

    return { action: 'skipped' };
  },
};
