import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export interface CreateOrderOptions {
  amount: number; // in paise (INR * 100)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

/**
 * Create a Razorpay order.
 * @param amount   Amount in paise (multiply INR by 100)
 * @param currency Default: INR
 * @param receipt  Unique receipt identifier (booking ID)
 * @param notes    Optional metadata key-value pairs
 */
export const createOrder = async (
  amount: number,
  currency = 'INR',
  receipt: string,
  notes: Record<string, string> = {}
): Promise<RazorpayOrder> => {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
  return order as unknown as RazorpayOrder;
};

/**
 * Verify Razorpay payment signature.
 * The signature is HMAC-SHA256 of `${orderId}|${paymentId}` using key_secret.
 */
export const verifySignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
};

/**
 * Issue a refund for a payment.
 * @param paymentId  Razorpay payment ID (pay_...)
 * @param amount     Refund amount in paise. If omitted, full refund.
 */
export const refund = async (
  paymentId: string,
  amount?: number
): Promise<Record<string, unknown>> => {
  const refundData: Record<string, unknown> = {};
  if (amount) {
    refundData.amount = amount;
  }
  const result = await razorpay.payments.refund(paymentId, refundData);
  return result as unknown as Record<string, unknown>;
};

/**
 * Fetch payment details from Razorpay.
 */
export const fetchPayment = async (paymentId: string): Promise<Record<string, unknown>> => {
  const payment = await razorpay.payments.fetch(paymentId);
  return payment as unknown as Record<string, unknown>;
};
