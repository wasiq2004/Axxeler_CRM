import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// Writing company settings or integration credentials is admin-only. Reads of
// company info stay open to all authenticated users (used app-wide for branding/currency).
const adminOnly = allowRoles('admin');

const schema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  website: z.string(),
  logo: z.string(),
  currency: z.string().default('USD'),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const company = await prisma.companySetting.findUnique({ where: { id: 'company' } });
    res.json({ success: true, data: { company } });
  }),
);

router.put(
  '/',
  adminOnly,
  asyncHandler(async (req, res) => {
    const body = z.object({ company: schema.optional() }).parse(req.body);
    const company = body.company
      ? await prisma.companySetting.upsert({ where: { id: 'company' }, update: body.company, create: { id: 'company', ...body.company } })
      : await prisma.companySetting.findUnique({ where: { id: 'company' } });
    res.json({ success: true, data: { company } });
  }),
);

router.get(
  '/company',
  asyncHandler(async (_req, res) => {
    const company = await prisma.companySetting.findUnique({ where: { id: 'company' } });
    res.json({ success: true, data: company });
  }),
);

router.put(
  '/company',
  adminOnly,
  asyncHandler(async (req, res) => {
    const body = schema.partial().parse(req.body);
    const company = await prisma.companySetting.upsert({
      where: { id: 'company' },
      update: body,
      create: {
        id: 'company',
        name: body.name || 'Axxeler CRM Inc.',
        address: body.address || '',
        phone: body.phone || '',
        email: body.email || 'info@example.com',
        website: body.website || '',
        logo: body.logo || '/axxeler-logo-white.png',
        currency: body.currency || 'USD',
      },
    });
    res.json({ success: true, data: company });
  }),
);

// ─── Integration Config ────────────────────────────────────────────────────────

const MASKED = '••••••••';

// Fields that should be masked (never returned in plaintext)
const SECRET_FIELDS: Record<string, string[]> = {
  meta: ['appSecret', 'webhookVerifyToken'],
};

router.get(
  '/integrations/:provider',
  adminOnly,
  asyncHandler(async (req, res) => {
    const provider = req.params.provider as string;
    const record = await prisma.integrationConfig.findUnique({ where: { provider } });
    const cfg = (record?.config || {}) as Record<string, string>;
    const secrets = SECRET_FIELDS[provider] || [];

    // Return config with secret fields masked
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      masked[k] = secrets.includes(k) && v ? MASKED : v;
    }

    res.json({ success: true, data: { provider, config: masked } });
  }),
);

router.put(
  '/integrations/:provider',
  adminOnly,
  asyncHandler(async (req, res) => {
    const provider = req.params.provider as string;
    const incoming = (req.body.config || {}) as Record<string, string>;
    const secrets = SECRET_FIELDS[provider] || [];

    // Load existing so we don't overwrite secrets with the mask placeholder
    const existing = await prisma.integrationConfig.findUnique({ where: { provider } });
    const current = (existing?.config || {}) as Record<string, string>;

    const merged: Record<string, string> = { ...current };
    for (const [k, v] of Object.entries(incoming)) {
      // Skip saving the mask placeholder — keep the real stored value
      if (secrets.includes(k) && v === MASKED) continue;
      merged[k] = v;
    }

    await prisma.integrationConfig.upsert({
      where: { provider },
      update: { config: merged },
      create: { provider, config: merged },
    });

    res.json({ success: true });
  }),
);

export default router;
