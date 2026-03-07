// core/web/web.route.ts
import { Router } from 'express';

import {
    // PAGE RENDERS
    homeController,
    authPageController,
    profileController,
    verifyEmailPageController,
    resetPasswordPageController,

    // FORM HANDLERS
    handleLoginController,
    handleSignupController,
    handleLogoutController,
    handleResendVerificationController,
    handleRequestPasswordResetController,
    handleResetPasswordController,
    handleChangePasswordController,
} from './web.controller';

import { requireWebAuthMiddleware } from './web.middleware';
import { authRateLimiterMiddleware, emailVerificationRateLimiterMiddleware } from '@/shared/middleware/ratelimit.middleware';

const router = Router();




// ============================================================
// PAGE RENDERS (GET)
// ============================================================

router.get('/',            homeController);
router.get('/auth',        authPageController);
router.get('/profile',     requireWebAuthMiddleware, profileController);

// Email verification — user arrives here from the link in their email
// GET /verify-email?token=...
router.get('/verify-email', verifyEmailPageController);

// Password reset — user arrives here from the link in their email
// GET /reset-password?token=...
router.get('/reset-password', resetPasswordPageController);




// ============================================================
// FORM HANDLERS (POST)
// All end with res.redirect() — never res.json()
// ============================================================

router.post('/auth/login',
    authRateLimiterMiddleware,
    handleLoginController
);

router.post('/auth/signup',
    authRateLimiterMiddleware,
    handleSignupController
);

router.post('/auth/resend-verification',
    emailVerificationRateLimiterMiddleware,
    handleResendVerificationController
);

router.post('/auth/request-password-reset',
    authRateLimiterMiddleware,
    handleRequestPasswordResetController
);

router.post('/auth/reset-password',
    authRateLimiterMiddleware,
    handleResetPasswordController
);

router.post('/auth/change-password',
    requireWebAuthMiddleware,
    authRateLimiterMiddleware,
    handleChangePasswordController
);

router.post('/logout',
    requireWebAuthMiddleware,
    handleLogoutController
);




export default router;
