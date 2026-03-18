import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { logger } from '@/utils/logger.util';
import { getCtx } from '@/utils/requestContext.util';

import { env } from '@/config/env.config';

// Threshold in ms above which a query is considered slow and logged at warn
const SLOW_QUERY_THRESHOLD_MS = 500;




// PRISMA CLIENT (singleton)
// In development, hot-reload can create multiple instances — this pattern prevents that.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ 
    adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn'  },
    ]
});

export { prisma };




// QUERY LOGGING
// Replaces Kysely's log() callback — same behaviour, different API
prisma.$on('query', (e) => {
    const ctx = getCtx();
    if(e.duration > SLOW_QUERY_THRESHOLD_MS) {
        logger.warn('Slow database query', {
            sql:       e.query,
            duration:  `${e.duration}ms`,
            threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
            ...ctx
        });
    } else {
        logger.debug('Database query', {
            sql:      e.query,
            duration: `${e.duration}ms`,
            ...ctx
        });
    }
});

prisma.$on('error', (e) => {
    logger.error('Prisma client error', { message: e.message, ...getCtx() });
});




// TEST CONNECTION
export const testConnection = async (): Promise<boolean> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.info('Database connection established');
        return true;
    } catch (error) {
        logger.error('Database connection failed', { error });
        return false;
    }
};




// GRACEFUL SHUTDOWN
export const closeDatabase = async (): Promise<void> => {
    try {
        await prisma.$disconnect();
        logger.info('Database connections closed');
    } catch (error) {
        logger.error('Error closing database connections', { error });
    }
};