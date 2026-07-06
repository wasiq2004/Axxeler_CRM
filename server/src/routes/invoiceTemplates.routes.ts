import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();
router.use(requireAuth);
// Invoice management (incl. templates) is admin-only in the client, so match that.
router.use(allowRoles('admin'));

const templateSchema = z.object({
  name: z.string().min(1),
  html: z.string().min(1),
  isDefault: z.boolean().default(false),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.invoiceTemplate.findMany({ orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }] });
    res.json({ success: true, data: templates });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = templateSchema.parse(req.body);
    const template = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.invoiceTemplate.updateMany({ data: { isDefault: false } });
      return tx.invoiceTemplate.create({ data: body });
    });
    res.status(201).json({ success: true, data: template });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.invoiceTemplate.findUnique({ where: { id: req.params.id as string } });
    if (!template) throw new HttpError(404, 'Template not found');
    res.json({ success: true, data: template });
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = templateSchema.partial().parse(req.body);
    const id = req.params.id as string;
    const template = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.invoiceTemplate.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
      return tx.invoiceTemplate.update({ where: { id }, data: body });
    });
    res.json({ success: true, data: template });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.invoiceTemplate.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  }),
);

export default router;
