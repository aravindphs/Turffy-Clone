import rateLimit from 'express-rate-limit';

/**
 * General rate limiter: 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Auth rate limiter: 10 requests per 15 minutes per IP.
 * Applied to login, register, forgot-password routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * Payment rate limiter: 20 requests per hour per IP.
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again after an hour.',
  },
  skipSuccessfulRequests: false,
});
