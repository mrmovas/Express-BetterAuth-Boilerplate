import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request } from 'express';

import { env } from '@/config/env.config';




// CUSTOM LOG FORMAT
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);




// CONSOLE FORMAT FOR DEVELOPMENT
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if(Object.keys(meta).length > 0) msg += `\t${JSON.stringify(meta)}`;
        return msg;
    })
);




// WINSTON LOGGER INSTANCE
export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: customFormat,
    defaultMeta: { service: 'auth-API' },
    transports: [
        // CONSOLE OUTPUT
        new winston.transports.Console({ format: env.NODE_ENV === 'production' ? customFormat : consoleFormat }),

        // DAILY ROTATE FILES
        // This creates files like: logs/2026-02-14.log
        new DailyRotateFile({
            filename: 'logs/%DATE%.log',
            datePattern: 'YYYY-MM-DD', 
            zippedArchive: true,      // Compresses old files
            maxSize: '20m',           // Split file if it hits 20MB in one day
            maxFiles: '30d',          // Automatically delete files older than 30 days
            level: 'info'             // Includes info, warn, error, and http
        }),

        // SEPARATE FILE FOR WARNINGS AND ERRORS
        new DailyRotateFile({
            filename: 'logs/security/%DATE%-security.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '10m',
            maxFiles: '90d',   // Keep security logs longer
            level: 'warn',
        }),
    ]
});




/**
 * Extract a consistent request context object from an Express request.
 * Attach this to every log that is triggered within a request lifecycle
 * so you can trace exactly who did what, from where, and when.
 */
export function reqCtx(req: Request) {
    return {
        requestId: req.res?.locals?.requestId,          // Set by requestIdMiddleware
        ip: req.ip ?? req.socket?.remoteAddress,        // Client IP
        method: req.method,
        path: req.path,
        userAgent: req.get('user-agent'),
        userId: req.session?.user?.id ?? null,          // Null if unauthenticated
    };
}




// STREAM FOR MORGAN HTTP LOGGER
const TOKEN_REDACT_REGEX = /(token=)[^&\s]+/g;

export const morganStream = {
    write: (message: string) => {
        logger.http(message.replace(TOKEN_REDACT_REGEX, '$1[REDACTED]').trim());
    }
};