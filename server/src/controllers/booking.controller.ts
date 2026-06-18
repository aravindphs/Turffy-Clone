import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/Booking.model';
import Turf from '../models/Turf.model';
import Court from '../models/Court.model';
import BlockedSlot from '../models/BlockedSlot.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import {
  createBookingSchema,
  cancelBookingSchema,
  verifyPaymentSchema,
} from '../validators/booking.validator';
import {
  isSlotAvailable,
  calculateTotalPrice,
  getDurationMinutes,
} from '../utils/slot.utils';
import * as paymentService from '../services/payment.service';
import { sendBookingConfirmation, sendBookingCancellation } from '../services/email.service';
import { sendBookingConfirmationSms, sendBookingCancellationSms } from '../services/msg91.service';
import { createNotification } from '../services/notification.service';
import { emitSlotBooked, emitSlotUnblocked } from '../socket/slot.socket';
import { v4 as uuidv4 } from 'uuid';

// ---- CREATE BOOKING (initiates payment flow) ----
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const body = createBookingSchema.parse(req.body);

  // Extract consolidated start/end times from the slots array
  const startTime = body.slots[0].startTime;
  const endTime = body.slots[body.slots.length - 1].endTime;

  const turf = await Turf.findOne({ _id: body.turfId, isActive: true, isVerified: true }).lean();
  if (!turf) {
    sendError(res, 'Turf not found or not available.', 404);
    return;
  }

  const court = await Court.findOne({
    _id: body.courtId,
    turf: body.turfId,
    isActive: true,
  }).lean();
  if (!court) {
    sendError(res, 'Court not found.', 404);
    return;
  }

  const queryDate = new Date(body.date);
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  // --- Atomic availability check using a session ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock check: existing bookings
    const existingBookings = await Booking.find({
      court: body.courtId,
      date: { $gte: queryDate, $lt: nextDate },
      status: { $in: ['pending', 'confirmed'] },
    })
      .session(session)
      .lean()
      .select('startTime endTime');

    if (
      !isSlotAvailable(
        existingBookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
        startTime,
        endTime
      )
    ) {
      await session.abortTransaction();
      sendError(res, 'This time slot is already booked. Please choose another.', 409);
      return;
    }

    // Lock check: blocked slots
    const existingBlocked = await BlockedSlot.find({
      court: body.courtId,
      date: { $gte: queryDate, $lt: nextDate },
    })
      .session(session)
      .lean()
      .select('startTime endTime');

    if (
      !isSlotAvailable(
        existingBlocked.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
        startTime,
        endTime
      )
    ) {
      await session.abortTransaction();
      sendError(res, 'This slot has been blocked by the turf owner.', 409);
      return;
    }

    // Validate times are within operating hours
    const openMinutes = parseInt(turf.operatingHours.open.replace(':', ''), 10);
    const closeMinutes = parseInt(turf.operatingHours.close.replace(':', ''), 10);
    const startMinutes = parseInt(startTime.replace(':', ''), 10);
    const endMinutes = parseInt(endTime.replace(':', ''), 10);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      await session.abortTransaction();
      sendError(
        res,
        `Booking must be within operating hours: ${turf.operatingHours.open} – ${turf.operatingHours.close}.`,
        400
      );
      return;
    }

    const durationMinutes = getDurationMinutes(startTime, endTime);
    const totalAmount = calculateTotalPrice(
      startTime,
      endTime,
      turf.slotInterval,
      turf.basePrice,
      turf.peakHours
    );

    // Create Razorpay order
    const receipt = `turffy_${uuidv4().replace(/-/g, '').slice(0, 20)}`;
    const razorpayOrder = await paymentService.createOrder(
      totalAmount * 100, // to paise
      'INR',
      receipt,
      {
        turfName: turf.name,
        userName: req.user!.name,
        date: body.date,
        startTime,
        endTime,
      }
    );

    // Create booking in pending state
    const [booking] = await Booking.create(
      [
        {
          user: req.user!._id,
          turf: body.turfId,
          court: body.courtId,
          date: queryDate,
          startTime,
          endTime,
          durationMinutes,
          totalAmount,
          status: 'pending',
          paymentStatus: 'pending',
          razorpayOrderId: razorpayOrder.id,
          notes: body.notes,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    sendSuccess(
      res,
      {
        bookingId: booking._id.toString(),
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        prefill: {
          name: req.user!.name,
          email: req.user!.email,
        },
      },
      'Booking initiated. Please complete payment.',
      201
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ---- VERIFY PAYMENT ----
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const body = verifyPaymentSchema.parse(req.body);

  const booking = await Booking.findOne({
    _id: body.bookingId,
    user: req.user!._id,
    razorpayOrderId: body.razorpayOrderId,
    status: 'pending',
    paymentStatus: 'pending',
  }).populate('turf');

  if (!booking) {
    sendError(res, 'Booking not found or payment already processed.', 404);
    return;
  }

  const isSignatureValid = paymentService.verifySignature(
    body.razorpayOrderId,
    body.razorpayPaymentId,
    body.razorpaySignature
  );

  if (!isSignatureValid) {
    booking.paymentStatus = 'failed';
    booking.status = 'cancelled';
    await booking.save();
    sendError(res, 'Payment verification failed. Invalid signature.', 400);
    return;
  }

  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.paymentId = body.razorpayPaymentId;
  await booking.save();

  const turf = booking.turf as unknown as { name: string; _id: mongoose.Types.ObjectId; address: string; city: string; operatingHours: { open: string; close: string } };
  const dateStr = booking.date.toISOString().slice(0, 10);

  // Emit real-time slot booked event
  emitSlotBooked(turf._id.toString(), booking.court.toString(), dateStr, {
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: 'booked',
    bookingId: booking._id.toString(),
  });

  // Notifications + email
  const user = req.user!;
  const turfDoc = await Turf.findById(turf._id).lean();

  if (turfDoc) {
    sendBookingConfirmation(user, booking, turfDoc as unknown as import('../models/Turf.model').ITurf).catch(console.error);

    createNotification(
      user._id,
      'booking_confirmed',
      'Booking Confirmed!',
      `Your booking at ${turfDoc.name} on ${dateStr} from ${booking.startTime} to ${booking.endTime} is confirmed.`,
      { bookingId: booking._id.toString() }
    ).catch(console.error);

    createNotification(
      turfDoc.owner,
      'payment_success',
      'New Booking Received',
      `${user.name} booked a slot at your turf on ${dateStr} from ${booking.startTime} to ${booking.endTime}.`,
      { bookingId: booking._id.toString(), userId: user._id.toString() }
    ).catch(console.error);

    // Send SMS confirmation if user has a phone number
    if (user.phone) {
      sendBookingConfirmationSms(
        user.phone,
        turfDoc.name,
        dateStr,
        booking.startTime,
        booking.endTime,
        booking.totalAmount
      ).catch(console.error);
    }
  }

  sendSuccess(res, { booking: booking.toJSON() }, 'Payment verified. Booking confirmed!');
});

// ---- GET MY BOOKINGS ----
export const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '10' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { user: req.user!._id };
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('turf', 'name city address images slug')
      .populate('court', 'name sport')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  sendPaginated(res, bookings, total, pageNum, limitNum, 'Bookings retrieved');
});

