// src/middleware/session.js
import { auth } from '@/utils/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request, Response, NextFunction } from 'express';



export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    res.locals.user = session?.user ?? null;
    res.locals.session = session?.session ?? null;
    next();
}