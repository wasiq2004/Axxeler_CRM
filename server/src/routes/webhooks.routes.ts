import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Note: the canonical Meta lead webhook lives at /api/meta/webhook (meta.routes.ts),
// which verifies the X-Hub-Signature-256 HMAC and imports leads. This file only
// hosts the Razorpay payment webhook.

router.post(
  '/razorpay',
  asyncHandler(async (req, res) => {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody: Buffer | undefined = (req as any).rawBody;

    // Refuse to mutate payment/invoice state unless the signature is configured and valid.
    if (!secret) {
      console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook');
      return res.sendStatus(503);
    }
    if (!signature || !rawBody) return res.sendStatus(400);

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.sendStatus(403);
    }

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
