import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { queues } from '../jobs/queues.js';
import { metaService } from '../services/metaService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const campaigns = await prisma.campaign.findMany({ include: { recipients: true }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: campaigns });
  }),
);

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z
      .object({
        name: z.string(),
        senderAccountId: z.string().optional(),
        messageType: z.string(),
        messageBody: z.string().optional(),
        variables: z.array(z.string()).default([]),
        targetQuery: z.any(),
        scheduleAt: z.coerce.date().optional(),
        status: z.string().default('draft'),
      })
      .parse(req.body);
    const campaign = await prisma.campaign.create({
      data: { ...body, status: body.status as any, createdBy: req.user!.id },
    });
    res.status(201).json({ success: true, data: campaign });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id }, include: { recipients: true } });
    if (!campaign) throw new HttpError(404, 'Campaign not found');
    res.json({ success: true, data: campaign });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: campaign });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.post(
  '/:id/send',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) throw new HttpError(404, 'Campaign not found');

    const target = campaign.targetQuery as any;
    const phones = target?.type === 'manual' ? target.value?.phones || [] : [];
    if (phones.length) {
      await prisma.campaignRecipient.createMany({
        data: phones.map((phone: string) => ({ campaignId: campaign.id, phone, personalizedMessage: campaign.messageBody })),
        skipDuplicates: true,
      });
    }

    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'sending' } });
    await prisma.campaignAuditLog.create({ data: { action: 'send', campaignId: campaign.id, createdBy: req.user!.id } });
    await queues.campaignSend.add('send-campaign', { campaignId: campaign.id });
    res.json({ success: true, data: { queued: true } });
  }),
);

router.get(
  '/:id/analytics',
  asyncHandler(async (req, res) => {
    const recipients = await prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: req.params.id },
      _count: { status: true },
    });
    res.json({ success: true, data: recipients });
  }),
);

router.get(
  '/accounts/whatsapp/list',
  asyncHandler(async (_req, res) => {
    const accounts = await prisma.whatsAppAccount.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: accounts });
  }),
);

router.post(
  '/accounts/whatsapp',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({
      accountIdFromProvider: z.string(),
      wabaId: z.string().optional(),
      phoneNumberId: z.string().optional(),
      name: z.string(),
      phoneNumber: z.string(),
      tokenEncrypted: z.string(),
      tokenExpiresAt: z.coerce.date().optional(),
      status: z.string().default('connected'),
    }).parse(req.body);
    const account = await prisma.whatsAppAccount.create({ data: { ...body, connectedBy: req.user!.id } });
    await prisma.campaignAuditLog.create({ data: { action: 'connect', accountId: account.id, createdBy: req.user!.id } });
    res.status(201).json({ success: true, data: account });
  }),
);

router.post(
  '/templates',
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
    if (body.submitToMeta && account?.wabaId) {
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

router.get(
  '/templates/list',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: templates });
  }),
);

export default router;
