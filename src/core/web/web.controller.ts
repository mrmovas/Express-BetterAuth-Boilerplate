import { Request, Response } from 'express';
import { prisma } from '@/config/database.config';
import { env } from '@/config/env.config';
import { logger } from '@/shared/utils/logger.util';
import { getCtx } from '@/shared/utils/requestContext.utils';

// Reuse the exact same services as the API layer
import {
    signupService,
    verifyEmailService,
    loginService,
    resendVerificationService,
    requestPasswordResetService,
    resetPasswordService,
    changePasswordService,
} from '@/core/auth/auth.service';

// Reuse the exact same Zod schemas as the API layer
import {
    signupSchema,
    loginSchema,
    resendVerificationSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from '@/core/auth/auth.validation';




// ============================================================
// HELPERS
// ============================================================

/** Encode a string safely for use as a query param value */
function q(value: string): string {
    return encodeURIComponent(value);
}




/**
 * GET / — Home page
 */
export async function homeController(req: Request, res: Response): Promise<void> {
    res.render('home', {
        user: req.session?.user ?? null,
    });
}




/**
 * GET /auth — Login / registration page
 * 
 */
export async function authPageController(req: Request, res: Response): Promise<void> {
    // Already logged in — go to profile
    if (req.session?.user) {
        res.redirect('/profile');
        return;
    }

    res.render('auth', {
        // Generic error (e.g. from requireWebAuthMiddleware redirect)
        error:         req.query.error         ?? null,

        // Tab-specific messages
        loginError:      req.query.loginError      ?? null,
        loginSuccess:    req.query.loginSuccess    ?? null,
        loginUnverified: req.query.loginUnverified === 'true',
        signupError:     req.query.signupError     ?? null,
        signupSuccess:   req.query.signupSuccess   ?? null,
        resendError:     req.query.resendError     ?? null,
        resendSuccess:   req.query.resendSuccess   ?? null,
        resetReqError:   req.query.resetReqError   ?? null,
        resetReqSuccess: req.query.resetReqSuccess ?? null,

        // Which tab to show on load
        activeTab: req.query.activeTab ?? 'login',

        // Repopulate signup fields after a validation error
        signupFields: {
            firstName:   req.query.firstName   ?? '',
            lastName:    req.query.lastName    ?? '',
            email:       req.query.email       ?? '',
            countryCode: req.query.countryCode ?? '',
            phone:       req.query.phone       ?? '',
        },

        // Repopulate resend / reset-request email fields
        resendEmail:   req.query.resendEmail   ?? '',
        resetReqEmail: req.query.resetReqEmail ?? '',
    });
}




/**
 * GET /verify-email 
 * User arrives here from the link in their email: /verify-email?token=...
 * We verify immediately on page load and render the result.
 */
export async function verifyEmailPageController(req: Request, res: Response): Promise<void> {
    const token = req.query.token;

    if (!token || typeof token !== 'string' || token.length !== 64) {
        res.render('verify-email', { success: false, reason: 'INVALID_TOKEN' });
        return;
    }

    const result = await verifyEmailService(token);

    if (!result.success) {
        res.render('verify-email', { success: false, reason: result.reason });
        return;
    }

    // If user is currently logged in, refresh their session so emailVerified is up to date
    if (req.session?.user) {
        req.session.user.emailVerified = true;
    }

    res.render('verify-email', { success: true });
}




/**
 * GET /reset-password - RESET PASSWORD PAGE
 * User arrives here from the link in their email: /reset-password?token=...
 * We just render the form — the token is passed as a hidden field.
 */
export async function resetPasswordPageController(req: Request, res: Response): Promise<void> {
    const token = req.query.token;

    if (!token || typeof token !== 'string' || token.length !== 64) {
        res.render('reset-password', {
            validToken: false,
            token:      null,
            error:      null,
            success:    false,
        });
        return;
    }

    res.render('reset-password', {
        validToken: true,
        token,
        error:   req.query.error   ?? null,
        success: req.query.success ?? null,
    });
}




/**
 * GET /profile — Profile page (protected via requireWebAuthMiddleware)
 */
export async function profileController(req: Request, res: Response): Promise<void> {
    const userId = req.session!.user!.id;

    const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: {
            id:            true,
            firstName:     true,
            lastName:      true,
            email:         true,
            emailVerified: true,
            role:          true,
            createdAt:     true,
        },
    });

    // Session exists but user was deleted from DB
    if (!user) {
        req.session.destroy(() => {});
        res.redirect('/auth?loginError=' + q('Session expired. Please log in again'));
        return;
    }

    res.render('profile', {
        user,
        error:             req.query.error             ?? null,
        success:           req.query.success           ?? null,
        changePassError:   req.query.changePassError   ?? null,
        changePassSuccess: req.query.changePassSuccess ?? null,
    });
}




