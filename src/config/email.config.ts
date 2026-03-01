import nodemailer, { Transporter } from 'nodemailer';

import { logger } from '../shared/utils/logger.util';
import env from './env.config';



let transporter: Transporter | null = null;




// INITIALIZE EMAIL TRANSPORTER
export const initializeEmailTransporter = (): Transporter => {
    if(transporter) return transporter;


    // Create a transporter using SMTP transport
    transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE, // true for 465, false for other ports
        auth: {
            user: env.EMAIL_USER,
            pass: env.EMAIL_PASS,
        },
        pool: true, // Enable connection pooling
        maxConnections: 5, // Maximum number of connections in the pool
        maxMessages: 100, // Maximum number of messages per connection
    });


    // Verify the connection configuration
    transporter.verify((error) => {
        if(error) logger.error('Error configuring email transporter:', error);
        else logger.info('Email transporter is configured and ready to send messages');
    });


    return transporter;
}




// GET EMAIL TRANSPORTER
export const getEmailTransporter = (): Transporter => {
    if(!transporter) return initializeEmailTransporter();
    return transporter;
}