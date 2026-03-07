import { Request, Response, NextFunction } from 'express';
import { sendUnauthorized, sendForbidden } from '../../shared/utils/response.util';

import { UserRole } from '@/shared/types';




/**
 * Require authentication
 * Checks if user is logged in
 */
export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.session || !req.session.user) {
        return sendUnauthorized(res, 'Authentication required');
    }

    next();
}




/**
 * Require specific role(s)
 * Checks if user has one of the required roles
 */
export function requireRoleMiddleware(allowedRoles: UserRole | UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.session?.user;
        if(!user) return sendUnauthorized(res);
    
        const permittedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if(!permittedRoles.includes(user.role)) return sendForbidden(res, 'Insufficient permissions');

        next();
    }   
}




/**
 * Require administrator role
 */
export const requireAdminMiddleware = requireRoleMiddleware('ADMINISTRATOR');




/**
 * Require email verification
 * Checks if user's email is verified
 */
export function requireEmailVerifiedMiddleware(req: Request, res: Response, next: NextFunction) {
    const user = req.session?.user;
    if(!user) return sendUnauthorized(res);
    
    if(!user.emailVerified) return sendForbidden(res, 'Email verification required');

    next();
}