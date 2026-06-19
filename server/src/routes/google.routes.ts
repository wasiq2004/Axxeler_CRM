import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';
import { googleService, DEFAULT_LEAD_MAPPING, DEFAULT_CONTACT_MAPPING } from '../services/googleService.js';

const router = Router();

const SECRET_FIELDS = ['clientSecret'];
const MASKED = '••••••••';

// ─── Google OAuth App credentials (Client ID / Secret) ───────────────────────

router.get(
  '/oauth-app-config',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const record = await prisma.integrationConfig.findUnique({ where: { provider: 'google_oauth_app' } });
    const cfg = (record?.config || {}) as Record<string, string>;
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      masked[k] = SECRET_FIELDS.includes(k) && v ? MASKED : v;
    }
    const defaultRedirect = `${(env.CLIENT_ORIGIN || 'http://localhost:3000').replace(':3000', ':4000')}/api/google/callback`;
    if (!masked.redirectUri) masked.redirectUri = defaultRedirect;
    res.json({ success: true, data: masked });
  }),
);

router.put(
  '/oauth-app-config',
  requireAuth,
  allowRoles('admin'),
  asyncHandler(async (req, res) => {
    const body = z.object({ config: z.record(z.string()) }).parse(req.body);
    const record = await prisma.integrationConfig.findUnique({ where: { provider: 'google_oauth_app' } });
    const existing = (record?.config || {}) as Record<string, string>;
    const merged = { ...existing };
    for (const [k, v] of Object.entries(body.config)) {
      if (SECRET_FIELDS.includes(k) && v === MASKED) continue;
      merged[k] = v;
    }
    await prisma.integrationConfig.upsert({
      where: { provider: 'google_oauth_app' },
      update: { config: merged },
      create: { provider: 'google_oauth_app', config: merged },
    });
    res.json({ success: true });
  }),
);

// ─── OAuth flow ───────────────────────────────────────────────────────────────

router.get(
  '/oauth-url',
  requireAuth,
  asyncHandler(async (_req, res) => {
    try {
      const url = await googleService.getAuthUrl('google-oauth');
      res.json({ success: true, data: { url } });
    } catch (err: any) {
      throw new HttpError(400, err.message || 'Google OAuth not configured. Add Client ID and Secret first.');
    }
  }),
);

// Public — browser is redirected here by Google
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, error, error_description } = req.query as Record<string, string>;
    const clientOrigin = env.CLIENT_ORIGIN || 'http://localhost:3000';

    if (error || !code) {
      const msg = encodeURIComponent(error_description || error || 'Google OAuth failed');
      return res.redirect(`${clientOrigin}/settings?google_error=${msg}`);
    }

    try {
      const { tokens, userInfo } = await googleService.exchangeCode(code);
      const cfg: Record<string, string> = {
        accessToken: tokens.access_token || '',
        tokenExpiry: String(tokens.expiry_date || ''),
        email: userInfo.email || '',
        name: userInfo.name || '',
      };
      if (tokens.refresh_token) cfg.refreshToken = tokens.refresh_token;

      await prisma.integrationConfig.upsert({
        where: { provider: 'google' },
        update: { config: cfg },
        create: { provider: 'google', config: cfg },
      });

      res.redirect(`${clientOrigin}/settings?google_connected=1`);
    } catch (err: any) {
      const msg = encodeURIComponent(err.message || 'Google OAuth failed');
      res.redirect(`${clientOrigin}/settings?google_error=${msg}`);
    }
  }),
);

router.get(
  '/connection',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const conn = await googleService.getConnection();
    res.json({ success: true, data: conn });
  }),
);

router.delete(
  '/disconnect',
  requireAuth,
  asyncHandler(async (_req, res) => {
    await prisma.integrationConfig.upsert({
      where: { provider: 'google' },
      update: { config: {} },
      create: { provider: 'google', config: {} },
    });
    res.json({ success: true });
  }),
);

// ─── Drive / Sheets discovery ─────────────────────────────────────────────────

router.get(
  '/spreadsheets',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const files = await googleService.listSpreadsheets();
    res.json({ success: true, data: files });
  }),
);

router.get(
  '/spreadsheets/:id/sheets',
  requireAuth,
  asyncHandler(async (req, res) => {
    const names = await googleService.getSheetNames(req.params.id as string);
    res.json({ success: true, data: names });
  }),
);

// ─── Sync configs CRUD ────────────────────────────────────────────────────────

router.get(
  '/sync-configs',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const configs = await prisma.googleSyncConfig.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: configs });
  }),
);

router.put(
  '/sync-configs/:entityType',
  requireAuth,
  asyncHandler(async (req, res) => {
    const entityType = req.params.entityType as string;
    if (!['leads', 'contacts'].includes(entityType)) throw new HttpError(400, 'entityType must be leads or contacts');

    const body = z.object({
      spreadsheetId: z.string(),
      spreadsheetName: z.string().default(''),
      sheetName: z.string().default('Sheet1'),
      isActive: z.boolean().default(true),
    }).parse(req.body);

    const mapping = entityType === 'leads' ? DEFAULT_LEAD_MAPPING : DEFAULT_CONTACT_MAPPING;

    const existing = await prisma.googleSyncConfig.findFirst({ where: { entityType } });
    let config;
    if (existing) {
      config = await prisma.googleSyncConfig.update({
        where: { id: existing.id },
        data: { ...body, columnMapping: mapping },
      });
    } else {
      config = await prisma.googleSyncConfig.create({
        data: { ...body, entityType, columnMapping: mapping },
      });
    }

    // Initialize header row on the sheet
    try {
      await googleService.initializeSheet(body.spreadsheetId, body.sheetName, mapping);
    } catch {
      // non-fatal: sheet may not be accessible yet
    }

    res.json({ success: true, data: config });
  }),
);

router.delete(
  '/sync-configs/:entityType',
  requireAuth,
  asyncHandler(async (req, res) => {
    const entityType = req.params.entityType as string;
    await prisma.googleSyncConfig.deleteMany({ where: { entityType } });
    res.json({ success: true });
  }),
);

// ─── Manual full sync ─────────────────────────────────────────────────────────

router.post(
  '/sync-now/:entityType',
  requireAuth,
  asyncHandler(async (req, res) => {
    const entityType = req.params.entityType as string;
    if (!['leads', 'contacts'].includes(entityType)) throw new HttpError(400, 'entityType must be leads or contacts');
    const result = await googleService.fullSync(entityType as 'leads' | 'contacts');
    res.json({ success: true, data: result });
  }),
);

// ─── Apps Script Webhook (public, token-secured) ──────────────────────────────

router.post(
  '/sheet-webhook',
  asyncHandler(async (req, res) => {
    const token = req.query.token as string;
    if (!token) throw new HttpError(400, 'Missing webhook token');

    const body = z.object({
      row: z.number().optional(),
      data: z.record(z.string()),
    }).parse(req.body);

    const result = await googleService.handleSheetWebhook(token, body.data);
    res.json({ success: true, data: result });
  }),
);

export default router;
