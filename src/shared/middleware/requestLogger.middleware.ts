import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

import { isProduction } from '@/config/env.config';

import { logger, morganStream } from '@/shared/utils/logger.util';
import { requestContext } from '@/shared/utils/requestContext.utils';




// GENERATE UNIQUE REQUEST ID
// Makes every log line traceable back to a single request.
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = uuidv4();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Everything that runs after next() in this request's async chain
    // can now call getCtx() and get { requestId, ip, userId }
    requestContext.run({ requestId, ip: req.ip ?? '', userId: null }, next);
}




// MORGAN HTTP REQUEST LOGGER
// Logs the raw HTTP line - method, url, status, duration, ip.
export const requestLoggerMiddleware = morgan(
    isProduction
        ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :res[x-request-id] - :response-time ms'
        : '[development] :method :url :status :response-time ms — ip::remote-addr — id::res[x-request-id]',
    {
        stream: morganStream,
        // Skip logging for specific routes (e.g., health checks)
        // skip: (req: Request) => {
        //     return req.path === '/health' || req.path === '...'
        // }
    }
)




// LOG IMPORTANT REQUEST DETAILS
export const detailedRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    logger.info('Incoming request', {
        requestId: res.locals.requestId,
        ip: req.ip,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? Object.keys(req.query) : undefined, // Log keys only, never values
        userAgent: req.get('user-agent'),
        userID: req.session?.user?.id ?? null,
    });


    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        logger.info('Request completed', {
            requestId: res.locals.requestId,
            ip: req.ip,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userID: req.session?.user?.id ?? null,
        });
    });


    next();
}