// ---- GET BOOKING DETAILS ----
export const getBookingDetails = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId)
    .populate('turf', 'name city address images owner operatingHours')
    .populate('court', 'name sport description')
    .populate('user', 'name email phone avatar')
    .lean();

  if (!booking) {
    sendError(res, 'Booking not found.', 404);
    return;
  }

  const userId = req.user!._id.toString();
  const bookingUserId = (booking.user as unknown as { _id: mongoose.Types.ObjectId })._id.toString();
  const turfOwnerId = (booking.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();

  // Only user, turf owner, or admin can view
  if (
    userId !== bookingUserId &&
    userId !== turfOwnerId &&
    req.user!.role !== 'admin'
  ) {
    sendError(res, 'Access denied.', 403);
    return;
  }

  sendSuccess(res, { booking }, 'Booking details retrieved');
});

// ---- CANCEL BOOKING ----
export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const body = cancelBookingSchema.parse(req.body);

  const booking = await Booking.findById(bookingId).populate('turf', 'name owner');
  if (!booking) {
    sendError(res, 'Booking not found.', 404);
    return;
  }

  const userId = req.user!._id.toString();
  const bookingUserId = booking.user.toString();
  const turfOwnerId = (booking.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();

  if (userId !== bookingUserId && userId !== turfOwnerId && req.user!.role !== 'admin') {
    sendError(res, 'Access denied.', 403);
    return;
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    sendError(res, `Cannot cancel a booking with status: ${booking.status}.`, 400);
    return;
  }

  booking.status = 'cancelled';
  booking.cancellationReason = body.reason;
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user!._id;

  // Calculate hours until booking start for refund policy
  const bookingDateTime = new Date(booking.date);
  const [bHour, bMin] = booking.startTime.split(':').map(Number);
  bookingDateTime.setUTCHours(bHour, bMin, 0, 0);
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

  // Get cancellation policy from turf
  const turfForPolicy = await Turf.findById(booking.turf).select('cancellationPolicy name').lean();
  const policy = turfForPolicy?.cancellationPolicy ?? { fullRefundHours: 24, halfRefundHours: 6 };

  let refundAmount = 0;
  let refundPercentage = 0;

  if (booking.paymentStatus === 'paid' && booking.paymentId) {
    if (hoursUntilBooking >= policy.fullRefundHours) {
      refundPercentage = 100;
      refundAmount = booking.totalAmount;
    } else if (hoursUntilBooking >= policy.halfRefundHours) {
      refundPercentage = 50;
      refundAmount = Math.floor(booking.totalAmount * 0.5);
    }
    // else 0% refund

    if (refundAmount > 0) {
      try {
        await paymentService.refund(booking.paymentId, refundAmount * 100); // in paise
        booking.paymentStatus = 'refunded';
      } catch (refundErr) {
        console.error('Refund failed:', refundErr);
        // Don't block cancellation — handle refund separately
      }
    }
  }

  await booking.save();

  const dateStr = booking.date.toISOString().slice(0, 10);
  const turfName = (booking.turf as unknown as { name: string }).name;

  // Emit slot released
  emitSlotUnblocked(
    booking.turf.toString(),
    booking.court.toString(),
    dateStr,
    bookingId
  );

  const refundMessage = refundPercentage > 0
    ? `₹${refundAmount} (${refundPercentage}%) refund initiated.`
    : 'No refund applicable per cancellation policy.';

  // Notify and email
  sendBookingCancellation(req.user!, booking, turfName).catch(console.error);

  // Send SMS cancellation if user has phone
  if (req.user!.phone) {
    sendBookingCancellationSms(req.user!.phone, turfName, dateStr, refundAmount).catch(console.error);
  }

  createNotification(
    booking.user,
    'booking_cancelled',
    'Booking Cancelled',
    `Your booking at ${turfName} on ${dateStr} has been cancelled. ${refundMessage}`,
    { bookingId }
  ).catch(console.error);

  sendSuccess(res, { booking: booking.toJSON() }, 'Booking cancelled successfully');
});

// ---- GET OWNER BOOKINGS ----
export const getOwnerBookings = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { date, status, page = '1', limit = '20' } = req.query as Record<string, string>;

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id }).lean();
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { turf: turfId };
  if (status) filter.status = status;
  if (date) {
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    filter.date = { $gte: queryDate, $lt: nextDate };
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('court', 'name sport')
      .sort({ date: -1, startTime: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  sendPaginated(res, bookings, total, pageNum, limitNum, 'Owner bookings retrieved');
});

// ---- MARK BOOKING COMPLETED ----
export const markCompleted = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId).populate('turf', 'owner name');
  if (!booking) {
    sendError(res, 'Booking not found.', 404);
    return;
  }

  const turfOwnerId = (booking.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();
  if (turfOwnerId !== req.user!._id.toString()) {
    sendError(res, 'Only the turf owner can mark bookings as completed.', 403);
    return;
  }

  if (booking.status !== 'confirmed') {
    sendError(res, `Cannot mark a ${booking.status} booking as completed.`, 400);
    return;
  }

  booking.status = 'completed';
  await booking.save();

  sendSuccess(res, { booking: booking.toJSON() }, 'Booking marked as completed');
});
