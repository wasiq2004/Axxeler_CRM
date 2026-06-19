import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { metaService, MetaCreds } from '../services/metaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

const router = Router();

// Load Meta credentials from DB, falling back to env vars
async function _getMetaCreds(): Promise<MetaCreds> {
  const record = await prisma.integrationConfig.findUnique({ where: { provider: 'meta' } });
  const cfg = (record?.config || {}) as Record<string, string>;
  const defaultRedirectUri = `${env.CLIENT_ORIGIN?.replace(':3000', ':4000') || 'http://localhost:4000'}/api/meta/callback`;
  return {
    appId: cfg.appId || env.META_APP_ID || '',
    appSecret: cfg.appSecret || env.META_APP_SECRET || '',
    redirectUri: cfg.redirectUri || env.META_REDIRECT_URI || defaultRedirectUri,
    webhookVerifyToken: cfg.webhookVerifyToken || env.META_WEBHOOK_VERIFY_TOKEN || '',
  };
}

// ─── PUBLIC ROUTES (no JWT auth — called by Meta or browser redirects) ────────

// OAuth callback — Meta redirects here after the user grants permissions
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, error, error_description } = req.query as Record<string, string>;
    const clientOrigin = env.CLIENT_ORIGIN || 'http://localhost:3000';

    if (error || !code) {
      const msg = encodeURIComponent(error_description || error || 'No code returned from Meta');
      return res.redirect(`${clientOrigin}/ads-sync?meta_error=${msg}`);
    }

    try {
      const creds = await _getMetaCreds();
      const { access_token } = await metaService.exchangeCode(code, creds);
      const me = await metaService.getMe(access_token);

      await prisma.metaConnection.upsert({
        where: { metaUserId: me.id },
        update: {
          accessToken: access_token,
          isConnected: true,
          lastSynced: new Date(),
          name: me.name || 'Meta User',
          email: me.email || '',
        },
        create: {
          metaUserId: me.id,
          name: me.name || 'Meta User',
          email: me.email || '',
          accessToken: access_token,
          isConnected: true,
          lastSynced: new Date(),
        },
      });

      res.redirect(`${clientOrigin}/ads-sync?meta_connected=1`);
    } catch (err) {
      const msg = encodeURIComponent(err instanceof Error ? err.message : 'OAuth callback failed');
      res.redirect(`${clientOrigin}/ads-sync?meta_error=${msg}`);
    }
  }),
);

// Webhook verification — Meta GET to verify the endpoint is alive
router.get(
  '/webhook',
  asyncHandler(async (req, res) => {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = req.query['hub.verify_token'];

    const creds = await _getMetaCreds();
    if (mode === 'subscribe' && verifyToken === creds.webhookVerifyToken) {
      console.log('[meta-webhook] Webhook verified');
      res.status(200).send(challenge as string);
    } else {
      res.sendStatus(403);
    }
  }),
);

// Webhook receiver — Meta POSTs lead events here in real time
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const creds = await _getMetaCreds();
    // Validate signature if an app secret is configured. The signature is HMAC'd
    // over the RAW request body (re-serializing req.body would not match Meta's bytes),
    // and is REQUIRED — a missing header is rejected rather than silently accepted.
    if (creds.appSecret) {
      const signature = req.headers['x-hub-signature-256'] as string | undefined;
      const rawBody: Buffer | undefined = (req as any).rawBody;
      if (!signature || !rawBody) return res.sendStatus(403);
      const expected = `sha256=${crypto.createHmac('sha256', creds.appSecret).update(rawBody).digest('hex')}`;
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.sendStatus(403);
      }
    }

    // Respond immediately — Meta requires a 200 within 20 seconds
    res.sendStatus(200);

    const body = req.body;
    if (body.object !== 'page') return;

    const connection = await prisma.metaConnection.findFirst({ where: { isConnected: true }, orderBy: { createdAt: 'desc' } });
    if (!connection) {
      console.warn('[meta-webhook] Received lead event but no Meta connection found');
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;

        const leadId = change.value?.leadgen_id as string | undefined;
        if (!leadId) continue;

        try {
          const rawLead = await metaService.getLead(connection.accessToken, leadId);
          await _importSingleLead(rawLead);
          console.log(`[meta-webhook] Imported lead ${leadId} into CRM`);
        } catch (err) {
          console.error(`[meta-webhook] Failed to import lead ${leadId}:`, err instanceof Error ? err.message : err);
        }
      }
    }
  }),
);

// ─── AUTHENTICATED ROUTES ──────────────────────────────────────────────────────

router.use(requireAuth);

// Get current Meta connection status (no token returned to client)
router.get(
  '/connection',
  asyncHandler(async (_req, res) => {
    const connection = await prisma.metaConnection.findFirst({
      where: { isConnected: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, metaUserId: true, name: true, email: true, isConnected: true, lastSynced: true },
    });
    res.json({ success: true, data: connection });
  }),
);

// Generate OAuth URL for the frontend to redirect the user
router.get(
  '/oauth-url',
  asyncHandler(async (_req, res) => {
    const creds = await _getMetaCreds();
    if (!creds.appId) throw new HttpError(400, 'Meta App ID is not configured. Go to Settings → Integrations to add your Meta credentials.');
    const state = crypto.randomBytes(16).toString('hex');
    const url = await metaService.getOAuthUrl(state, creds);
    res.json({ success: true, data: { url, state } });
  }),
);

