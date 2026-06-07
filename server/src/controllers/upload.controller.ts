import { Request, Response } from 'express';
import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response.utils';
import { env } from '../config/env';

export const getUploadSignature = asyncHandler(async (req: Request, res: Response) => {
  const { folder = 'turffy/turfs' } = req.query as { folder?: string };

  // Only allow turffy/* folders
  const allowedFolders = ['turffy/turfs', 'turffy/avatars'];
  if (!allowedFolders.includes(folder)) {
    sendError(res, 'Invalid upload folder.', 400);
    return;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(params + env.CLOUDINARY_API_SECRET)
    .digest('hex');

  sendSuccess(res, {
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
  }, 'Upload signature generated');
});
