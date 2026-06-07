import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpiryToMs,
} from '../utils/jwt.utils';
import { env } from '../config/env';
import {
  googleLoginSchema,
  updateProfileSchema,
} from '../validators/auth.validator';
import {
  sendWelcomeEmail,
} from '../services/email.service';
import { cloudinary } from '../middleware/upload';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Set access + refresh tokens in httpOnly cookies.
 */
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: parseExpiryToMs(env.JWT_EXPIRES_IN),
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
    path: '/api/v1/auth/refresh-token',
  });
};

const clearTokenCookies = (res: Response): void => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' });
};

// ---- GOOGLE LOGIN ----
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const body = googleLoginSchema.parse(req.body);

  const ticket = await googleClient.verifyIdToken({
    idToken: body.googleToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    sendError(res, 'Invalid Google token.', 401);
    return;
  }

  let user = await User.findOne({ email: payload.email }).select('+googleId +refreshToken');

  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
      avatar: payload.picture || undefined,
      isVerified: true,
      role: body.role,
    });
    sendWelcomeEmail(user).catch(console.error);
  } else if (!user.googleId) {
    // Link Google account to existing email account
    user.googleId = payload.sub;
    if (!user.isVerified) user.isVerified = true;
    if (payload.picture && !user.avatar) user.avatar = payload.picture;
  }

  if (!user.isActive) {
    sendError(res, 'Your account has been deactivated. Please contact support.', 403);
    return;
  }

  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  sendSuccess(res, { user: user.toJSON() }, 'Logged in with Google successfully');
});

// ---- LOGOUT ----
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  }
  clearTokenCookies(res);
  sendSuccess(res, null, 'Logged out successfully');
});

// ---- REFRESH TOKEN ----
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token: string | undefined = req.cookies?.refreshToken;

  if (!token) {
    sendError(res, 'Refresh token not found. Please log in again.', 401);
    return;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    clearTokenCookies(res);
    sendError(res, 'Invalid or expired refresh token. Please log in again.', 401);
    return;
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  if (!user) {
    clearTokenCookies(res);
    sendError(res, 'User not found.', 401);
    return;
  }

  if (!user.isActive) {
    clearTokenCookies(res);
    sendError(res, 'Your account has been deactivated.', 403);
    return;
  }

  // Validate refresh token matches stored hash
  if (!user.refreshToken) {
    clearTokenCookies(res);
    sendError(res, 'Session expired. Please log in again.', 401);
    return;
  }

  const isValid = await user.compareRefreshToken(token);
  if (!isValid) {
    clearTokenCookies(res);
    sendError(res, 'Invalid refresh token. Please log in again.', 401);
    return;
  }

  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Rotate refresh token
  user.refreshToken = newRefreshToken;
  await user.save();

  setTokenCookies(res, newAccessToken, newRefreshToken);
  sendSuccess(res, null, 'Token refreshed successfully');
});

// ---- GET ME ----
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id).lean();
  if (!user) {
    sendError(res, 'User not found.', 404);
    return;
  }
  sendSuccess(res, { user }, 'User profile retrieved');
});

// ---- UPDATE PROFILE ----
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const body = updateProfileSchema.parse(req.body);

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.phone) updateData.phone = body.phone;

  // Handle avatar upload
  if (req.file) {
    const oldUser = await User.findById(req.user!._id).lean();
    // Delete old avatar from Cloudinary if it exists and isn't a Google avatar
    if (oldUser?.avatar && (req.file as Express.Multer.File & { public_id?: string }).public_id) {
      // Old avatar was from Cloudinary — extract public_id from URL
      const urlParts = oldUser.avatar.split('/');
      const oldPublicId = urlParts
        .slice(urlParts.indexOf('turffy'))
        .join('/')
        .replace(/\.[^.]+$/, '');
      if (oldPublicId.startsWith('turffy/avatars/')) {
        cloudinary.uploader.destroy(oldPublicId).catch(console.error);
      }
    }
    updateData.avatar = (req.file as Express.Multer.File & { path?: string }).path;
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  sendSuccess(res, { user }, 'Profile updated successfully');
});

