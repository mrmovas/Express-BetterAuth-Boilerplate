import { getEmailTransporter } from '../../config/email.config';

import { env } from '../../config/env.config';

import { logger } from './logger.util';



// EMAIL TEMPLATE TYPE
export type EmailTemplate = {
    subject: string;
    html?: string;
    text?: string;
};




// SEND EMAIL
export const sendEmail = async (to: string, template: EmailTemplate) => {
    try {
        const transporter = getEmailTransporter();

        await transporter.sendMail({
            from: env.EMAIL_FROM,
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        logger.info('Email sent successfully', { to, subject: template.subject });
        return true;
    } catch (error) {
        logger.error('Failed to send email', { to, error });
        return false;
    }
}