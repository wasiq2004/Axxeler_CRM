import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { metaService } from '../services/metaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: templates });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z.object({
      accountId: z.string(),
      name: z.string(),
      namespace: z.string().optional(),
      language: z.string(),
      components: z.any(),
      variables: z.array(z.string()).default([]),
      category: z.string(),
      submitToMeta: z.boolean().default(false),
    }).parse(req.body);
    const account = await prisma.whatsAppAccount.findUnique({ where: { id: body.accountId } });
    let providerResponse: any = null;
    if (body.submitToMeta) {
      if (!account?.wabaId) throw new HttpError(400, 'Template submission needs a connected WABA account');
      providerResponse = await metaService.submitTemplate(account.wabaId, account.tokenEncrypted, {
        name: body.name,
        language: body.language,
        category: body.category,
        components: body.components,
      });
    }
    const { submitToMeta: _submitToMeta, ...templateData } = body;
    const template = await prisma.whatsAppTemplate.create({
      data: { ...templateData, status: providerResponse ? 'PENDING' : 'DRAFT', providerId: providerResponse?.id },
    });
    res.status(201).json({ success: true, data: template });
  }),
);

router.get('/:id', asyncHandler(async (req, res) => {
  const template = await prisma.whatsAppTemplate.findUnique({ where: { id: req.params.id } });
  if (!template) throw new HttpError(404, 'Template not found');
  res.json({ success: true, data: template });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const template = await prisma.whatsAppTemplate.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: template });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.whatsAppTemplate.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
