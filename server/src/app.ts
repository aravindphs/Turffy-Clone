import './config/env'; // Validate env vars first
import http from 'http';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';

// xss-clean does not ship TypeScript types — use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xss = require('xss-clean');

import connectDB, { gracefulShutdown } from './config/db';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { initSocket } from './socket/index';

// Routes
import authRoutes from './routes/auth.routes';
import turfRoutes from './routes/turf.routes';
import bookingRoutes from './routes/booking.routes';
import slotRoutes from './routes/slot.routes';
import reviewRoutes from './routes/review.routes';
import chatRoutes from './routes/chat.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import subscriptionRoutes from './routes/subscription.routes';

const app: Application = express();
const httpServer = http.createServer(app);

// ---- Security Middleware ----
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (origin === env.CLIENT_URL) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// ---- Parsing ----
// Webhook route needs raw body — register before express.json()
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// ---- Security Sanitization ----
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ---- Compression & Logging ----
app.use(compression());
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ---- Global Rate Limiter ----
app.use('/api', generalLimiter);

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---- API Routes ----
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/turfs`, turfRoutes);
app.use(`${API}/turfs/:turfId/blocked-slots`, slotRoutes);
app.use(`${API}/bookings`, bookingRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use(`${API}/subscription`, subscriptionRoutes);

// ---- 404 Handler ----
app.use(notFound);

// ---- Global Error Handler ----
app.use(errorHandler);

// ---- Initialize Socket.io ----
initSocket(httpServer);

// ---- Start Server ----
const startServer = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
    console.log(`API base: http://localhost:${env.PORT}/api/v1`);
  });
};

// ---- Graceful Shutdown ----
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  httpServer.close(async () => {
    console.log('HTTP server closed.');
    await gracefulShutdown();
    console.log('Graceful shutdown complete.');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown stalls
  setTimeout(() => {
    console.error('Could not close connections in time. Forcing shutdown.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, httpServer };
