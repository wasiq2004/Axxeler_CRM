import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ success: true, data: { leads: [], contacts: [], deals: [] } });

    const contains = { contains: q, mode: 'insensitive' as const };

    const [leads, contacts, deals] = await Promise.all([
      prisma.lead.findMany({
        where: { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { company: contains }] },
        select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.findMany({
        where: { OR: [{ name: contains }, { phone: contains }] },
        select: { id: true, name: true, phone: true, source: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deal.findMany({
        where: { OR: [{ name: contains }, { accountName: contains }] },
        select: { id: true, name: true, accountName: true, stage: true, value: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ success: true, data: { leads, contacts, deals } });
  }),
);

export default router;
