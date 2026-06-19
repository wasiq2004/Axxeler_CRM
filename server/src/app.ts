import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import coreRoutes from './routes/core.routes.js';
import invoicesRoutes from './routes/invoices.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import importsRoutes from './routes/imports.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import metaRoutes from './routes/meta.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import searchRoutes from './routes/search.routes.js';
import googleRoutes from './routes/google.routes.js';
import uploadsRoutes from './routes/uploads.routes.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 300 }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
// Capture the raw body so webhook routes can verify HMAC signatures over the
// exact bytes the provider signed (re-serializing the parsed JSON would break it).
app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buf) => { (req as any).rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'axxeler-crm-api' } });
});

// Serve uploaded files (avatars, logos) publicly. Reachable in production via the
// nginx /api/ proxy, so no extra nginx/volume config is required.
app.use('/api/uploads', express.static(env.UPLOAD_DIR));
app.use('/api/uploads', uploadsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/import', importsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/google', googleRoutes);
app.use('/api', coreRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);
