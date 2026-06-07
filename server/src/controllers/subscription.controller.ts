import { Request, Response } from 'express';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response.utils';
import User from '../models/User.model';
import * as paymentService from '../services/payment.service';
import { env } from '../config/env';

const TIERS = {
  pro: {
    label: 'Pro',
    price: 99900,
    durationDays: 30,
    features: [
      'Unlimited courts',
      'Advanced analytics',
      'Bulk SMS',
      'Priority support',
    ],
  },
  business: {
    label: 'Business',
    price: 249900,
    durationDays: 30,
    features: [
      'Everything in Pro',
      'Multi-staff access',
      'Custom cancellation policy',
      'API access',
      'White-label QR',
    ],
  },
} as const;

// GET /api/v1/subscription
export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).select('subscription').lean() as {
    subscription?: { tier: string; validUntil: Date | null };
  } | null;

  if (!user) {
    sendError(res, 'User not found.', 404);
    return;
  }

  const sub = user.subscription || { tier: 'free', validUntil: null };
  const isActive =
    sub.tier !== 'free' &&
    (sub.validUntil === null || new Date(sub.validUntil) > new Date());

  sendSuccess(
    res,
    {
      tier: isActive ? sub.tier : 'free',
      validUntil: sub.validUntil,
      isActive,
      tiers: TIERS,
    },
    'Subscription status retrieved'
  );
});

const upgradeSchema = z.object({
  tier: z.enum(['pro', 'business']),
});

// POST /api/v1/subscription/order
export const createSubscriptionOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = upgradeSchema.parse(req.body);
  const tierInfo = TIERS[body.tier];

  const receipt = `sub_${req.user!._id}_${Date.now()}`;
  const order = await paymentService.createOrder(tierInfo.price, 'INR', receipt, {
    userId: req.user!._id.toString(),
    tier: body.tier,
    type: 'subscription',
  });

  sendSuccess(
    res,
    {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      tier: body.tier,
      tierLabel: tierInfo.label,
      keyId: env.RAZORPAY_KEY_ID,
      prefill: { name: req.user!.name, email: req.user!.email },
    },
    'Order created'
  );
});

const verifySchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  tier: z.enum(['pro', 'business']),
});

// POST /api/v1/subscription/verify
export const verifySubscriptionPayment = asyncHandler(async (req: Request, res: Response) => {
  const body = verifySchema.parse(req.body);

  const isValid = paymentService.verifySignature(
    body.razorpayOrderId,
    body.razorpayPaymentId,
    body.razorpaySignature
  );
  if (!isValid) {
    sendError(res, 'Payment verification failed.', 400);
    return;
  }

  const tierInfo = TIERS[body.tier];
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + tierInfo.durationDays);

  await User.findByIdAndUpdate(req.user!._id, {
    $set: {
      'subscription.tier': body.tier,
      'subscription.validUntil': validUntil,
    },
  });

  sendSuccess(
    res,
    {
      tier: body.tier,
      validUntil,
      message: `Upgraded to ${tierInfo.label} successfully!`,
    },
    `Welcome to Turffy ${tierInfo.label}!`
  );
});
