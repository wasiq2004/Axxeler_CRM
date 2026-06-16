import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeEnum, mapRecordForUi } from '../utils/enums.js';
import { createCrudRouter } from './crudFactory.js';
import { emailService } from '../services/emailService.js';

const router = Router();

router.use(
  '/contacts',
  createCrudRouter({
    model: 'contact',
    searchFields: ['name', 'phone', 'normalizedPhone', 'source', 'groupName'],
    createSchema: z.object({
      name: z.string().optional(),
      phone: z.string(),
      normalizedPhone: z.string().optional(),
      groupName: z.string().optional(),
      tags: z.array(z.string()).default([]),
      customFields: z.any().default({}),
      source: z.string().default('Manual Entry'),
    }).transform((contact) => ({
      ...contact,
      normalizedPhone: contact.normalizedPhone || (contact.phone.startsWith('+') ? contact.phone : `+${contact.phone}`),
    })),
    updateSchema: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      normalizedPhone: z.string().optional(),
      groupName: z.string().optional().nullable(),
      tags: z.array(z.string()).optional(),
      customFields: z.any().optional(),
      source: z.string().optional(),
    }),
  }),
);

router.use(
  '/accounts',
  createCrudRouter({
    model: 'account',
    searchFields: ['name', 'industry', 'phone', 'website'],
    createSchema: z.object({ name: z.string(), industry: z.string().optional(), phone: z.string().optional(), website: z.string().optional(), ownerId: z.string().optional() }),
    updateSchema: z.object({ name: z.string().optional(), industry: z.string().optional(), phone: z.string().optional(), website: z.string().optional(), ownerId: z.string().optional() }),
  }),
);

router.use(
  '/deals',
  createCrudRouter({
    model: 'deal',
    enumFields: ['stage'],
    searchFields: ['name', 'accountName'],
    createSchema: z.object({
      name: z.string(),
      accountId: z.string().optional(),
      accountName: z.string(),
      stage: z.string().default('Prospecting'),
      value: z.coerce.number(),
      closeDate: z.coerce.date(),
      ownerId: z.string().optional(),
    }),
    updateSchema: z.object({
      name: z.string().optional(),
      accountId: z.string().optional().nullable(),
      accountName: z.string().optional(),
      stage: z.string().optional(),
      value: z.coerce.number().optional(),
      closeDate: z.coerce.date().optional(),
      ownerId: z.string().optional().nullable(),
    }),
  }),
);

router.post(
  '/contacts/:id/email',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({ subject: z.string().min(1), message: z.string().min(1) }).parse(req.body);
    const contact = await prisma.contact.findUnique({ where: { id: req.params.id as string } });
    if (!contact) throw new Error('Contact not found');
    const email = (contact.customFields as any)?.email;
    if (!email) throw new Error('This contact does not have an email address');
    const senderName = req.user!.name;
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <p style="white-space:pre-wrap;color:#1e293b">${body.message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
      <p style="color:#64748b;font-size:12px">Sent by ${senderName} via Axxeler CRM</p>
    </div>`;
    await emailService.send(email, body.subject, html);
    res.json({ success: true, message: `Email sent to ${email}` });
  }),
);

router.post(
  '/contacts/bulk-delete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ ids: z.array(z.string()).min(1) }).parse(req.body);
    await prisma.contact.deleteMany({ where: { id: { in: body.ids } } });
    res.json({ success: true, deleted: body.ids.length });
  }),
);

router.post(
  '/deals/:id/stage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ stage: z.string() }).parse(req.body);
    const deal = await prisma.deal.update({ where: { id: req.params.id }, data: { stage: normalizeEnum(body.stage) as any } });
    res.json({ success: true, data: mapRecordForUi(deal as any) });
  }),
);

router.use(
  '/tasks',
  createCrudRouter({
    model: 'task',
    enumFields: ['status', 'priority'],
    searchFields: ['title', 'description'],
    createSchema: z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.string().default('Pending'),
      priority: z.string().default('Medium'),
      dueDate: z.coerce.date(),
      assignedToId: z.string().optional(),
      relatedTo: z.any().optional(),
    }),
    updateSchema: z.object({
      title: z.string().optional(),
      description: z.string().optional().nullable(),
      status: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.coerce.date().optional(),
      assignedToId: z.string().optional().nullable(),
      relatedTo: z.any().optional(),
    }),
  }),
);

router.post(
  '/tasks/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.string() }).parse(req.body);
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status: normalizeEnum(body.status) as any } });
    res.json({ success: true, data: mapRecordForUi(task as any) });
  }),
);

export default router;
