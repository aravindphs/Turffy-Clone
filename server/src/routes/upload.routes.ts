import { Router } from 'express';
import { getUploadSignature } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/signature', authenticate, getUploadSignature);

export default router;
