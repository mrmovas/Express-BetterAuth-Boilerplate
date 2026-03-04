import { Request, Response } from 'express';

import { SignupInput, VerifyEmailInput } from '@/core/auth/auth.validation';

// UTILS
import { sendSuccess, sendConflict, sendError } from '@/shared/utils/response.util';
import { hashToken } from '@/shared/utils/crypto.util';
import { logger, reqCtx } from '@/shared/utils/logger.util';

// SERVICE
import { signupService, verifyEmailService } from '@/core/auth/auth.service'



/**
 * Request<
 *   Params,
 *   ResBody,
 *   ReqBody,
 *   ReqQuery,
 * >
 */




/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function signupController(req: Request<{}, {}, SignupInput>, res: Response): Promise<any> {
    try {
        const result = await signupService(req.body);

        if(!result.success) {
            if(result.error === 'EMAIL_ALREADY_EXISTS') {
                logger.info('Signup rejected: email already registered', {
                    email: result.email,    // Safe to log — it's already in our DB
                    ...reqCtx(req)
                });
                sendConflict(res, result.message);
                return;
            }

            // Unexpected failure - log at error with full context
            logger.error('Signup failed unexpectedly', {
                error: result.error,
                ...reqCtx(req),
            });
            sendError(res, 'Registration failed. Please try again.');
            return;
        }

        logger.info('Signup successful', {
            ...reqCtx(req),
        });

        sendSuccess(
            res,
            { userId: result.userId },
            'Registration successful. Please check your email to verify your account.',
            201
        );
    } catch(error) {
        logger.error('Signup failed with exception', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendConflict(res, 'Registration failed. Please try again.');
    }
}




/**
 * GET /api/auth/verify-email
 * Verify email with token
 * Query params: token
 */
export async function verifyEmailController(req: Request<{}, {}, {}, VerifyEmailInput>, res: Response): Promise<any> {
    try {
        const { token } = req.query;

        if(!token || typeof token !== 'string') {
            logger.warn('Email verification attempted with missing token', {
                ...reqCtx(req),
            });
            return sendError(res, 'Invalid verification token', 400);
        }

        const result = await verifyEmailService(token);

        if(!result.success) {
            logger.warn('Email verification failed', {
                ...reqCtx(req),
                reason: result.reason,
                tokenHash: hashToken(token),
            });
            return sendError(res, 'Invalid or expired verification token', 400);
        }

        logger.info('Email verified successfully', {
            ...reqCtx(req),
            userId: result.userId,
        });
        
        sendSuccess(res, null, 'Email verified successfully.');
    } catch(error) {
        logger.error('Email verification failed with exception', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'An unexpected error occurred. Please try again.');
    }
}