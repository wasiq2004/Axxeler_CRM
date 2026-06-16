import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { env } from '../config/env.js';

const router = Router();

const publicUser = (user: { id: string; name: string; email: string; role: string; avatar?: string | null; permissions?: unknown }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366F1&color=fff`,
  permissions: user.permissions,
});

const issueTokens = async (user: { id: string; email: string; role: string }) => {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
};

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) }).parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw new HttpError(409, 'Email is already registered');

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: await bcrypt.hash(body.password, 12),
        role: 'team_member',
      },
    });
    const tokens = await issueTokens(user);
    res.status(201).json({ success: true, data: { user: publicUser(user), ...tokens } });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const tokens = await issueTokens(user);
    res.json({ success: true, data: { user: publicUser(user), ...tokens } });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string() }).parse(req.body);
    const payload = verifyRefreshToken(body.refreshToken);
    const tokenHash = hashToken(body.refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new HttpError(401, 'Invalid refresh token');

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    const tokens = await issueTokens(user);
    res.json({ success: true, data: tokens });
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    await prisma.refreshToken.updateMany({ where: { userId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json({ success: true });
  }),
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user) {
      await emailService.send(
        user.email,
        'Reset your Axxeler CRM password',
        `<p>A password reset was requested for ${user.name}. Wire your frontend reset page to /api/auth/reset-password.</p>`,
      );
    }
    res.json({ success: true, message: 'If the email exists, reset instructions have been sent.' });
  }),
);

router.post(
  '/reset-password',
  asyncHandler(async (_req, res) => {
    throw new HttpError(501, 'Password reset tokens are scaffolded; configure email template and reset-token persistence before enabling.');
  }),
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, 'User not found');

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) throw new HttpError(400, 'Current password is incorrect');

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true, message: 'Password updated successfully' });
  }),
);

export default router;
