import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { logger } from '@/utils/logger.util';
import { getCtx } from '@/utils/requestContext.util';
import { env } from '@/config/env.config';
import type { Database } from '@/types/database.types';

// Threshold in ms above which a query is considered slow and logged at warn
const SLOW_QUERY_THRESHOLD_MS = 500;




// PG POOL (shared between Kysely and Better-Auth)
export const pool = new Pool({ connectionString: env.DATABASE_URL });




// KYSELY CLIENT (singleton)
// In development, hot-reload can create multiple instances — this pattern prevents that.
export const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event) {
        const ctx = getCtx();
        if (event.level === 'query') {
            const duration = event.queryDurationMillis;
            if (duration > SLOW_QUERY_THRESHOLD_MS) {
                logger.warn('Slow database query', {
                    sql:       event.query.sql,
                    duration:  `${duration}ms`,
                    threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
                    ...ctx,
                });
            } else {
                logger.debug('Database query', {
                    sql:      event.query.sql,
                    duration: `${duration}ms`,
                    ...ctx,
                });
            }
        } else if (event.level === 'error') {
            logger.error('Database query error', { error: event.error, ...getCtx() });
        }
    },
});




// TEST CONNECTION
export const testConnection = async (): Promise<boolean> => {
    try {
        await sql`SELECT 1`.execute(db);
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
        await db.destroy();
        logger.info('Database connections closed');
    } catch (error) {
        logger.error('Error closing database connections', { error });
    }
};