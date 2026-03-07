import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { Pool } from 'pg';

import { env, isProduction } from '@/config/env.config';
import { SessionUser} from '@/shared/types';
 
const PGSession = connectPg(session);




/**
 * PostgreSQL connection pool for session storage
 * Separate from main pool to avoid session-related connection issues
 */
const sessionPool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 5, // Sessions don't need many connections
});




/**
 * Session middleware configuration
 * 
 * Security features:
 * - Secure cookies in production (HTTPS only)
 * - HttpOnly cookies (prevents XSS)
 * - SameSite strict (prevents CSRF)
 * - Database-backed sessions
 * - Session regeneration on auth state changes
 */
export const sessionMiddleware = session({

    // Use PostgreSQL for session storage
    store: new PGSession({
        pool: sessionPool,
        tableName: 'sessions',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60, // Cleanup every 1 hour
    }),

    name: env.SESSION_NAME, // Custom cookie name for security through obscurity
    secret: env.SESSION_SECRET, // Strong secret for signing session ID cookies

    saveUninitialized: false, // Don't save empty sessions

    resave: false, // Resave session only if modified

    cookie: {
        maxAge: env.SESSION_MAX_AGE,
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: isProduction, // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        path: '/', // Cookie valid for entire site
    },

    rolling: false, // Don't reset maxAge on every response
})




/**
 * Extend Express Session type
 */
declare module 'express-session' {
    interface SessionData {
        user?: SessionUser;
    }
}