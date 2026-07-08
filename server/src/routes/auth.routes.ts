import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyRefreshToken,
  verifyResetToken,
} from '../services/tokenService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { env, ALLOW_PUBLIC_SIGNUP } from '../config/env.js';

const router = Router();

// Throttle credential endpoints to blunt brute-force / enumeration. Tighter than
// the global limiter. Keyed per IP.
const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts, please try again in a minute.' },
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

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
    if (!ALLOW_PUBLIC_SIGNUP) {
      throw new HttpError(403, 'Public sign-up is disabled. Ask an administrator to create your account.');
    }
    const body = z.object({ email: z.string().email().transform((e) => e.trim().toLowerCase()), password: z.string().min(6), name: z.string().min(1) }).parse(req.body);
    // Case-insensitive duplicate check so "A@x.com" and "a@x.com" can't both register.
    const exists = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
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
  loginLimiter,
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().transform((e) => e.trim().toLowerCase()), password: z.string().min(1) }).parse(req.body);
    // Case-insensitive lookup so login works regardless of how the email was cased.
    const user = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
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
    let payload;
    try {
      payload = verifyRefreshToken(body.refreshToken);
    } catch {
      throw new HttpError(401, 'Invalid refresh token');
    }
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
  resetLimiter,
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email().transform((e) => e.trim().toLowerCase()) }).parse(req.body);
    const user = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
    if (user) {
      const token = signResetToken(user.id);
      const resetUrl = `${env.CLIENT_ORIGIN.replace(/\/$/, '')}/#/reset-password?token=${encodeURIComponent(token)}`;
      // Email if configured; always log so the flow works in dev without Resend.
      console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
      await emailService
        .send(
          user.email,
          'Reset your Axxeler CRM password',
          `<p>Hi ${user.name},</p><p>A password reset was requested for your Axxeler CRM account. Click the link below to choose a new password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, you can ignore this email.</p>`,
        )
        .catch((err) => console.error('[auth] Failed to send reset email:', err));
    }
    res.json({ success: true, message: 'If the email exists, reset instructions have been sent.' });
  }),
);

router.post(
  '/reset-password',
  resetLimiter,
  asyncHandler(async (req, res) => {
    const body = z.object({ token: z.string().min(1), newPassword: z.string().min(6, 'Password must be at least 6 characters') }).parse(req.body);
    let userId: string;
    try {
      userId = verifyResetToken(body.token).sub;
    } catch {
      throw new HttpError(400, 'This reset link is invalid or has expired');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(400, 'This reset link is invalid or has expired');

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // Invalidate all existing sessions after a reset.
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });

    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
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
    // Invalidate every other session so a stolen session can't outlive the change.
    await prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });

    res.json({ success: true, message: 'Password updated successfully' });
  }),
);

export default router;