// Connect using a manually provided access token (System User Token etc.)
router.post(
  '/connect',
  asyncHandler(async (req, res) => {
    const body = z.object({
      code: z.string().optional(),
      accessToken: z.string().optional(),
    }).parse(req.body);

    const creds = await _getMetaCreds();
    const token = body.accessToken || (body.code ? (await metaService.exchangeCode(body.code, creds)).access_token : null);
    if (!token) throw new HttpError(400, 'Provide a Meta OAuth code or access token');

    const me = await metaService.getMe(token);

    const connection = await prisma.metaConnection.upsert({
      where: { metaUserId: me.id },
      update: { accessToken: token, isConnected: true, lastSynced: new Date(), name: me.name, email: me.email || '' },
      create: {
        metaUserId: me.id,
        name: me.name || 'Meta User',
        email: me.email || '',
        accessToken: token,
        isConnected: true,
        lastSynced: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: connection.id,
        metaUserId: connection.metaUserId,
        name: connection.name,
        email: connection.email,
        isConnected: connection.isConnected,
        lastSynced: connection.lastSynced,
      },
    });
  }),
);

// Disconnect Meta account
router.post(
  '/disconnect',
  asyncHandler(async (_req, res) => {
    await prisma.metaConnection.updateMany({ data: { isConnected: false } });
    res.json({ success: true });
  }),
);

// List ad accounts for the connected Meta user
router.get(
  '/accounts',
  asyncHandler(async (_req, res) => {
    const connection = await _requireConnection();
    const accounts = await metaService.getAdAccounts(connection.accessToken);

    for (const account of accounts) {
      await prisma.metaAdAccount.upsert({
        where: { id: account.id },
        update: { name: account.name, accountId: account.account_id, currency: account.currency, timezone: account.timezone_name, rawData: account },
        create: { id: account.id, name: account.name, accountId: account.account_id, currency: account.currency, timezone: account.timezone_name, rawData: account },
      });
    }

    res.json({ success: true, data: accounts });
  }),
);

// List campaigns for a specific ad account
router.get(
  '/accounts/:accountId/campaigns',
  asyncHandler(async (req, res) => {
    const connection = await _requireConnection();
    const campaigns = await metaService.getCampaigns(connection.accessToken, req.params.accountId as string);
    res.json({ success: true, data: campaigns });
  }),
);

// List Facebook Pages the connected user manages
router.get(
  '/pages',
  asyncHandler(async (_req, res) => {
    const connection = await _requireConnection();
    const pages = await metaService.getPages(connection.accessToken);
    res.json({ success: true, data: pages });
  }),
);

// List Lead Gen forms for a specific Facebook Page
router.get(
  '/pages/:pageId/leadforms',
  asyncHandler(async (req, res) => {
    const connection = await _requireConnection();
    // Use page access token if available in request (passed from frontend)
    const pageAccessToken = (req.query.page_token as string) || undefined;
    const forms = await metaService.getLeadForms(connection.accessToken, req.params.pageId as string, pageAccessToken);
    res.json({ success: true, data: forms });
  }),
);

// Get leads submitted to a specific Lead Form
router.get(
  '/forms/:formId/leads',
  asyncHandler(async (req, res) => {
    const connection = await _requireConnection();
    const leads = await metaService.getFormLeads(connection.accessToken, req.params.formId as string);
    res.json({ success: true, data: leads });
  }),
);

// Batch import Meta leads into the CRM
router.post(
  '/leads/import',
  asyncHandler(async (req, res) => {
    const body = z.object({ leads: z.array(z.any()) }).parse(req.body);
    const imported = [];

    for (const raw of body.leads) {
      try {
        const lead = await _importSingleLead(raw);
        imported.push(lead);
      } catch (err) {
        console.error(`[meta-import] Failed to import lead ${raw.id}:`, err instanceof Error ? err.message : err);
      }
    }

    res.status(201).json({ success: true, data: imported });
  }),
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function _requireConnection() {
  const connection = await prisma.metaConnection.findFirst({
    where: { isConnected: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!connection) throw new HttpError(400, 'No active Meta account connected. Please connect your Meta account first.');
  return connection;
}

async function _importSingleLead(raw: any) {
  const fields = Array.isArray(raw.field_data) ? raw.field_data : [];
  const field = (name: string) => fields.find((item: any) => item.name === name)?.values?.[0] || '';

  const fullName = field('full_name') || field('name') || '';
  const [firstName, ...lastParts] = fullName.trim().split(' ');

  const lead = await prisma.lead.create({
    data: {
      firstName: firstName || 'Meta',
      lastName: lastParts.join(' ') || 'Lead',
      email: field('email') || field('email_address') || `meta-${raw.id}@noreply.invalid`,
      phone: field('phone_number') || field('phone') || '',
      company: field('company_name') || field('company') || '',
      source: `Meta Ad${raw.campaign_name ? `: ${raw.campaign_name}` : ''}`,
      campaignId: raw.campaign_id || null,
      status: 'New',
      tags: ['Meta Ad'],
    },
  });

  await prisma.metaLead.upsert({
    where: { id: raw.id },
    update: { importedLeadId: lead.id, fieldData: raw.field_data || raw },
    create: {
      id: raw.id,
      formId: raw.form_id || '',
      adId: raw.ad_id || null,
      adName: raw.ad_name || null,
      campaignId: raw.campaign_id || null,
      campaignName: raw.campaign_name || null,
      fieldData: raw.field_data || raw,
      importedLeadId: lead.id,
      createdTime: raw.created_time ? new Date(raw.created_time) : new Date(),
    },
  });

  return lead;
}

export default router;
