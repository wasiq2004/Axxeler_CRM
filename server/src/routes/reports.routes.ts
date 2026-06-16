import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

const totals = async () => {
  const [leads, deals, invoices, tasks] = await Promise.all([
    prisma.lead.findMany(),
    prisma.deal.findMany(),
    prisma.invoice.findMany({ include: { items: true } }),
    prisma.task.findMany(),
  ]);

  const revenue = invoices
    .filter((invoice) => invoice.status === 'Paid')
    .reduce((sum, invoice) => {
      const subtotal = invoice.items.reduce((itemSum, item) => itemSum + Number(item.price) * item.quantity, 0);
      return sum + subtotal + subtotal * (Number(invoice.taxRate) / 100);
    }, 0);

  return {
    leads,
    deals,
    invoices,
    tasks,
    stats: {
      totalLeads: leads.length,
      totalDeals: deals.length,
      totalInvoices: invoices.length,
      openTasks: tasks.filter((task) => task.status !== 'Completed').length,
      revenue,
    },
  };
};

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: await totals() });
  }),
);

router.get('/sales', asyncHandler(async (_req, res) => res.json({ success: true, data: await totals() })));
router.get('/leads', asyncHandler(async (_req, res) => res.json({ success: true, data: await totals() })));
router.get('/deals', asyncHandler(async (_req, res) => res.json({ success: true, data: await totals() })));
router.get('/performance', asyncHandler(async (_req, res) => res.json({ success: true, data: await totals() })));

export default router;
