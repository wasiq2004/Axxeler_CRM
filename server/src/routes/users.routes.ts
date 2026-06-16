import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { allowRoles, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

const selectUser = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  phone: true,
  role: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
};

router.get(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.put(
  '/profile',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({ name: z.string().optional(), avatar: z.string().optional(), phone: z.string().optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: body, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.get(
  '/',
  allowRoles('admin', 'manager'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: selectUser, orderBy: { name: 'asc' } });
    res.json({ success: true, data: users });
  }),
);

router.post(
  '/',
  allowRoles('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6).default('Password123'),
        role: z.enum(['admin', 'manager', 'team_member']).default('team_member'),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        permissions: z.any().optional(),
      })
      .parse(req.body);

    const { password, ...userData } = body;
    const user = await prisma.user.create({
      data: { ...userData, passwordHash: await bcrypt.hash(password, 12) },
      select: selectUser,
    });
    res.status(201).json({ success: true, data: user });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.put(
  '/:id',
  allowRoles('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const body = z.object({ name: z.string().optional(), role: z.enum(['admin', 'manager', 'team_member']).optional(), phone: z.string().optional(), avatar: z.string().optional(), permissions: z.any().optional() }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: body, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.delete(
  '/:id',
  allowRoles('admin'),
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
