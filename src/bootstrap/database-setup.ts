import { logger } from '@/utils/logger.util';
import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/utils/auth";




/**
 * This function checks the BetterAuth schema and runs any necessary migrations to ensure that the database is properly set up for BetterAuth.
 * It uses the `getMigrations` function from the BetterAuth library to determine which tables need to be created or updated, and then executes those migrations.
 * This should be called during application startup to ensure that the database schema is always up to date with the version of BetterAuth being used.
 */
export async function runBetterAuthMigrations() {
    try {
        logger.info("Running BetterAuth migrations...");

        const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);

        if (toBeCreated.length === 0 && toBeAdded.length === 0) {
            logger.info("BetterAuth schema is already up to date.");
            return;
        }

        logger.info(`Tables to create: ${toBeCreated.map(t => t.table).join(", ")}`);
        logger.info(`Columns to add: ${toBeAdded.map(t => t.table).join(", ")}`);
        
        await runMigrations();
        logger.info("BetterAuth migrations completed.");
    } catch (error) {
        logger.error("BetterAuth migration failed:", error);
        throw error;
    }
}