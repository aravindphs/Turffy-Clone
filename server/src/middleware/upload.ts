import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { env } from '../config/env';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// ---- Turf Images Storage ----
const turfImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'turffy/turf-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  } as unknown as Express.Multer.File,
});

const turfImageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

/**
 * Multer instance for turf images.
 * - Max 5MB per file
 * - Max 8 files
 */
export const uploadTurfImages = multer({
  storage: turfImageStorage,
  fileFilter: turfImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 8,
  },
});

// ---- Avatar Storage ----
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'turffy/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
  } as unknown as Express.Multer.File,
});

const avatarFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

/**
 * Multer instance for user avatars.
 * - Max 2MB
 * - Single file
 */
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
});
