import { Request, Response } from 'express';
import mongoose from 'mongoose';
import BlockedSlot from '../models/BlockedSlot.model';
import Booking from '../models/Booking.model';
import Turf from '../models/Turf.model';
import Court from '../models/Court.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response.utils';
import { blockSlotSchema, bulkBlockSlotSchema } from '../validators/turf.validator';
import { isSlotAvailable } from '../utils/slot.utils';
import { emitSlotBlocked, emitSlotUnblocked } from '../socket/slot.socket';

// ---- BLOCK A SLOT ----
export const blockSlot = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const body = blockSlotSchema.parse(req.body);

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id, isActive: true }).lean();
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const court = await Court.findOne({ _id: body.courtId, turf: turfId, isActive: true }).lean();
  if (!court) {
    sendError(res, 'Court not found.', 404);
    return;
  }

  const queryDate = new Date(body.date);
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  // Check no overlapping bookings exist
  const existingBookings = await Booking.find({
    court: body.courtId,
    date: { $gte: queryDate, $lt: nextDate },
    status: { $in: ['pending', 'confirmed'] },
  })
    .lean()
    .select('startTime endTime');

  const available = isSlotAvailable(
    existingBookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    body.startTime,
    body.endTime
  );

  if (!available) {
    sendError(res, 'Cannot block this slot — it conflicts with an existing booking.', 409);
    return;
  }

  // Check no overlapping blocked slots
  const existingBlocked = await BlockedSlot.find({
    court: body.courtId,
    date: { $gte: queryDate, $lt: nextDate },
  })
    .lean()
    .select('startTime endTime');

  const notBlockedAlready = isSlotAvailable(
    existingBlocked.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    body.startTime,
    body.endTime
  );

  if (!notBlockedAlready) {
    sendError(res, 'This slot is already blocked.', 409);
    return;
  }

  const blockedSlot = await BlockedSlot.create({
    turf: turfId,
    court: body.courtId,
    date: queryDate,
    startTime: body.startTime,
    endTime: body.endTime,
    reason: body.reason,
    notes: body.notes,
    blockedBy: req.user!._id,
  });

  // Emit real-time update to all users watching this court's availability
  emitSlotBlocked(turfId, body.courtId, body.date, {
    startTime: body.startTime,
    endTime: body.endTime,
    status: 'blocked',
    blockedSlotId: blockedSlot._id.toString(),
    reason: body.reason,
  });

  sendSuccess(res, { blockedSlot }, 'Slot blocked successfully', 201);
});

// ---- UNBLOCK A SLOT ----
export const unblockSlot = asyncHandler(async (req: Request, res: Response) => {
  const { turfId, slotId } = req.params;

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id }).lean();
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const blockedSlot = await BlockedSlot.findOne({ _id: slotId, turf: turfId });
  if (!blockedSlot) {
    sendError(res, 'Blocked slot not found.', 404);
    return;
  }

  const dateStr = blockedSlot.date.toISOString().slice(0, 10);
  const courtId = blockedSlot.court.toString();

  await blockedSlot.deleteOne();

  emitSlotUnblocked(turfId, courtId, dateStr, slotId);

  sendSuccess(res, null, 'Slot unblocked successfully');
});

// ---- GET BLOCKED SLOTS ----
export const getBlockedSlots = asyncHandler(async (req: Request, res: Response) => {
  const { turfId, courtId } = req.params;
  const { date } = req.query as { date: string };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    sendError(res, 'Date is required in YYYY-MM-DD format.', 400);
    return;
  }

  const queryDate = new Date(date);
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const blockedSlots = await BlockedSlot.find({
    turf: turfId,
    court: courtId,
    date: { $gte: queryDate, $lt: nextDate },
  })
    .lean()
    .select('startTime endTime reason notes _id createdAt');

  sendSuccess(res, { blockedSlots }, 'Blocked slots retrieved');
});

// ---- BULK BLOCK SLOTS ----
export const bulkBlockSlots = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const body = bulkBlockSlotSchema.parse(req.body);

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id, isActive: true }).lean();
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const court = await Court.findOne({ _id: body.courtId, turf: turfId, isActive: true }).lean();
  if (!court) {
    sendError(res, 'Court not found.', 404);
    return;
  }

  const queryDate = new Date(body.date);
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  // Fetch existing conflicts
  const [existingBookings, existingBlocked] = await Promise.all([
    Booking.find({
      court: body.courtId,
      date: { $gte: queryDate, $lt: nextDate },
      status: { $in: ['pending', 'confirmed'] },
    })
      .lean()
      .select('startTime endTime'),
    BlockedSlot.find({
      court: body.courtId,
      date: { $gte: queryDate, $lt: nextDate },
    })
      .lean()
      .select('startTime endTime'),
  ]);

  const occupied = [
    ...existingBookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    ...existingBlocked.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
  ];

  const conflictingSlots: { startTime: string; endTime: string }[] = [];
  const slotsToBlock: { startTime: string; endTime: string }[] = [];

  for (const slot of body.slots) {
    if (!isSlotAvailable(occupied, slot.startTime, slot.endTime)) {
      conflictingSlots.push(slot);
    } else {
      slotsToBlock.push(slot);
    }
  }

  if (slotsToBlock.length === 0) {
    sendError(res, 'All slots conflict with existing bookings or blocks.', 409);
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const createdSlots = await BlockedSlot.create(
      slotsToBlock.map((slot) => ({
        turf: turfId,
        court: body.courtId,
        date: queryDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: body.reason,
        notes: body.notes,
        blockedBy: req.user!._id,
      })),
      { session }
    );

    await session.commitTransaction();

    // Emit real-time updates for each successfully blocked slot
    for (const slot of createdSlots) {
      emitSlotBlocked(turfId, body.courtId, body.date, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'blocked',
        blockedSlotId: slot._id.toString(),
        reason: body.reason,
      });
    }

    sendSuccess(
      res,
      {
        blocked: createdSlots,
        conflicts: conflictingSlots,
        blockedCount: createdSlots.length,
        conflictCount: conflictingSlots.length,
      },
      `${createdSlots.length} slot(s) blocked. ${conflictingSlots.length} conflict(s) skipped.`,
      201
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
