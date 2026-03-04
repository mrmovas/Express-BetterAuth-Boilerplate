import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

import { UsersTable, TokensTable } from '@/shared/types/database.types';
import { logger } from '@/shared/utils/logger.util';
import { getCtx } from '@/shared/utils/requestContext.utils';

import { env } from '@/config/env.config';




// CREATE PROSTGRESQL CONNECTION POOL
const pool = new Pool({
    // Connection Details
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,

    // Pool Management
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});


// HANDLE POOL ERRORS
pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err });
});




// CREATE KYSLEY INSTANCE
export interface Database {
    users: UsersTable;
    tokens: TokensTable;
}


// Threshold in ms above which a query is considered slow and logged at warn
const SLOW_QUERY_THRESHOLD_MS = 500;

export const database = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event) {
        const ctx = getCtx();
        if(event.level === 'query') {
            const duration = event.queryDurationMillis;

            // Log slow queries at warn level
            if(duration > SLOW_QUERY_THRESHOLD_MS) logger.warn('Slow database query', {
                ...ctx,
                sql: event.query.sql,
                duration: `${duration}ms`,
                threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
            });

            // Log all queries at debug level
            else logger.debug('Database query', {
                ...ctx,
                sql: event.query.sql,
                duration: event.queryDurationMillis,
            });
        }

        else if(event.level === 'error') {
            logger.error('Database error', {
                ...ctx,
                sql: event.query.sql,
                error: event.error,
            });
        }                
    },
})




// TEST CONNECTION
export const testConnection = async (): Promise<boolean> => {
    try {
        await sql`SELECT 1`.execute(database);
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
        await database.destroy();
        logger.info('Database connections closed');
    } catch (error) {
        logger.error('Error closing database connections', { error });
    }
};