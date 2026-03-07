import { Router } from 'express';
const router = Router();

// CONTROLLER
import { 
    signupController, 
    verifyEmailController, 
    loginController, 
    resendVerificationController, 
    requestPasswordResetController, 
    resetPasswordController,

    // Authenticated controllers
    logoutController,
    getCurrentUserController,
    changePasswordController
} from '@/core/auth/auth.controller';

// MIDDLEWARE
import { authRateLimiterMiddleware, emailVerificationRateLimiterMiddleware } from '@/shared/middleware/ratelimit.middleware';
import { validateMiddleware } from '@/shared/middleware/validation.middleware';
import { requireAuthMiddleware } from '@/core/auth/auth.middleware';

// SCHEMA
import { 
    signupSchema, 
    verifyEmailSchema, 
    loginSchema, 
    resendVerificationSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from '@/core/auth/auth.validation';





// POST /api/auth/signup - Register a new user
router.post('/signup',
    // MIDDLEWARES
    authRateLimiterMiddleware,
    validateMiddleware(signupSchema, 'body'),
    
    // CONTROLLER
    signupController
);




// GET /api/auth/verify-email - Verify email with token
router.get('/verify-email',
  // MIDDLEWARES
  validateMiddleware(verifyEmailSchema, 'query'),
  
  // CONTROLLER
  verifyEmailController
);




// POST /api/auth/login - Authenticate user and return token
router.post('/login',
    // MIDDLEWARES
    authRateLimiterMiddleware,
    validateMiddleware(loginSchema, 'body'),

    // CONTROLLER
    loginController
);




// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification',
    // MIDDLEWARES
    emailVerificationRateLimiterMiddleware,
    validateMiddleware(resendVerificationSchema, 'body'),

    // CONTROLLER
    resendVerificationController
);




// POST /api/auth/request-password-reset - Request password reset email
router.post('/request-password-reset',
    // MIDDLEWARES
    authRateLimiterMiddleware,
    validateMiddleware(requestPasswordResetSchema, 'body'),

    // CONTROLLER
    requestPasswordResetController
);




// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password',
    // MIDDLEWARES
    authRateLimiterMiddleware,
    validateMiddleware(resetPasswordSchema, 'body'),

    // CONTROLLER
    resetPasswordController
);







/**
 * Protected routes (authentication required)
 */


/**
 * POST /api/auth/logout
 * Destroy user session
*/
router.post('/logout',
    // MIDDLEWARES
    requireAuthMiddleware,

    // CONTROLLER
    logoutController
);




// GET /api/auth/me - Get current authenticated user info
router.get('/me',
    // MIDDLEWARES
    requireAuthMiddleware,

    // CONTROLLER
    getCurrentUserController
);




// CHANGE PASSWORD
router.post('/change-password',
    // MIDDLEWARES
    authRateLimiterMiddleware,
    requireAuthMiddleware,
    validateMiddleware(changePasswordSchema, 'body'),

    // CONTROLLER
    changePasswordController
);




export default router;