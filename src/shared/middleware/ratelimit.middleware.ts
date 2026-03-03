import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../../config/env.config';

import { sendTooManyRequests } from '../utils/response.util';



/**
 * General rate limiter for all routes
 */
export const generalRateLimiterMiddleware = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
        sendTooManyRequests(res, "Too many requests, please try again later.");
    }
})




/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks
 */
export const authRateLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    sendTooManyRequests(res, 'Too many authentication attempts. Please try again in 15 minutes.');
  },
});




/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset functionality
 */
export const passwordResetRateLimiterMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    sendTooManyRequests(res, 'Too many password reset requests. Please try again in 1 hour.');
  },
});




/**
 * Rate limiter for email verification resend
 */
export const emailVerificationRateLimiterMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many verification email requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    sendTooManyRequests(res, 'Too many verification email requests. Please try again in 1 hour.');
  },
});