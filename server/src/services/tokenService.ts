import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  role: string;
  email: string;
}

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL } as SignOptions);

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` } as SignOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// Short-lived, single-purpose token for the password-reset email link. Signed
// with the access secret plus a `purpose` claim so it can't be used as an
// access/refresh token.
export const signResetToken = (userId: string) =>
  jwt.sign({ sub: userId, purpose: 'password_reset' }, env.JWT_ACCESS_SECRET, { expiresIn: '30m' } as SignOptions);

export const verifyResetToken = (token: string): { sub: string } => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; purpose?: string };
  if (decoded.purpose !== 'password_reset') throw new Error('Invalid reset token');
  return { sub: decoded.sub };
};
