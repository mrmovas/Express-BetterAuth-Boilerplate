import { Request, Response, NextFunction } from 'express';

// 404 Not Found Handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
};