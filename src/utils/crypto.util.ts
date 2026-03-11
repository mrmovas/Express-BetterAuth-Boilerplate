import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '@/config/env.config';





/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};




/**
 * Compare a plain text password with a hashed password
 * 
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};




/**
 * Generate a cryptographically secure random token
 * 
 * @param bytes - Number of random bytes (default: 32)
 * @returns Hex-encoded token
 */
export const generateToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};




/**
 * Hash a token for secure storage
 * 
 * @param token - Plain text token
 * @returns Hashed token
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};




/**
 * Generate and hash a token in one step
 * Returns both the plain token (to send to user) and hash (to store in DB)
 * 
 * @param bytes - Number of random bytes
 * @returns Object with plain token and hash
 */
export const generateAndHashToken = (bytes: number = 32) => {
  const token = generateToken(bytes);
  const hash = hashToken(token);
  return { token, hash };
};




/**
 * Timing-safe string comparison
 * Prevents timing attacks when comparing secrets
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match
 */
export const timingSafeCompare = (a: string, b: string): boolean => {
  if(a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};




/**
 * Generate a CSRF token
 * 
 * @returns CSRF token
 */
export const generateCsrfToken = (): string => {
  return generateToken(32);
};