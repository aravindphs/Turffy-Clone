import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
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
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../validators/auth.validator';
import {
  sendWelcomeEmail,
  sendPasswordReset,
  sendEmailVerification,
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

// ---- REGISTER ----
export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email: body.email }).lean();
  if (existingUser) {
    sendError(res, 'An account with this email already exists.', 409);
    return;
  }

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
    phone: body.phone,
  });

  // Generate email verification OTP
  const verificationOtp = crypto.randomInt(100000, 999999).toString();
  const verificationOtpHash = await bcrypt.hash(verificationOtp, 10);
  user.emailVerificationOtp = verificationOtpHash;
  user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Send verification email (fire and forget)
  sendEmailVerification(user, verificationOtp).catch(console.error);

  const safeUser = user.toJSON();
  sendSuccess(res, { user: safeUser }, 'Account created successfully. Check your email to verify your account.', 201);
});

// ---- LOGIN ----
export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select('+password +refreshToken');
  if (!user || !user.password) {
    sendError(res, 'Invalid email or password.', 401);
    return;
  }

  const isPasswordValid = await user.comparePassword(body.password);
  if (!isPasswordValid) {
    sendError(res, 'Invalid email or password.', 401);
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in. Check your inbox for the OTP.',
      data: { requiresVerification: true, email: user.email },
    });
    return;
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

  const safeUser = user.toJSON();
  sendSuccess(res, { user: safeUser }, 'Logged in successfully');
});

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

// ---- FORGOT PASSWORD ----
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select(
    '+passwordResetOtp +passwordResetExpires'
  );

  // Always respond success to prevent email enumeration
  if (!user) {
    sendSuccess(res, null, 'If an account with this email exists, an OTP has been sent.');
    return;
  }

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  user.passwordResetOtp = otpHash;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  sendPasswordReset(user, otp).catch(console.error);

  sendSuccess(res, null, 'If an account with this email exists, an OTP has been sent.');
});

// ---- RESET PASSWORD ----
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = resetPasswordSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select(
    '+passwordResetOtp +passwordResetExpires +password'
  );

  if (!user || !user.passwordResetOtp || !user.passwordResetExpires) {
    sendError(res, 'Invalid or expired OTP.', 400);
    return;
  }

  if (new Date() > user.passwordResetExpires) {
    sendError(res, 'OTP has expired. Please request a new one.', 400);
    return;
  }

  const isOtpValid = await bcrypt.compare(body.otp, user.passwordResetOtp);
  if (!isOtpValid) {
    sendError(res, 'Invalid OTP.', 400);
    return;
  }

  user.password = body.newPassword;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;
  await user.save();

  clearTokenCookies(res);
  sendSuccess(res, null, 'Password reset successfully. Please log in with your new password.');
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

// ---- VERIFY EMAIL ----
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const body = verifyEmailSchema.parse(req.body);

  const user = await User.findOne({ email: body.email }).select(
    '+emailVerificationOtp +emailVerificationExpires +refreshToken'
  );

  if (!user || !user.emailVerificationOtp || !user.emailVerificationExpires) {
    sendError(res, 'Invalid or expired OTP.', 400);
    return;
  }

  if (new Date() > user.emailVerificationExpires) {
    sendError(res, 'OTP has expired. Please request a new one.', 400);
    return;
  }

  const isOtpValid = await bcrypt.compare(body.otp, user.emailVerificationOtp);
  if (!isOtpValid) {
    sendError(res, 'Invalid OTP.', 400);
    return;
  }

  user.isVerified = true;
  user.emailVerificationOtp = undefined;
  user.emailVerificationExpires = undefined;

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

  // Fire and forget welcome email after verification
  sendWelcomeEmail(user).catch(console.error);

  const safeUser = user.toJSON();
  sendSuccess(res, { user: safeUser }, 'Email verified successfully. Welcome to Turffy!');
});

// ---- RESEND VERIFICATION ----
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const body = resendVerificationSchema.parse(req.body);

  const user = await User.findOne({ email: body.email, isVerified: false }).select(
    '+emailVerificationOtp +emailVerificationExpires'
  );

  // Always respond success to prevent enumeration
  if (!user) {
    sendSuccess(res, null, 'If an unverified account with this email exists, a new OTP has been sent.');
    return;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  user.emailVerificationOtp = otpHash;
  user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  sendEmailVerification(user, otp).catch(console.error);

  sendSuccess(res, null, 'If an unverified account with this email exists, a new OTP has been sent.');
});

// ---- CHANGE PASSWORD ----
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const body = changePasswordSchema.parse(req.body);

  const user = await User.findById(req.user!._id).select('+password');
  if (!user || !user.password) {
    sendError(res, 'Cannot change password for OAuth accounts.', 400);
    return;
  }

  const isCurrentPasswordValid = await user.comparePassword(body.currentPassword);
  if (!isCurrentPasswordValid) {
    sendError(res, 'Current password is incorrect.', 400);
    return;
  }

  if (body.currentPassword === body.newPassword) {
    sendError(res, 'New password must be different from current password.', 400);
    return;
  }

  user.password = body.newPassword;
  user.refreshToken = undefined; // Invalidate all sessions
  await user.save();

  clearTokenCookies(res);
  sendSuccess(res, null, 'Password changed successfully. Please log in again.');
});
