import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

import { Users, Tokens } from '../shared/types/database.types';
import { logger } from '../shared/utils/logger.util';
import env from './env.config';




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
interface Database {
    users: Users;
    tokens: Tokens;
}


export const database = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event) {
        if(event.level === 'query') {
            logger.debug('Database query', {
                sql: event.query.sql,
                duration: event.queryDurationMillis,
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
        await pool.end();
        logger.info('Database connections closed');
    } catch (error) {
        logger.error('Error closing database connections', { error });
    }
};