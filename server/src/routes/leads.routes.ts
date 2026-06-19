import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeEnum, mapRecordForUi } from '../utils/enums.js';
import { HttpError } from '../utils/httpError.js';
import { googleService } from '../services/googleService.js';

const _syncLead = (lead: any) => googleService.syncRecordToSheet('leads', lead).catch(() => undefined);

const router = Router();
router.use(requireAuth);

const leadInclude = {
  owner: { select: { id: true, name: true, avatar: true } },
  notes: {
    orderBy: { createdAt: 'desc' as const },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  },
  activities: { orderBy: { createdAt: 'desc' as const } },
  attachments: true,
};

const presentNote = (note: any) => ({
  id: note.id,
  leadId: note.leadId,
  content: note.content,
  authorId: note.authorId,
  authorName: note.author?.name || '',
  authorAvatar: note.author?.avatar || '',
  createdAt: note.createdAt,
});

const leadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().default(''),
  email: z.string().email(),
  phone: z.string().default(''),
  source: z.string().default('Manual Entry'),
  campaignId: z.string().optional().nullable(),
  status: z.string().default('New'),
  ownerId: z.string().optional().nullable(),
  score: z.number().int().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
});

const presentLead = (lead: any) => {
  const mapped = mapRecordForUi(lead);
  return {
    ...mapped,
    ownerName: lead.owner?.name || '',
    ownerAvatar: lead.owner?.avatar || '',
    notes: lead.notes?.map(presentNote) || [],
    activities: lead.activities || [],
  };
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = String(req.query.search || '');
    const where = search
      ? {
          OR: ['firstName', 'lastName', 'company', 'email', 'phone', 'source'].map((field) => ({
            [field]: { contains: search, mode: 'insensitive' },
          })),
        }
      : {};
    const leads = await prisma.lead.findMany({ where, include: leadInclude, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: leads.map(presentLead) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data: { ...body, status: normalizeEnum(body.status) as any },
      include: leadInclude,
    });
    const presented = presentLead(lead);
    _syncLead(presented);
    res.status(201).json({ success: true, data: presented });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id }, include: leadInclude });
    if (!lead) throw new HttpError(404, 'Lead not found');
    res.json({ success: true, data: presentLead(lead) });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = leadSchema.partial().parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { ...body, status: body.status ? (normalizeEnum(body.status) as any) : undefined },
      include: leadInclude,
    });
    const presented = presentLead(lead);
    _syncLead(presented);
    res.json({ success: true, data: presented });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.post(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.string() }).parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status: normalizeEnum(body.status) as any },
      include: leadInclude,
    });
    res.json({ success: true, data: presentLead(lead) });
  }),
);

router.get(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const notes = await prisma.leadNote.findMany({
      where: { leadId: req.params.id },
      include: { author: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notes.map(presentNote) });
  }),
);

router.post(
  '/:id/notes',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({ content: z.string().min(1) }).parse(req.body);
    const note = await prisma.leadNote.create({
      data: { leadId: req.params.id, content: body.content, authorId: req.user!.id },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });
    await prisma.leadActivity.create({
      data: { leadId: req.params.id, type: 'Note', title: 'Note added', content: body.content, authorName: req.user!.name },
    });
    res.status(201).json({ success: true, data: presentNote(note) });
  }),
);

router.post(
  '/:id/convert',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id as string } });
    if (!lead) throw new HttpError(404, 'Lead not found');

    const body = z.object({
      dealName: z.string().min(1),
      dealValue: z.coerce.number().min(0).default(0),
      dealStage: z.string().default('Qualification'),
      closeDate: z.string().default(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
      }),
      createContact: z.boolean().default(true),
    }).parse(req.body);

    // All-or-nothing: contact + deal + lead status + activity must commit together,
    // otherwise a failure (e.g. bad enum) leaves orphaned contacts/deals behind.
    const { contact, deal } = await prisma.$transaction(async (tx) => {
      // Create contact (skip if one with same phone already exists)
      let contact = null;
      if (body.createContact) {
        const phone = lead.phone || '';
        const normalizedPhone = phone.startsWith('+') ? phone : phone ? `+${phone}` : `+${lead.id}`;
        const existing = await tx.contact.findUnique({ where: { normalizedPhone } });
        contact = existing ?? await tx.contact.create({
          data: {
            name: `${lead.firstName} ${lead.lastName}`.trim(),
            phone,
            normalizedPhone,
            tags: lead.tags || [],
            source: lead.source || 'Lead Conversion',
            customFields: { company: lead.company || '', email: lead.email || '' },
          },
        });
      }

      const deal = await tx.deal.create({
        data: {
          name: body.dealName,
          accountName: lead.company || `${lead.firstName} ${lead.lastName}`,
          stage: (normalizeEnum(body.dealStage) || 'Qualification') as any,
          value: body.dealValue,
          closeDate: new Date(body.closeDate),
          ownerId: lead.ownerId || req.user!.id,
        },
      });

      // Mark the lead as won (schema enum is `ClosedWon`, not `Closed_Won`)
      await tx.lead.update({ where: { id: lead.id }, data: { status: 'ClosedWon' } });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'Note',
          title: 'Lead converted',
          content: `Converted to deal "${body.dealName}"${contact ? ' and contact created' : ''}.`,
          authorName: req.user!.name,
        },
      });

      return { contact, deal };
    });

    res.status(201).json({ success: true, data: { contact, deal } });
  }),
);

router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const body = z.object({ leads: z.array(leadSchema) }).parse(req.body);
    const created = [];
    for (const lead of body.leads) {
      const existing = await prisma.lead.findFirst({ where: { email: lead.email } });
      if (existing) {
        created.push(await prisma.lead.update({ where: { id: existing.id }, data: { ...lead, status: normalizeEnum(lead.status) as any } }));
      } else {
        created.push(await prisma.lead.create({ data: { ...lead, status: normalizeEnum(lead.status) as any } }));
      }
    }
    res.status(201).json({ success: true, data: created });
  }),
);

router.post(
  '/bulk-delete',
  asyncHandler(async (req, res) => {
    const body = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
    await prisma.lead.deleteMany({ where: { id: { in: body.ids } } });
    res.json({ success: true, deleted: body.ids.length });
  }),
);

router.post(
  '/bulk-status',
  asyncHandler(async (req, res) => {
    const body = z.object({ ids: z.array(z.string()).min(1), status: z.string() }).parse(req.body);
    await prisma.lead.updateMany({ where: { id: { in: body.ids } }, data: { status: normalizeEnum(body.status) as any } });
    res.json({ success: true, updated: body.ids.length });
  }),
);

export default router;
