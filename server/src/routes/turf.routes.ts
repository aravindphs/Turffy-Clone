import { Router } from 'express';
import * as turfController from '../controllers/turf.controller';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { uploadTurfImages } from '../middleware/upload';

const router = Router();

// ---- Public routes ----
router.get('/', optionalAuth, turfController.getTurfs);

// ---- Owner-only routes (must be before /:slugOrId to avoid wildcard match) ----
router.post(
  '/',
  authenticate,
  requireRole('owner'),
  turfController.createTurf
);

router.get(
  '/owner/my-turf',
  authenticate,
  requireRole('owner'),
  turfController.getMyTurf
);

router.get(
  '/my/analytics',
  authenticate,
  requireRole('owner'),
  turfController.getMyTurfAnalytics
);

// ---- Public wildcard routes (after specific paths) ----
router.get('/:slugOrId', optionalAuth, turfController.getTurf);
router.get(
  '/:turfId/courts/:courtId/availability',
  optionalAuth,
  turfController.getTurfAvailability
);

router.patch(
  '/:turfId',
  authenticate,
  requireRole('owner'),
  turfController.updateTurf
);

router.delete(
  '/:turfId',
  authenticate,
  requireRole('owner'),
  turfController.deleteTurf
);

router.post(
  '/:turfId/images',
  authenticate,
  requireRole('owner'),
  uploadTurfImages.array('images', 8),
  turfController.uploadTurfImages
);

router.delete(
  '/:turfId/images',
  authenticate,
  requireRole('owner'),
  turfController.deleteTurfImage
);

router.patch(
  '/:turfId/amenities',
  authenticate,
  requireRole('owner'),
  turfController.updateAmenities
);

router.patch(
  '/:turfId/operating-hours',
  authenticate,
  requireRole('owner'),
  turfController.updateOperatingHours
);

router.patch(
  '/:turfId/pricing',
  authenticate,
  requireRole('owner'),
  turfController.updatePricing
);

export default router;
