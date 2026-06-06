import { Request, Response } from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import * as paymentService from '../services/payment.service';
import { env } from '../config/env';

// ---- CREATE ORDER (re-initiate payment for a pending booking) ----
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user!._id,
    paymentStatus: 'pending',
    status: 'pending',
  }).populate('turf', 'name');

  if (!booking) {
    sendError(res, 'Booking not found or payment already processed.', 404);
    return;
  }

  const receipt = `retry_${bookingId}`;
  const order = await paymentService.createOrder(
    booking.totalAmount * 100,
    'INR',
    receipt,
    {
      bookingId: bookingId,
      userId: req.user!._id.toString(),
    }
  );

  // Update order ID
  booking.razorpayOrderId = order.id;
  await booking.save();

  sendSuccess(res, {
    bookingId,
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    prefill: {
      name: req.user!.name,
      email: req.user!.email,
    },
  }, 'Order created');
});

// ---- WEBHOOK VERIFY (called by Razorpay webhook) ----
export const webhookVerify = asyncHandler(async (req: Request, res: Response) => {
  const webhookSecret = env.RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'] as string;

  if (!signature) {
    sendError(res, 'Missing webhook signature.', 400);
    return;
  }

  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    sendError(res, 'Invalid webhook signature.', 400);
    return;
  }

  const event = req.body as {
    event: string;
    payload: {
      payment: { entity: { order_id: string; id: string; status: string } };
    };
  };

  if (event.event === 'payment.captured') {
    const { order_id, id: paymentId } = event.payload.payment.entity;

    await Booking.findOneAndUpdate(
      { razorpayOrderId: order_id, paymentStatus: 'pending' },
      {
        $set: {
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentId,
        },
      }
    );
  } else if (event.event === 'payment.failed') {
    const { order_id } = event.payload.payment.entity;
    await Booking.findOneAndUpdate(
      { razorpayOrderId: order_id, paymentStatus: 'pending' },
      { $set: { paymentStatus: 'failed', status: 'cancelled' } }
    );
  }

  res.status(200).json({ received: true });
});

// ---- GET PAYMENT HISTORY ----
export const getPaymentHistory = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = {
    user: req.user!._id,
    paymentStatus: { $in: ['paid', 'refunded', 'failed'] },
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('turf', 'name city')
      .populate('court', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .select('turf court date startTime endTime totalAmount paymentStatus paymentId status createdAt'),
    Booking.countDocuments(filter),
  ]);

  sendPaginated(res, bookings, total, pageNum, limitNum, 'Payment history retrieved');
});
