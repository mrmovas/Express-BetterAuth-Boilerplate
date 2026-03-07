import { Request, Response } from 'express';
import { env } from '@/config/env.config';

// VALIDATION INPUT TYPES
import { 
    SignupInput, 
    VerifyEmailInput, 
    LoginInput, 
    ResendVerificationInput,
    RequestPasswordResetInput,
    ResetPasswordInput,
    ChangePasswordInput
} from '@/core/auth/auth.validation';

// UTILS
import { sendSuccess, sendConflict, sendError, sendUnauthorized } from '@/shared/utils/response.util';
import { hashToken } from '@/shared/utils/crypto.util';
import { logger, reqCtx } from '@/shared/utils/logger.util';

// SERVICE
import { 
    signupService, 
    verifyEmailService, 
    loginService, 
    resendVerificationService,
    requestPasswordResetService,
    resetPasswordService,
    changePasswordService
} from '@/core/auth/auth.service'



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

        // FOR SUCCESS
        if(result.success) {
            logger.info('Signup successful', {
              ...reqCtx(req),
            });

            sendSuccess(
                res,
                { userID: result.userID },
                'Registration successful. Please check your email to verify your account.',
                201
            );
            
            return;
        }


        // FOR NON SUCCESS
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

    } catch(error) {
        logger.error('Signup controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'An unexpected error occurred. Please try again.');
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
        logger.error('Email verification controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'An unexpected error occurred. Please try again.');
    }
}





/**
 * POST /api/auth/login
 * Authenticate user
 */
export async function loginController(req: Request<{}, {}, LoginInput>, res: Response): Promise<any> {
    try {
        const result = await loginService(req.body);

        if(!result.success) {
            logger.warn('Login failed', {
                reason: result.reason,
                ...reqCtx(req),
            });

            sendError(res, 'Invalid email or password', 401);            
            return;
        }

        logger.info('Login successful', {
            ...reqCtx(req),
        });

        //add user to session
        req.session.user = result.user;

        sendSuccess(res, { userID: result.user.id }, 'Login successful.');

    } catch(error) {
        logger.error('Login controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'An unexpected error occurred. Please try again.');
    }
}




/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
export async function resendVerificationController(req: Request<{}, {}, ResendVerificationInput>, res: Response): Promise<any> {
    try {
        await resendVerificationService(req.body);

        sendSuccess(res, null, 'If the email is registered and not verified, a new verification email has been sent.');
    } catch(error) {
        logger.error('Resend verification controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'Failed to resend verification email');
    }
}




/**
 * POST /api/auth/request-password-reset
 * Request a password reset
 */
export async function requestPasswordResetController(req: Request<{}, {}, RequestPasswordResetInput>, res: Response): Promise<any> {
    try {
        await requestPasswordResetService(req.body);

        sendSuccess(res, null, 'If the email is registered, a password reset link has been sent.');
    } catch(error) {
        logger.error('Request password reset controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'Failed to process password reset request');
    }
}




/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function resetPasswordController(req: Request<{}, {}, ResetPasswordInput>, res: Response): Promise<any> {
    try {
        const result = await resetPasswordService(req.body);

        if(!result.success) {
            logger.warn('Password reset failed', {
                reason: result.reason,
                ...reqCtx(req),
            });
            return sendError(res, 'Invalid or expired password reset token', 400);
        }

        logger.info('Password reset successful', { ...reqCtx(req) });
        sendSuccess(res, null, 'Password has been reset successfully.');

    } catch(error) {
        logger.error('Reset password controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'Password reset failed');
    }
}





/**
 * PROTECTED CONTROLLER - requires user to be authenticated
 */


/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
export async function getCurrentUserController(req: Request, res: Response): Promise<any> {
    try {
        const user = req.session.user;

        if(!user) {
            logger.warn('Get current user attempted without authentication', { ...reqCtx(req) });
            return sendUnauthorized(res);
        }

        sendSuccess(res, { user: user });
    } catch(error) {
        logger.error('Get current user controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'Failed to retrieve user information');
    }
}




/**
 * POST /api/auth/logout
 * Destroy user session
 */
export async function logoutController(req: Request, res: Response): Promise<any> {
    req.session.destroy((err) => {
        if(err) {
            logger.error('Logout failed', {
                error: (err instanceof Error) ? err.message : String(err),
                ...reqCtx(req),
            });
            return sendError(res, 'An unexpected error occurred. Please try again.');
        }

        res.clearCookie(env.SESSION_NAME); // Clear session cookie on client side

        logger.info('User logged out', { ...reqCtx(req) });
        return sendSuccess(res, null, 'Logout successful.');
    });
}




/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
export async function changePasswordController(req: Request<{}, {}, ChangePasswordInput>, res: Response): Promise<any> {
    try {
        const userID = req.session.user?.id;
        if(!userID) return sendUnauthorized(res);

        const result = await changePasswordService(userID, req.body.oldPassword, req.body.newPassword);

        if(!result.success) {
            logger.warn('Change password failed', {
                reason: result.reason,
                ...reqCtx(req),
            });
            return sendError(res, 'Current password is incorrect', 400);
        }

        logger.info('Password changed successfully', { ...reqCtx(req) });
        sendSuccess(res, null, 'Password changed successfully.');
    } catch(error) {
        logger.error('Change password controller error', {
            error: (error instanceof Error) ? error.message : String(error),
            ...reqCtx(req),
        });
        sendError(res, 'Failed to change password');
    }
}