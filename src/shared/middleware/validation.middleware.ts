import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { sendValidationError } from '@/shared/utils/response.util';
import { logger, reqCtx } from '@/shared/utils/logger.util';




// Define regex patterns for suspicious input
const SUSPICIOUS_PATTERNS = {
    SQL_INJECTION: /('|--|#|\/\*|;)\s*(OR|AND|SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|DECLARE)/i,
    XSS: /<(script|iframe|embed|object|frameset)|on\w+\s*=|javascript:|alert\(/i,
    PATH_TRAVERSAL: /(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e)/i,
};

type ThreatType = keyof typeof SUSPICIOUS_PATTERNS;

type SuspiciousInputResult = 
    | { isSuspicious: false; threatType: null; }
    | { isSuspicious: true; threatType: ThreatType;}




function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Helper function to recursively extract all string values from an object or array
function getAllValues(input: unknown): string[] {
    let values: string[] = [];

    if(Array.isArray(input)) {
        for(const item of input) {
            values = values.concat(getAllValues(item));
        }
    }

    else if(isObject(input)) {
        for(const value of Object.values(input)) {
            values = values.concat(getAllValues(value));
        }
    }

    else if(typeof input === 'string') {
        values.push(input);
    }

    return values;
}



// Analyze input for suspicious patterns
function analyzeSuspiciousInput(input: Record<string, unknown>): SuspiciousInputResult {
    const allValues = getAllValues(input);

    for(const [threatType, pattern] of Object.entries(SUSPICIOUS_PATTERNS)) {
        for(const value of allValues) {
            if(pattern.test(value)) return { isSuspicious: true, threatType: threatType as ThreatType };
        }
    }

    return { isSuspicious: false, threatType: null };
}





// VALIDATE REQUEST BODY, QUERY, OR PARAMS AGAINST ZOD SCHEMA
export const validateMiddleware = <T>(schema: ZodType<T>, location: 'body' | 'query' | 'params') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const rawInput = req[location] as Record<string, unknown>;


        // Analyze the raw input for suspicious patterns before validation
        const analysis = analyzeSuspiciousInput(rawInput);
        if(analysis.isSuspicious) {
            logger.warn('Suspicious input detected', {
                ...reqCtx(req),
                location,
                threatType: analysis.threatType,
                inputKeys: Object.keys(rawInput), // Which fields were attempted to be validated
            });
        }


        // Attempt to parse and validate the input against the Zod schema
        try {
            const parsedData = schema.parse(rawInput);

            if(location === 'body') req.body = parsedData;
            
            else {
                // For query and params, we iterate and assign keys 
                // because the top-level objects are read-only getters.
                Object.assign(rawInput, parsedData);
            }

            next();
        }


        // If validation fails, log the error and send a formatted response
        catch (error) {
            if(error instanceof ZodError) {
                const validationErrors = error.issues.map(issue => ({
                    field: issue.path.join('.') || (issue as any).keys?.[0] || 'unexpected_input',
                    message: issue.message,
                }));
                
                logger.warn('Request validation failed', {
                    ...reqCtx(req),
                    location,
                    isSuspicious: analysis.isSuspicious,
                    threatType: analysis.threatType,
                    inputKeys: Object.keys(rawInput), // Which fields were attempted to be validated
                    validationErrors: validationErrors, // Include validation error details in the log
                });

                sendValidationError(res, validationErrors);
                return;
            }

            next(error);
        }
    }
}