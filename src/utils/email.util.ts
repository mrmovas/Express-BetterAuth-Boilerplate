import { getEmailTransporter } from '@/config/email.config';

import { env } from '@/config/env.config';

import { logger } from '@/utils/logger.util';
import { getCtx } from '@/utils/requestContext.utils';



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
export async function sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
    const text = `
Welcome! Please Verify Your Email

Thank you for signing up. To complete your registration, please verify your email address by visiting:

${verificationUrl}

This link will expire in ${env.VERIFICATION_TOKEN_EXPIRY_HOURS} hours.

If you didn't create an account, you can safely ignore this email.`

    return sendEmail(email, { subject: 'Verify Your Email', text });
};





// SEND PASSWORD RESET EMAIL
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    const text = `
Password Reset Request

We received a request to reset your password. Visit the following link to create a new password:

${resetUrl}

⚠️ SECURITY NOTICE:
This link will expire in ${env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS} hour(s) for your security.

If you didn't request a password reset, please ignore this email or contact support if you have concerns.

For security reasons, never share this link with anyone.`;

    return sendEmail(email, { subject: 'Password Reset Request', text });
}