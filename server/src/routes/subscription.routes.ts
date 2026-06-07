import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import * as sub from '../controllers/subscription.controller';

const router = Router();

router.get('/', authenticate, requireRole('owner'), sub.getSubscriptionStatus);
router.post('/order', authenticate, requireRole('owner'), sub.createSubscriptionOrder);
router.post('/verify', authenticate, requireRole('owner'), sub.verifySubscriptionPayment);

export default router;
