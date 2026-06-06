import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Both user and owner can access chat for their bookings
router.get('/bookings/:bookingId/messages', authenticate, chatController.getMessages);
router.post('/bookings/:bookingId/messages', authenticate, chatController.sendMessage);

export default router;
