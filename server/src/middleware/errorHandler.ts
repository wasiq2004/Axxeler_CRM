import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/httpError.js';

export const notFound: ErrorRequestHandler = (err, _req, _res, next) => next(err);

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, error: 'Validation failed', details: err.flatten() });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message, details: err.details });
    return;
  }

  // Map common Prisma errors to proper HTTP statuses instead of opaque 500s.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ');
      res.status(409).json({ success: false, error: target ? `A record with this ${target} already exists` : 'Duplicate value violates a unique constraint' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Record not found' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ success: false, error: 'Operation failed due to a related record constraint' });
      return;
    }
  }

  // Guard against thrown non-objects (strings/null) before reading .status.
  const status = err && typeof err === 'object' && typeof (err as any).status === 'number' ? (err as any).status : 500;
  const message = err && typeof err === 'object' && typeof (err as any).message === 'string' ? (err as any).message : 'Internal server error';
  if (status === 500) console.error('[error]', err);
  res.status(status).json({
    success: false,
    error: status === 500 ? 'Internal server error' : message,
  });
};
