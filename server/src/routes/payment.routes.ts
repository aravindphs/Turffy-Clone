import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// Re-create order for a pending booking
router.post(
  '/orders/:bookingId',
  authenticate,
  paymentLimiter,
  paymentController.createOrder
);

// Razorpay webhook (no auth — webhook calls this)
router.post('/webhook', paymentController.webhookVerify);

// User payment history
router.get('/history', authenticate, paymentController.getPaymentHistory);

export default router;
