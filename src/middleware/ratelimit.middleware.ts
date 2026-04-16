import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { rateLimitConfig } from '@/config/config';

import { sendTooManyRequests } from '@/utils/response.util';



/**
 * General rate limiter for all routes
 */
export const generalRateLimiterMiddleware = rateLimit({
    windowMs: rateLimitConfig.general.windowsMs,
    max: rateLimitConfig.general.maxRequests,
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (_req: Request, res: Response) => {
        sendTooManyRequests(res, "Too many requests, please try again later.");
    }
})