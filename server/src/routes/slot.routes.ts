import { Router } from 'express';
import * as slotController from '../controllers/slot.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router({ mergeParams: true }); // Access turfId from parent router

// ---- Owner-only routes ----
router.post(
  '/',
  authenticate,
  requireRole('owner'),
  slotController.blockSlot
);

router.post(
  '/bulk',
  authenticate,
  requireRole('owner'),
  slotController.bulkBlockSlots
);

router.delete(
  '/:slotId',
  authenticate,
  requireRole('owner'),
  slotController.unblockSlot
);

// ---- Public / owner route ----
router.get(
  '/courts/:courtId',
  authenticate,
  slotController.getBlockedSlots
);

export default router;
