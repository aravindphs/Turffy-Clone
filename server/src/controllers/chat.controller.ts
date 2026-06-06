import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.model';
import Booking from '../models/Booking.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import { createNotification } from '../services/notification.service';
import { getIo } from '../socket/index';

// Helper: check if user is a participant in a booking's chat
const isParticipant = async (
  bookingId: string,
  userId: string
): Promise<{ allowed: boolean; booking: import('../models/Booking.model').IBooking | null }> => {
  const booking = await Booking.findById(bookingId)
    .populate('turf', 'owner')
    .lean();

  if (!booking) return { allowed: false, booking: null };

  const bookingUserId = booking.user.toString();
  const turfOwner = (booking.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();

  return {
    allowed: userId === bookingUserId || userId === turfOwner,
    booking: booking as unknown as import('../models/Booking.model').IBooking,
  };
};

// ---- GET MESSAGES ----
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { page = '1', limit = '50' } = req.query as Record<string, string>;

  if (!mongoose.isValidObjectId(bookingId)) {
    sendError(res, 'Invalid booking ID.', 400);
    return;
  }

  const userId = req.user!._id.toString();
  const { allowed, booking } = await isParticipant(bookingId, userId);

  if (!allowed || !booking) {
    sendError(res, 'Access denied. You are not a participant in this booking.', 403);
    return;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({ booking: bookingId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 }) // newest first for pagination
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Message.countDocuments({ booking: bookingId }),
  ]);

  // Mark messages sent to this user as read
  const receiverRole = req.user!.role === 'owner' ? 'owner' : 'user';
  await Message.updateMany(
    { booking: bookingId, receiverRole, isRead: false },
    { $set: { isRead: true } }
  );

  sendPaginated(res, messages.reverse(), total, pageNum, limitNum, 'Messages retrieved');
});

// ---- SEND MESSAGE (HTTP fallback — prefer WebSocket) ----
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { content } = req.body as { content: string };

  if (!mongoose.isValidObjectId(bookingId)) {
    sendError(res, 'Invalid booking ID.', 400);
    return;
  }

  if (!content || !content.trim()) {
    sendError(res, 'Message content is required.', 400);
    return;
  }

  const userId = req.user!._id.toString();
  const { allowed, booking } = await isParticipant(bookingId, userId);

  if (!allowed || !booking) {
    sendError(res, 'Access denied.', 403);
    return;
  }

  const bookingUserId = booking.user.toString();
  const turfOwner = (booking.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();
  const senderIsUser = userId === bookingUserId;
  const receiverRole: 'user' | 'owner' = senderIsUser ? 'owner' : 'user';
  const receiverId = senderIsUser ? turfOwner : bookingUserId;

  const message = await Message.create({
    booking: bookingId,
    sender: req.user!._id,
    receiverRole,
    content: content.trim().slice(0, 2000),
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name avatar role')
    .lean();

  // Push to Socket.io room
  try {
    const io = getIo();
    io.to(`booking:${bookingId}`).emit('chat:message', populatedMessage);
  } catch {
    // Socket.io might not be available — HTTP response is enough
  }

  // Notify receiver
  if (receiverId) {
    createNotification(
      receiverId,
      'chat_message',
      'New message received',
      `${req.user!.name} sent you a message`,
      { bookingId, messageId: message._id.toString() }
    ).catch(console.error);
  }

  sendSuccess(res, { message: populatedMessage }, 'Message sent', 201);
});