/**
 * POST /auth/login
 */
export async function handleLoginController(req: Request, res: Response): Promise<void> {
    // Validate with Zod — same schema as the API
    const parsed = loginSchema.safeParse({
        email:    req.body.email,
        password: req.body.password,
    });

    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
        res.redirect('/auth?loginError=' + q(msg) + '&activeTab=login');
        return;
    }

    const result = await loginService(parsed.data);

    if(!result.success && result.reason === 'EMAIL_NOT_VERIFIED') {
        res.redirect(
            '/auth?loginError=' + q('Email not verified. Please check your inbox.') +
            '&loginUnverified=true' +
            '&activeTab=login'
        );
        return;
    }

    if (!result.success) {
        // Generic message — don't reveal whether email or password was wrong
        res.redirect('/auth?loginError=' + q('Invalid email or password') + '&activeTab=login');
        return;
    }

    // Regenerate session ID to prevent session fixation
    req.session.regenerate((err) => {
        if (err) {
            logger.error('Session regeneration failed on login', { error: err, ...getCtx() });
            res.redirect('/auth?loginError=' + q('Login failed. Please try again') + '&activeTab=login');
            return;
        }

        req.session.user = result.user;
        logger.info('Web login successful', { userId: result.user.id, ...getCtx() });
        res.redirect('/profile');
    });
}




/**
 * POST /auth/signup
 */
export async function handleSignupController(req: Request, res: Response): Promise<void> {
    const { firstName, lastName, email, password, countryCode, phone } = req.body;

    // Build repopulation params — sent back on error so user doesn't retype everything
    const fields = new URLSearchParams({
        firstName:   firstName   ?? '',
        lastName:    lastName    ?? '',
        email:       email       ?? '',
        countryCode: countryCode ?? '',
        phone:       phone       ?? '',
        activeTab:   'register',
    }).toString();

    const parsed = signupSchema.safeParse({
        firstName,
        lastName,
        email,
        password,
        phone: { countryCode, number: phone },
    });

    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
        res.redirect('/auth?signupError=' + q(msg) + '&' + fields);
        return;
    }

    const result = await signupService(parsed.data);

    if (!result.success) {
        if (result.error === 'EMAIL_ALREADY_EXISTS') {
            res.redirect('/auth?signupError=' + q('That email is already registered') + '&' + fields);
            return;
        }
        res.redirect('/auth?signupError=' + q('Registration failed. Please try again') + '&' + fields);
        return;
    }

    logger.info('Web signup successful', { userId: result.userID, ...getCtx() });
    res.redirect('/auth?signupSuccess=' + q('Account created! Check your email to verify, then log in') + '&activeTab=login');
}




/***
 * POST /auth/resend-verification
 */
export async function handleResendVerificationController(req: Request, res: Response): Promise<void> {
    const email = req.body.email ?? '';

    const parsed = resendVerificationSchema.safeParse({ email });

    if (!parsed.success) {
        res.redirect('/auth?resendError=' + q('Please enter a valid email') + '&activeTab=resend&resendEmail=' + q(email));
        return;
    }

    const result = await resendVerificationService(parsed.data);

    // Always show the same success message regardless of outcome —
    // don't reveal whether the email exists or is already verified
    if (!result.success && result.reason === 'EMAIL_SEND_FAILURE') {
        // This is a real server error, not an email-enumeration risk
        res.redirect('/auth?resendError=' + q('Failed to send email. Please try again later') + '&activeTab=resend&resendEmail=' + q(email));
        return;
    }

    res.redirect('/auth?resendSuccess=' + q('If that email is registered and unverified, we\'ve sent a new link') + '&activeTab=resend');
}




