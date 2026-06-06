import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt.utils';
import User, { IUser } from '../models/User.model';
import { registerSlotHandlers } from './slot.socket';
import { registerChatHandlers } from './chat.socket';

let io: Server;

/**
 * Initialize Socket.io server, attach to the HTTP server.
 */
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // --- JWT Authentication for Socket connections ---
  io.use(async (socket: Socket, next) => {
    try {
      // Accept token from cookie or handshake auth
      const token: string | undefined =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .find((c: string) => c.trim().startsWith('accessToken='))
          ?.split('=')[1];

      if (!token) {
        // Allow unauthenticated connections for public slot viewing
        (socket as SocketWithUser).user = null;
        return next();
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).lean<IUser>();

      if (!user || !user.isActive) {
        (socket as SocketWithUser).user = null;
        return next();
      }

      (socket as SocketWithUser).user = user as IUser;
      next();
    } catch {
      (socket as SocketWithUser).user = null;
      next(); // Allow connection even with bad token for public features
    }
  });

  // --- Connection handler ---
  io.on('connection', (socket: Socket) => {
    const user = (socket as SocketWithUser).user;

    if (user) {
      // Join personal notification room
      socket.join(`user:${user._id.toString()}`);
      console.log(`Socket connected: ${user.name} (${user._id})`);
    } else {
      console.log(`Socket connected: anonymous (${socket.id})`);
    }

    // Register feature handlers
    registerSlotHandlers(socket);

    if (user) {
      registerChatHandlers(socket, user);
    }

    socket.on('disconnect', (reason) => {
      if (user) {
        console.log(`Socket disconnected: ${user.name} – ${reason}`);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });
  });

  return io;
};

/**
 * Get the existing Socket.io instance.
 * Throws if initSocket() hasn't been called yet.
 */
export const getIo = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket() first.');
  }
  return io;
};

// Extend Socket type to hold authenticated user
interface SocketWithUser extends Socket {
  user: IUser | null;
}
