import { Server } from 'socket.io';
import { getIo } from './index';

/**
 * Emit a notification to a specific user's room.
 * The user's personal room is `user:${userId}`.
 */
export const emitNotification = (userId: string, notification: unknown): void => {
  try {
    const io: Server = getIo();
    io.to(`user:${userId}`).emit('notification:new', notification);
  } catch {
    // Socket.io may not be initialized during tests — silently ignore
  }
};
