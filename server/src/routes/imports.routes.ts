import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const upload = multer({ dest: env.UPLOAD_DIR });

router.use(requireAuth);

router.get(
  '/jobs',
  asyncHandler(async (_req, res) => {
    const jobs = await prisma.importJob.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: jobs });
  }),
);

router.post(
  '/contacts',
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const content = req.file ? await import('node:fs/promises').then((fs) => fs.readFile(req.file!.path, 'utf8')) : String(req.body.csv || '');
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Array<Record<string, string>>;
    const job = await prisma.importJob.create({
      data: { fileName: req.file?.originalname || 'inline.csv', status: 'processing', totalRows: rows.length, createdBy: req.user!.id },
    });

    let importedRows = 0;
    let duplicateRows = 0;
    let invalidRows = 0;
    for (const row of rows) {
      const phone = row.phone || row.Phone || '';
      const name = row.name || row.Name || '';
      if (!phone || !name) {
        invalidRows++;
        continue;
      }
      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      const existing = await prisma.contact.findUnique({ where: { normalizedPhone } });
      if (existing) {
        duplicateRows++;
        continue;
      }
      await prisma.contact.create({
        data: {
          name,
          phone,
          normalizedPhone,
          groupName: row.group || row.Group || undefined,
          tags: (row.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
          customFields: { custom_field_1: row.custom_field_1, custom_field_2: row.custom_field_2 },
          source: 'import',
        },
      });
      importedRows++;
    }

    const updated = await prisma.importJob.update({
      where: { id: job.id },
      data: { status: 'completed', importedRows, duplicateRows, invalidRows, completedAt: new Date() },
    });
    res.status(201).json({ success: true, data: updated });
  }),
);

export default router;
