import http from 'http';
import app from './app';

import { env } from '@/config/env.config';
import { testConnection, closeDatabase } from '@/config/database.config';
import { initializeEmailTransporter } from '@/config/email.config';
import { logger } from '@/utils/logger.util';
import setupDatabase from './bootstrap/database-setup';




// CREATE HTTP SERVER
const server = http.createServer(app);




// START SERVER
async function startServer(): Promise<void> {

    // TEST DATABASE CONNECTION
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    
    if(!dbConnected) {
        logger.error('Failed to connect to database');
        process.exit(1);
    }

    // SETUP DATABASE (table checks, etc.)
    logger.info('Setting up database...');
    await setupDatabase();

    // INITIALIZE EMAIL TRANSPORTER
    logger.info('Initializing email transporter...');
    initializeEmailTransporter();


    // START HTTP SERVER
    server.listen(env.PORT, () => {
        logger.info(`Server started successfully`, {
            port: env.PORT,
            environment: env.NODE_ENV,
            url: `http://localhost:${env.PORT}`,
        });
    });
}




// GRACEFUL SHUTDOWN
async function shutdown(signal: "SIGINT" | "SIGTERM" ): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // CLOSE DATABASE CONNECTION
    await closeDatabase();

    // CLOSE HTTP SERVER
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // IF SERVER DOESN'T CLOSE IN TIME, FORCE EXIT
    setTimeout(() => {
        logger.warn('Forcing shutdown due to timeout');
        process.exit(1);
    }, 10000); // 10 seconds
}




// ERROR HANDLING
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    const errorDetails = {
        message: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : new Error().stack,
    };
    logger.error('Unhandled Rejection', { errorDetails });
    process.exit(1);
});




// HANDLE PROCESS SIGNALS FOR GRACEFUL SHUTDOWN
process.on('SIGINT', () => shutdown("SIGINT"));
process.on('SIGTERM', () => shutdown("SIGTERM"));




// START THE SERVER
startServer();