import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/revenue', adminController.getRevenue);

// Turf management
router.get('/turfs', adminController.getAllTurfs);
router.get('/turfs/pending', adminController.getPendingTurfs);
router.patch('/turfs/:turfId/approve', adminController.approveTurf);
router.patch('/turfs/:turfId/reject', adminController.rejectTurf);

// User management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/toggle-status', adminController.toggleUserStatus);

// Booking management
router.get('/bookings', adminController.getAllBookings);

export default router;
