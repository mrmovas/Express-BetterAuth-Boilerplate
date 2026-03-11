import { z } from 'zod';
import { config } from 'dotenv';
config();



// DEFINING ENVIRONMENT VARIABLES SCHEMA
const envSchema = z.object({
    // SERVER
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),

    // LOGGING
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // DATABASE
    DATABASE_URL: z.string().nonempty('[ENV] Database URL is required'),

    // SESSION
    SESSION_SECRET: z.string().min(32, '[ENV] Session secret must be at least 32 characters'),
    SESSION_NAME: z.string().default('sid'),
    SESSION_MAX_AGE: z.string().default((1000 * 60 * 60 * 24).toString()).transform(Number).pipe(z.number().positive()), // 1 day in ms
    BETTER_AUTH_SECRET: z.string().min(32, '[ENV] BetterAuth secret must be at least 32 characters'),
    BETTER_AUTH_BASE_URL: z.url().default('http://localhost:3000'),
    BETTER_AUTH_LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // SECURITY
    BCRYPT_ROUNDS: z.string().default('12').transform(Number).pipe(z.number().min(10).max(15)),
    RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number).pipe(z.number().positive()), // 15 min
    RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().positive()),

    // EMAIL
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
    EMAIL_USER: z.email(),
    EMAIL_PASS: z.string(),
    EMAIL_FROM: z.email(),
    EMAIL_SECURE: z.string().default('false').transform(val => val === 'true'),

    // APPLICATION
    APP_URL: z.url().default('http://localhost:3000'),
    FRONTEND_URL: z.url().default('http://localhost:3000'),

    // TOKENS
    VERIFICATION_TOKEN_EXPIRY_HOURS: z.string().default('24').transform(Number).pipe(z.number().positive()),
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS: z.string().default('1').transform(Number).pipe(z.number().positive()),
});


// CHECKING IF ENVIRONMENT IS PRODUCTION
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';




// VALIDATING ENVIRONMENT VARIABLES
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}




// EXPORTING ENVIRONMENT VARIABLES
export const env = parsedEnv.data;