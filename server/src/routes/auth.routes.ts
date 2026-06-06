import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

// Public routes (with strict rate limiting)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Semi-public: refresh uses cookie (path-scoped)
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch(
  '/profile',
  authenticate,
  uploadAvatar.single('avatar'),
  authController.updateProfile
);
router.patch('/change-password', authenticate, authController.changePassword);

export default router;
