import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import { db } from '@/config/database.config';
import { Database } from "@/types/database.types";
import { logger } from '@/utils/logger.util';
import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/utils/auth";




// This function runs the BetterAuth CLI to check/create betterAuth's tables.
async function runBetterAuthMigrations() {
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



// This function checks if our own tables exist and creates them if they don't.
async function checkAndCreateTables(db: Kysely<Database>): Promise<void> {
    try {
        logger.info("Checking/creating tables...");

        // Example: Check if "user" table exists, and create it if not
        // I am not actually creating any tables here since BetterAuth already creates the "user" table, but this is where you would add your own table checks/creations if needed.
        // This is not recommended for updates to the schema, it's only for initial setup. 
        // For schema updates, you should create proper migration scripts. And do not forget to have a backup haha.
        // And after you have made updates to the database schema, you should also update the Database interface in src/types/database.types.ts to reflect the new tables/columns, which will give you type safety when using the Kysely client throughout your codebase.
        // And finally here you can update the following queries to check for the existence of the new tables/columns with the correct types and create them if they don't exist.
        // It also helps when you are just setting up the app and have a fresh database and want to quickly set up the necessary tables without running separate migration scripts.
        
        // An example of how you would type an sql query
        await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user'
            ) AS "exists"
        `.execute(db);

        logger.info("Tables checked/created successfully.");
    } catch (error) {
        logger.error("Error checking/creating tables:", error);
        throw error;
    }
}



export default async function setupDatabase() {
  // 1. Run BetterAuth CLI first
  await runBetterAuthMigrations();

  // 2. Now check/create your own tables
  await checkAndCreateTables(db);
}