import { Socket, Server } from 'socket.io';
import { getIo } from './index';

export interface SlotEventData {
  startTime: string;
  endTime: string;
  status: 'booked' | 'blocked' | 'available';
  bookingId?: string;
  blockedSlotId?: string;
  reason?: string;
}

/**
 * Register slot-related socket event handlers on a connected socket.
 */
export const registerSlotHandlers = (socket: Socket): void => {
  // Client joins a turf+court+date room to receive live slot updates
  socket.on(
    'join:turf',
    (data: { turfId: string; courtId: string; date: string }) => {
      if (!data.turfId || !data.courtId || !data.date) return;
      const room = `turf:${data.turfId}:${data.courtId}:${data.date}`;
      socket.join(room);
      socket.emit('joined:turf', { room });
    }
  );

  // Client leaves the room (e.g., navigating away)
  socket.on(
    'leave:turf',
    (data: { turfId: string; courtId: string; date: string }) => {
      if (!data.turfId || !data.courtId || !data.date) return;
      const room = `turf:${data.turfId}:${data.courtId}:${data.date}`;
      socket.leave(room);
    }
  );
};

/**
 * Emit to all sockets watching a turf/court/date room that a slot was blocked.
 */
export const emitSlotBlocked = (
  turfId: string,
  courtId: string,
  date: string,
  slot: SlotEventData
): void => {
  try {
    const io: Server = getIo();
    const room = `turf:${turfId}:${courtId}:${date}`;
    io.to(room).emit('slot:blocked', slot);
  } catch {
    // Silently ignore if io not initialized
  }
};

/**
 * Emit to all sockets watching a turf/court/date room that a slot was booked.
 */
export const emitSlotBooked = (
  turfId: string,
  courtId: string,
  date: string,
  slot: SlotEventData
): void => {
  try {
    const io: Server = getIo();
    const room = `turf:${turfId}:${courtId}:${date}`;
    io.to(room).emit('slot:booked', slot);
  } catch {
    // Silently ignore
  }
};

/**
 * Emit to all sockets watching a turf/court/date room that a slot was unblocked / freed.
 */
export const emitSlotUnblocked = (
  turfId: string,
  courtId: string,
  date: string,
  slotId: string
): void => {
  try {
    const io: Server = getIo();
    const room = `turf:${turfId}:${courtId}:${date}`;
    io.to(room).emit('slot:unblocked', { slotId });
  } catch {
    // Silently ignore
  }
};
