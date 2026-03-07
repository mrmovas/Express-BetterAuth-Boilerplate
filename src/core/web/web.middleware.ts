import { Request, Response, NextFunction } from 'express';




/**
 * Require authentication for web (SSR) routes.
 * Redirects to /auth instead of returning a 401 JSON response.
 */
export function requireWebAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.user) {
        res.redirect('/auth?error=' + encodeURIComponent('You must be logged in to access that page'));
        return;
    }
    next();
}




/**
 * Require email verification for web (SSR) routes.
 */
export function requireWebEmailVerifiedMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.user) {
        res.redirect('/auth?error=' + encodeURIComponent('You must be logged in'));
        return;
    }

    if (!req.session.user.emailVerified) {
        res.redirect('/profile?error=' + encodeURIComponent('Please verify your email first'));
        return;
    }

    next();
}