/**
 * POST /auth/request-password-reset
 */
export async function handleRequestPasswordResetController(req: Request, res: Response): Promise<void> {
    const email = req.body.email ?? '';

    const parsed = requestPasswordResetSchema.safeParse({ email });

    if (!parsed.success) {
        res.redirect('/auth?resetReqError=' + q('Please enter a valid email') + '&activeTab=reset&resetReqEmail=' + q(email));
        return;
    }

    const result = await requestPasswordResetService(parsed.data);

    if (!result.success && result.reason === 'EMAIL_SEND_FAILURE') {
        res.redirect('/auth?resetReqError=' + q('Failed to send email. Please try again later') + '&activeTab=reset&resetReqEmail=' + q(email));
        return;
    }

    // Same message whether email exists or not — don't enumerate users
    res.redirect('/auth?resetReqSuccess=' + q('If that email is registered, a reset link has been sent') + '&activeTab=reset');
}




/**
 * POST /auth/reset-password
 */
export async function handleResetPasswordController(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string' || token.length !== 64) {
        res.redirect('/reset-password?error=' + q('Invalid or missing reset token'));
        return;
    }

    const parsed = resetPasswordSchema.safeParse({ token, password });

    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
        res.redirect('/reset-password?token=' + q(token) + '&error=' + q(msg));
        return;
    }

    const result = await resetPasswordService(parsed.data);

    if (!result.success) {
        const msg = result.reason === 'EXPIRED_TOKEN'
            ? 'This reset link has expired. Please request a new one.'
            : 'Invalid or already used reset link. Please request a new one.';
        res.redirect('/reset-password?token=' + q(token) + '&error=' + q(msg));
        return;
    }

    logger.info('Web password reset successful', { ...getCtx() });

    // Success — send to login with a success message, don't keep token in any URL
    res.redirect('/auth?loginError=&loginSuccess=' + q('Password reset successfully. Please log in.') + '&activeTab=login');
}




/**
 * POST /auth/change-password (protected via requireWebAuthMiddleware)
 */
export async function handleChangePasswordController(req: Request, res: Response): Promise<void> {
    const userID = req.session!.user!.id;

    const parsed = changePasswordSchema.safeParse({
        oldPassword: req.body.oldPassword,
        newPassword: req.body.newPassword,
    });

    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'Invalid input';
        res.redirect('/profile?changePassError=' + q(msg));
        return;
    }

    const result = await changePasswordService(userID, parsed.data.oldPassword, parsed.data.newPassword);

    if (!result.success) {
        const msg = result.reason === 'CURRENT_PASSWORD_INCORRECT'
            ? 'Current password is incorrect'
            : 'Failed to change password. Please try again';
        res.redirect('/profile?changePassError=' + q(msg));
        return;
    }

    logger.info('Web password changed successfully', { userId: userID, ...getCtx() });

    // Destroy all sessions after password change — other devices get logged out
    req.session.destroy(() => {});
    res.redirect('/auth?loginError=&loginSuccess=' + q('Password changed. Please log in again.') + '&activeTab=login');
}




/**
 * POST /auth/logout
 */
export async function handleLogoutController(req: Request, res: Response): Promise<void> {
    const userId = req.session?.user?.id;

    req.session.destroy((err) => {
        if (err) {
            logger.error('Session destroy failed on logout', { userId, error: err, ...getCtx() });
        } else {
            logger.info('Web user logged out', { userId, ...getCtx() });
        }
        res.clearCookie(env.SESSION_NAME);
        res.redirect('/auth?activeTab=login');
    });
}
