import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as openMatch from '../controllers/openMatch.controller';

const router = Router();

// Public routes
router.get('/', openMatch.listOpenMatches);
router.get('/turf/:turfId', openMatch.getTurfOpenMatches);
router.get('/:id', openMatch.getOpenMatch);

// Authenticated routes
router.post('/', authenticate, openMatch.createOpenMatch);
router.post('/:id/join', authenticate, openMatch.joinMatch);
router.patch('/:id/players/:userId', authenticate, openMatch.respondToJoin);
router.delete('/:id', authenticate, openMatch.cancelOpenMatch);

export default router;
