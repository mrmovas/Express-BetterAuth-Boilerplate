import { Request, Response, NextFunction } from 'express';

// Global Error Handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const status = (err as any).status ?? (err as any).statusCode ?? 500;

    res.status(status).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};