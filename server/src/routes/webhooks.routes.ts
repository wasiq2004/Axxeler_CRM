import { Router } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }
  res.sendStatus(403);
});

router.post(
  '/meta',
  asyncHandler(async (req, res) => {
    await prisma.campaignAuditLog.create({ data: { action: 'meta_webhook', details: req.body, createdBy: 'system' } });
    res.sendStatus(200);
  }),
);

router.post(
  '/razorpay',
  asyncHandler(async (req, res) => {
    await prisma.campaignAuditLog.create({ data: { action: 'razorpay_webhook', details: req.body, createdBy: 'system' } });
    const paymentEntity = req.body?.payload?.payment?.entity;
    if (paymentEntity?.order_id && paymentEntity?.status === 'captured') {
      const payment = await prisma.payment.findFirst({ where: { providerOrderId: paymentEntity.order_id } });
      if (payment) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid', providerPaymentId: paymentEntity.id, rawPayload: req.body } });
        await prisma.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'Paid' } });
      }
    }
    res.sendStatus(200);
  }),
);

export default router;
