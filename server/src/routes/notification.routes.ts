import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.patch('/read-all', authenticate, notificationController.markAllAsRead);
router.patch('/:notificationId/read', authenticate, notificationController.markAsRead);
router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

export default router;
