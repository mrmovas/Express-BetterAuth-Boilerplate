import { getEmailTransporter } from '@/config/email.config';

import { env } from '@/config/env.config';

import { logger } from '@/shared/utils/logger.util';
import { getCtx } from '@/shared/utils/requestContext.utils';



// EMAIL TEMPLATE TYPE
export type EmailTemplate = {
    subject: string;
    html?: string;
    text?: string;
};




// SEND EMAIL
export async function sendEmail(to: string, template: EmailTemplate) {
    try {
        const transporter = getEmailTransporter();

        await transporter.sendMail({
            from: env.EMAIL_FROM,
            to,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        logger.info('Email sent', { subject: template.subject, ...getCtx() });
        return true;
    } catch (error) {
        logger.error('Failed to send email', { subject: template.subject, error, ...getCtx() });
        return false;
    }
}






// SEND VERIFICATION EMAIL
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${env.APP_URL}/api/auth/verify-email?token=${token}`;
    const text = `
Welcome! Please Verify Your Email

Thank you for signing up. To complete your registration, please verify your email address by visiting:

${verificationUrl}

This link will expire in ${env.VERIFICATION_TOKEN_EXPIRY_HOURS} hours.

If you didn't create an account, you can safely ignore this email.`

    return sendEmail(email, { subject: 'Verify Your Email', text });
};