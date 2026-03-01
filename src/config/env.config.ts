import { z } from 'zod';
import { config } from 'dotenv';
config();



// DEFINING ENVIRONMENT VARIABLES SCHEMA
const envSchema = z.object({
    // SERVER
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('3000'),

    // DATABASE
    DB_HOST: z.string().nonempty('[ENV] Database host is required'),
    DB_PORT: z.string().nonempty('[ENV] Database port is required').transform(Number).pipe(z.number().min(1).max(65535)),
    DB_USER: z.string().nonempty('[ENV] Database user is required'),
    DB_PASSWORD: z.string().nonempty('[ENV] Database password is required'),
    DB_NAME: z.string().nonempty('[ENV] Database name is required'),
    DB_POOL_MIN: z.string().transform(Number).pipe(z.number().min(0)).default(2),
    DB_POOL_MAX: z.string().transform(Number).pipe(z.number().min(1)).default(10),

    // SESSION
    SESSION_SECRET: z.string().min(32, '[ENV] Session secret must be at least 32 characters'),
    SESSION_NAME: z.string().default('sid'),
    SESSION_MAX_AGE: z.string().transform(Number).pipe(z.number().positive()).default(86400000), // 1 day

    // SECURITY
    BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default(12),
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default(900000), // 15 min
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default(100),

    // EMAIL
    EMAIL_HOST: z.string(),
    EMAIL_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
    EMAIL_USER: z.email(),
    EMAIL_PASS: z.string(),
    EMAIL_FROM: z.email(),
    EMAIL_SECURE: z.string().transform(val => val === 'true').default(false),

    // APPLICATION
    APP_URL: z.url().default('http://localhost:3000'),
    FRONTEND_URL: z.url().default('http://localhost:3000'),

    // TOKENS
    VERIFICATION_TOKEN_EXPIRY_HOURS: z.string().transform(Number).pipe(z.number().positive()).default(24),
    PASSWORD_RESET_TOKEN_EXPIRY_HOURS: z.string().transform(Number).pipe(z.number().positive()).default(1),
  
    // LOGGING
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
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