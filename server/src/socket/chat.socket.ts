import { Socket } from 'socket.io';
import mongoose from 'mongoose';
import Message from '../models/Message.model';
import Booking from '../models/Booking.model';
import { createNotification } from '../services/notification.service';
import { IUser } from '../models/User.model';

/**
 * Register chat-related socket event handlers on a connected socket.
 */
export const registerChatHandlers = (socket: Socket, user: IUser): void => {
  // Join the chat room for a specific booking (only participants may join)
  socket.on('join:chat', async (data: { bookingId: string }) => {
    if (!data.bookingId || !mongoose.isValidObjectId(data.bookingId)) {
      socket.emit('error:chat', { message: 'Invalid booking ID' });
      return;
    }

    const booking = await Booking.findById(data.bookingId)
      .populate('turf', 'owner')
      .lean();

    if (!booking) {
      socket.emit('error:chat', { message: 'Booking not found' });
      return;
    }

    const userId = user._id.toString();
    const bookingUserId = booking.user.toString();
    const populatedTurf = booking.turf as unknown as { owner: mongoose.Types.ObjectId };
    const turfOwner = populatedTurf.owner?.toString();

    // Only booking user or turf owner can join
    if (userId !== bookingUserId && userId !== turfOwner) {
      socket.emit('error:chat', { message: 'Access denied to this chat room' });
      return;
    }

    const room = `booking:${data.bookingId}`;
    socket.join(room);
    socket.emit('joined:chat', { room, bookingId: data.bookingId });
  });

  // Handle sending a message
  socket.on(
    'send:message',
    async (data: { bookingId: string; content: string }) => {
      if (!data.bookingId || !data.content?.trim()) {
        socket.emit('error:chat', { message: 'bookingId and content are required' });
        return;
      }

      if (!mongoose.isValidObjectId(data.bookingId)) {
        socket.emit('error:chat', { message: 'Invalid booking ID' });
        return;
      }

      const booking = await Booking.findById(data.bookingId)
        .populate('turf', 'owner')
        .lean();

      if (!booking) {
        socket.emit('error:chat', { message: 'Booking not found' });
        return;
      }

      const userId = user._id.toString();
      const bookingUserId = booking.user.toString();
      const populatedTurf2 = booking.turf as unknown as { owner: mongoose.Types.ObjectId };
      const turfOwner = populatedTurf2.owner?.toString();

      if (userId !== bookingUserId && userId !== turfOwner) {
        socket.emit('error:chat', { message: 'Access denied' });
        return;
      }

      const senderIsUser = userId === bookingUserId;
      const receiverRole: 'user' | 'owner' = senderIsUser ? 'owner' : 'user';
      const receiverId = senderIsUser ? turfOwner : bookingUserId;

      // Save message to DB
      const message = await Message.create({
        booking: data.bookingId,
        sender: user._id,
        receiverRole,
        content: data.content.trim().slice(0, 2000),
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatar role')
        .lean();

      const room = `booking:${data.bookingId}`;
      // Broadcast to all in the room (including sender for confirmation)
      socket.to(room).emit('chat:message', populatedMessage);
      socket.emit('chat:message', populatedMessage);

      // Notify receiver
      if (receiverId) {
        await createNotification(
          receiverId,
          'chat_message',
          'New message received',
          `${user.name} sent you a message`,
          { bookingId: data.bookingId, messageId: message._id.toString() }
        );
      }
    }
  );

  // Typing indicators
  socket.on('typing:start', (data: { bookingId: string }) => {
    if (!data.bookingId) return;
    socket
      .to(`booking:${data.bookingId}`)
      .emit('typing:start', { userId: user._id.toString(), name: user.name });
  });

  socket.on('typing:stop', (data: { bookingId: string }) => {
    if (!data.bookingId) return;
    socket
      .to(`booking:${data.bookingId}`)
      .emit('typing:stop', { userId: user._id.toString() });
  });
};
