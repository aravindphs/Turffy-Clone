import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils';
import User, { IUser } from '../models/User.model';
import { sendError } from '../utils/response.utils';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Extract token from httpOnly cookie or Authorization header.
 */
const extractToken = (req: Request): string | null => {
  // 1. Check httpOnly cookie (preferred)
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken as string;
  }
  // 2. Fallback: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

/**
 * Authenticate middleware - requires valid JWT.
 * Attaches the full user document to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    sendError(res, 'Authentication required. Please log in.', 401);
    return;
  }

  let decoded: TokenPayload & { iat?: number; exp?: number };
  try {
    decoded = verifyAccessToken(token);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Access token expired. Please refresh your session.', 401);
    } else {
      sendError(res, 'Invalid access token.', 401);
    }
    return;
  }

  const user = await User.findById(decoded.userId).lean<IUser>();

  if (!user) {
    sendError(res, 'User not found. Token may be stale.', 401);
    return;
  }

  if (!user.isActive) {
    sendError(res, 'Your account has been deactivated. Please contact support.', 403);
    return;
  }

  req.user = user as IUser;
  next();
};

/**
 * Optional auth middleware - attaches user if token present but does NOT fail if absent.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).lean<IUser>();
    if (user && user.isActive) {
      req.user = user as IUser;
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }

  next();
};
