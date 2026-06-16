import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import { startWorkers } from './jobs/workers.js';

if (process.env.ENABLE_WORKERS === 'true') {
  startWorkers();
}

const server = app.listen(env.PORT, () => {
  console.log(`Axxeler CRM API listening on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
