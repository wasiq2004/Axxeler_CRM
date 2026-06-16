import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { mapEnumsForDb, mapRecordForUi } from '../utils/enums.js';
import { HttpError } from '../utils/httpError.js';

type CrudConfig = {
  model: string;
  enumFields?: string[];
  include?: Record<string, unknown>;
  searchFields?: string[];
  createSchema?: z.ZodTypeAny;
  updateSchema?: z.ZodTypeAny;
};

const prismaAny = prisma as any;

const buildWhere = (search: unknown, searchFields: string[] = []) => {
  if (!search || typeof search !== 'string' || !searchFields.length) return {};
  return {
    OR: searchFields.map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })),
  };
};

export const createCrudRouter = (config: CrudConfig) => {
  const router = Router();
  router.use(requireAuth);
  const delegate = prismaAny[config.model];
  if (!delegate) throw new Error(`Unknown Prisma model: ${config.model}`);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const page = Math.max(Number(req.query.page || 1), 1);
      const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);
      const skip = (page - 1) * limit;
      const where = buildWhere(req.query.search, config.searchFields);
      const [items, total] = await Promise.all([
        delegate.findMany({ where, skip, take: limit, include: config.include, orderBy: { createdAt: 'desc' } }),
        delegate.count({ where }),
      ]);
      res.json({ success: true, data: items.map(mapRecordForUi), meta: { page, limit, total } });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const parsed = config.createSchema ? config.createSchema.parse(req.body) : req.body;
      const data = mapEnumsForDb(parsed, config.enumFields || []);
      const created = await delegate.create({ data, include: config.include });
      res.status(201).json({ success: true, data: mapRecordForUi(created) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = await delegate.findUnique({ where: { id: req.params.id }, include: config.include });
      if (!item) throw new HttpError(404, 'Resource not found');
      res.json({ success: true, data: mapRecordForUi(item) });
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const parsed = config.updateSchema ? config.updateSchema.parse(req.body) : req.body;
      const data = mapEnumsForDb(parsed, config.enumFields || []);
      const updated = await delegate.update({ where: { id: req.params.id }, data, include: config.include });
      res.json({ success: true, data: mapRecordForUi(updated) });
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      res.status(204).send();
    }),
  );

  return router;
};
