import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const client =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const razorpayService = {
  async createOrder(amount: number, currency = 'INR', receipt?: string) {
    if (!client) {
      return {
        id: `order_dev_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency,
        receipt,
        status: 'created',
        devMode: true,
      };
    }

    return client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
    });
  },

  verifySignature(orderId: string, paymentId: string, signature: string) {
    if (!env.RAZORPAY_KEY_SECRET) return true;
    const digest = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (digest !== signature) throw new HttpError(400, 'Invalid Razorpay signature');
    return true;
  },
};
