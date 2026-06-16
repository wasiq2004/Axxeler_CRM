import { Worker } from 'bullmq';
import { prisma } from '../db/prisma.js';
import { redisConnection, queues } from './queues.js';
import { metaService } from '../services/metaService.js';
import { emailService } from '../services/emailService.js';

export const startWorkers = () => {
  // ─── Campaign Send Worker ────────────────────────────────────────────
  new Worker(
    'campaign-send',
    async (job) => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: job.data.campaignId },
        include: { recipients: true },
      });
      if (!campaign) return;

      const account = campaign.senderAccountId
        ? await prisma.whatsAppAccount.findUnique({ where: { id: campaign.senderAccountId } })
        : null;

      for (const recipient of campaign.recipients) {
        try {
          if (!account?.phoneNumberId) throw new Error('Missing WhatsApp sender phone number ID');
          const response = await metaService.sendWhatsAppMessage(account.phoneNumberId, account.tokenEncrypted, {
            messaging_product: 'whatsapp',
            to: recipient.phone,
            type: 'text',
            text: { body: recipient.personalizedMessage || campaign.messageBody || '' },
          });
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'sent', attemptedAt: new Date(), providerMessageId: response.messages?.[0]?.id, providerResponse: response },
          });
        } catch (error) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'failed',
              attemptedAt: new Date(),
              retries: { increment: 1 },
              providerResponse: { error: error instanceof Error ? error.message : 'Unknown send error' },
            },
          });
        }
      }

      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'completed' } });
    },
    { connection: redisConnection },
  );

  // ─── Notification Worker (invoice overdue check) ─────────────────────
  new Worker(
    'notification',
    async () => {
      const overdue = await prisma.invoice.findMany({
        where: { status: { in: ['Due', 'Overdue'] }, dueDate: { lt: new Date() } },
      });
      for (const invoice of overdue) {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'Overdue' } });
        await prisma.notification.create({
          data: {
            type: 'invoice_overdue',
            title: 'Invoice Overdue',
            message: `Invoice ${invoice.invoiceNumber} for ${invoice.clientName} is overdue.`,
            relatedEntityId: invoice.id,
            relatedEntityType: 'invoice',
          },
        });
      }
    },
    { connection: redisConnection },
  );

  // ─── Task Reminder Worker ────────────────────────────────────────────
  new Worker(
    'task-reminder',
    async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);

      const tasksDueTomorrow = await prisma.task.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          status: { not: 'Completed' },
          assignedToId: { not: null },
        },
        include: { assignee: true },
      });

      console.log(`[task-reminder] Found ${tasksDueTomorrow.length} tasks due tomorrow`);

      for (const task of tasksDueTomorrow) {
        if (!task.assignee?.email) continue;
        try {
          await emailService.sendTaskReminderEmail({
            assigneeName: task.assignee.name,
            assigneeEmail: task.assignee.email,
            taskTitle: task.title,
            taskDescription: task.description ?? undefined,
            dueDate: task.dueDate.toISOString().slice(0, 10),
            priority: task.priority,
            relatedTo: task.relatedTo ? (task.relatedTo as any) : null,
          });
          console.log(`[task-reminder] Sent reminder for task "${task.title}" to ${task.assignee.email}`);
        } catch (err) {
          console.error(`[task-reminder] Failed for task "${task.title}":`, err);
        }
      }
    },
    { connection: redisConnection },
  );

  // ─── Schedule daily task reminder cron (runs at 8:00 AM UTC) ─────────
  queues.taskReminder.upsertJobScheduler(
    'daily-task-reminder',
    { pattern: '0 8 * * *' },
    { name: 'send-task-reminders', data: {} },
  ).catch((err: Error) => console.error('[task-reminder] Failed to upsert scheduler:', err.message));
};
