import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { allowRoles, requireAuth, requirePermission, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

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
  requirePermission('manageTeam'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ select: selectUser, orderBy: { name: 'asc' } });
    res.json({ success: true, data: users });
  }),
);

router.post(
  '/',
  requirePermission('manageTeam'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z
      .object({
        name: z.string(),
        email: z.string().email(),
        // No shared default password — a random one is generated so accounts are
        // not created with predictable credentials.
        password: z.string().min(6).optional(),
        role: z.enum(['admin', 'manager', 'team_member']).default('team_member'),
        phone: z.string().optional(),
        avatar: z.string().optional(),
        permissions: z.any().optional(),
      })
      .parse(req.body);

    // Only an admin may create elevated (admin/manager) accounts.
    if ((body.role === 'admin' || body.role === 'manager') && req.user!.role !== 'admin') {
      throw new HttpError(403, 'Only an admin can create admin or manager accounts');
    }

    const { password, ...userData } = body;
    const rawPassword = password || `Axx-${Math.random().toString(36).slice(2, 10)}!`;
    const user = await prisma.user.create({
      data: { ...userData, passwordHash: await bcrypt.hash(rawPassword, 12) },
      select: selectUser,
    });
    res.status(201).json({ success: true, data: user });
  }),
);

router.get(
  '/:id',
  requirePermission('manageTeam'),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id as string }, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.put(
  '/:id',
  requirePermission('manageTeam'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({ name: z.string().optional(), role: z.enum(['admin', 'manager', 'team_member']).optional(), phone: z.string().optional(), avatar: z.string().optional(), permissions: z.any().optional() }).parse(req.body);
    const targetId = req.params.id as string;
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, role: true } });
    if (!target) throw new HttpError(404, 'User not found');

    const actor = req.user!;
    // Non-admins may only edit team members and may never change roles.
    if (actor.role !== 'admin') {
      if (target.role !== 'team_member') throw new HttpError(403, 'Managers can only modify team members');
      if (body.role && body.role !== target.role) throw new HttpError(403, 'Only an admin can change a user\'s role');
    }
    // Never let the last remaining admin be demoted.
    if (target.role === 'admin' && body.role && body.role !== 'admin') {
      const admins = await prisma.user.count({ where: { role: 'admin' } });
      if (admins <= 1) throw new HttpError(400, 'Cannot demote the last remaining admin');
    }

    const user = await prisma.user.update({ where: { id: targetId }, data: body, select: selectUser });
    res.json({ success: true, data: user });
  }),
);

router.delete(
  '/:id',
  allowRoles('admin'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const targetId = req.params.id as string;
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
    if (!target) throw new HttpError(404, 'User not found');
    if (target.role === 'admin') {
      const admins = await prisma.user.count({ where: { role: 'admin' } });
      if (admins <= 1) throw new HttpError(400, 'Cannot delete the last remaining admin');
    }
    await prisma.user.delete({ where: { id: targetId } });
    res.status(204).send();
  }),
);

export default router;
