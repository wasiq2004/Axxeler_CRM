import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { HttpError } from '../utils/httpError.js';
import { can, type PermissionKey } from '../utils/permissions.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    permissions?: unknown;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');

    const payload = verifyAccessToken(header.slice('Bearer '.length));
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true, permissions: true },
    });

    if (!user) throw new HttpError(401, 'Invalid token user');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired token'));
  }
};

export const allowRoles =
  (...roles: string[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Insufficient permissions'));
    next();
  };

// Gate a route on a granular permission flag (honours the per-user permissions
// JSON, with admin always allowed). Assumes requireAuth ran first.
export const requirePermission =
  (key: PermissionKey) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'));
    if (!can(req.user, key)) return next(new HttpError(403, 'Insufficient permissions'));
    next();
  };
