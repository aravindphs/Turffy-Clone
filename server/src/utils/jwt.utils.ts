import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

/**
 * Generate a short-lived access token.
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Generate a long-lived refresh token.
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

/**
 * Verify and decode an access token.
 * Throws if invalid or expired.
 */
export const verifyAccessToken = (token: string): DecodedToken => {
  return jwt.verify(token, env.JWT_SECRET) as DecodedToken;
};

/**
 * Verify and decode a refresh token.
 * Throws if invalid or expired.
 */
export const verifyRefreshToken = (token: string): DecodedToken => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as DecodedToken;
};

/**
 * Parse expiry string into milliseconds for cookie maxAge.
 */
export const parseExpiryToMs = (expiry: string): number => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15m
  return parseInt(match[1], 10) * units[match[2]];
};
