import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// ---- User routes ----
router.post(
  '/',
  authenticate,
  requireRole('user'),
  paymentLimiter,
  bookingController.createBooking
);

router.post(
  '/verify-payment',
  authenticate,
  requireRole('user'),
  paymentLimiter,
  bookingController.verifyPayment
);

router.get(
  '/my',
  authenticate,
  bookingController.getMyBookings
);

router.get(
  '/:bookingId',
  authenticate,
  bookingController.getBookingDetails
);

router.post(
  '/:bookingId/cancel',
  authenticate,
  bookingController.cancelBooking
);

// ---- Owner routes ----
router.get(
  '/turf/:turfId',
  authenticate,
  requireRole('owner', 'admin'),
  bookingController.getOwnerBookings
);

router.patch(
  '/:bookingId/complete',
  authenticate,
  requireRole('owner'),
  bookingController.markCompleted
);

export default router;
