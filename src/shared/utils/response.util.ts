import { Response } from 'express';


//STANDARD API RESPONSE STRUCTURE
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId?: string;
    };
}




// SEND SUCCESS RESPONSE
export const sendSuccess = <T>(res: Response, data?: T, message?: string, statusCode: number = 200): Response => {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.locals.requestId,
        },
    };
    
    return res.status(statusCode).json(response);
};




// SEND ERROR RESPONSE
export const sendError = (res: Response, message: string, statusCode: number = 500, errorCode?: string, details?: any): Response => {
    const response: ApiResponse = {
        success: false,
        error: {
            code: errorCode || `ERROR_${statusCode}`,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: res.locals.requestId,
        },
    };
    
    return res.status(statusCode).json(response);
};





// SEND VALIDATION ERROR RESPONSE
export const sendValidationError = (res: Response, errors: any[]): Response => {
    return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', errors);
};




// SEND UNAUTHORIZED RESPONSE
export const sendUnauthorized = (res: Response, message: string = 'Authentication required'): Response => {
    return sendError(res, message, 401, 'UNAUTHORIZED');
};




// SEND FORBIDDEN RESPONSE
export const sendForbidden = (res: Response, message: string = 'Access denied'): Response => {
    return sendError(res, message, 403, 'FORBIDDEN');
};




// SEND NOT FOUND RESPONSE
export const sendNotFound = (res: Response, message: string = 'Resource not found'): Response => {
    return sendError(res, message, 404, 'NOT_FOUND');
};




// SEND CONFLICT RESPONSE
export const sendConflict = (res: Response, message: string = 'Resource already exists'): Response => {
    return sendError(res, message, 409, 'CONFLICT');
};




// SEND TOO MANY REQUESTS RESPONSE
export const sendTooManyRequests = (res: Response, message: string = 'Too many requests. Please try again later.'): Response => {
    return sendError(res, message, 429, 'TOO_MANY_REQUESTS');
};