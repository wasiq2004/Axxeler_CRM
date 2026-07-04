import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

// Typed as `any` so it satisfies both our ioredis and the copy bundled inside
// bullmq (their RedisOptions/Connector types are structurally incompatible even
// though they are the same package at runtime).
export const redisConnection: any = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const queues = {
  campaignSend: new Queue('campaign-send', { connection: redisConnection }),
  notification: new Queue('notification', { connection: redisConnection }),
  email: new Queue('email', { connection: redisConnection }),
  webhook: new Queue('webhook', { connection: redisConnection }),
  taskReminder: new Queue('task-reminder', { connection: redisConnection }),
};
