import { Router } from 'express';
const router = Router();

// CONTROLLER
import { signupController, verifyEmailController } from './auth.controller';

// MIDDLEWARE
import { authRateLimiterMiddleware } from '../../shared/middleware/ratelimit.middleware';
import { validateMiddleware } from '../../shared/middleware/validation.middleware';

// SCHEMA
import { signupSchema, verifyEmailSchema } from './auth.validation';





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








export default router;