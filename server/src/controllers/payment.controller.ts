import { Request, Response } from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.model';
import Turf from '../models/Turf.model';
import User from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import * as paymentService from '../services/payment.service';
import { env } from '../config/env';
import { emitSlotBooked } from '../socket/slot.socket';
import { createNotification } from '../services/notification.service';
import { sendBookingConfirmation } from '../services/email.service';

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

  const rawBody = (req.body as Buffer).toString();
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    sendError(res, 'Invalid webhook signature.', 400);
    return;
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload: {
      payment: { entity: { order_id: string; id: string; status: string } };
    };
  };

  if (event.event === 'payment.captured') {
    const { order_id, id: paymentId } = event.payload.payment.entity;

    const booking = await Booking.findOneAndUpdate(
      { razorpayOrderId: order_id, paymentStatus: 'pending' },
      {
        $set: {
          paymentStatus: 'paid',
          status: 'confirmed',
          paymentId,
        },
      },
      { new: true }
    ).populate('turf', 'name owner city address operatingHours');

    if (booking) {
      const turfDoc = booking.turf as unknown as {
        _id: import('mongoose').Types.ObjectId;
        name: string;
        owner: import('mongoose').Types.ObjectId;
        city: string;
        address: string;
        operatingHours: { open: string; close: string };
      };
      const dateStr = booking.date.toISOString().slice(0, 10);

      // Emit real-time slot booked event
      emitSlotBooked(turfDoc._id.toString(), booking.court.toString(), dateStr, {
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: 'booked',
        bookingId: booking._id.toString(),
      });

      // Fetch user for notifications and email
      const bookingUser = await User.findById(booking.user).lean();
      if (bookingUser) {
        // Send booking confirmation email
        sendBookingConfirmation(
          bookingUser as unknown as import('../models/User.model').IUser,
          booking,
          turfDoc as unknown as import('../models/Turf.model').ITurf
        ).catch(console.error);

        // Notify user
        createNotification(
          booking.user,
          'booking_confirmed',
          'Booking Confirmed!',
          `Your booking at ${turfDoc.name} on ${dateStr} from ${booking.startTime} to ${booking.endTime} is confirmed.`,
          { bookingId: booking._id.toString() }
        ).catch(console.error);

        // Notify turf owner
        createNotification(
          turfDoc.owner,
          'payment_success',
          'New Booking Received',
          `${bookingUser.name} booked a slot at your turf on ${dateStr} from ${booking.startTime} to ${booking.endTime}.`,
          { bookingId: booking._id.toString(), userId: booking.user.toString() }
        ).catch(console.error);
      }
    }
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
