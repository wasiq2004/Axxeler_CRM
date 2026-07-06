import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
// Notifications are not per-user scoped in the schema, so restrict the whole
// surface to admins/managers (matches the client nav) rather than exposing
// everyone's notifications to every authenticated user.
router.use(allowRoles('admin', 'manager'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifications });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z.object({
      type: z.string().default('general'),
      title: z.string(),
      message: z.string(),
      relatedEntityId: z.string().optional(),
      relatedEntityType: z.string().optional(),
      scheduledFor: z.coerce.date().optional(),
    }).parse(req.body);
    const notification = await prisma.notification.create({ data: body });
    res.status(201).json({ success: true, data: notification });
  }),
);

router.put(
  '/read-all',
  asyncHandler(async (_req, res) => {
    await prisma.notification.updateMany({ data: { isRead: true } });
    res.json({ success: true });
  }),
);

router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.update({ where: { id: req.params.id as string }, data: { isRead: true } });
    res.json({ success: true, data: notification });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.notification.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  }),
);

export default router;
