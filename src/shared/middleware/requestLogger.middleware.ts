import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';

import { isProduction } from '../../config/env.config';

import { logger, morganStream } from '../utils/logger.util';




// GENERATE UNIQUE REQUEST ID
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = uuidv4();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}




// MORGAN HTTP REQUEST LOGGER
export const requestLoggerMiddleware = morgan(
    isProduction
        ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
        : '[development] :method :url :status :response-time ms - :res[content-length] :req[body]',
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
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.session.user?.id,
    });


    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        logger.info('Request completed', {
            requestId: res.locals.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.session.user?.id,
        });
    });


    next();
}