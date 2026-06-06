import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// ---- Public ----
router.get('/turf/:turfId', reviewController.getReviews);

// ---- User only ----
router.post(
  '/',
  authenticate,
  requireRole('user'),
  reviewController.createReview
);

// ---- Owner only ----
router.post(
  '/:reviewId/reply',
  authenticate,
  requireRole('owner'),
  reviewController.ownerReply
);

// ---- User or Admin ----
router.delete(
  '/:reviewId',
  authenticate,
  reviewController.deleteReview
);

export default router;
