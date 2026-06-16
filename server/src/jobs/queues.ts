import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

export const redisConnection = new IORedis(env.REDIS_URL, {
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
