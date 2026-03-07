import { prisma } from "@/config/database.config";

import { hashPassword, comparePassword } from "@/shared/utils/crypto.util";
import { sendVerificationEmail, sendPasswordResetEmail /*sendWelcomeEmail*/ } from "@/shared/utils/email.util";
import { createTokenService, verifyTokenService } from "../token/token.service";
import { logger } from "@/shared/utils/logger.util";
import { getCtx } from "@/shared/utils/requestContext.utils";

import { 
    SignupInput, 
    LoginInput, 
    ResendVerificationInput, 
    RequestPasswordResetInput,
    ResetPasswordInput
} from "@/core/auth/auth.validation";
import { SessionUser } from "@/shared/types";




// SIGNUP A NEW USER
type SignupResult =
    | { success: true;  userID: string; email: string }
    | { success: false; error: 'EMAIL_ALREADY_EXISTS'; email: string; message: string }
    | { success: false; error: 'DATABASE_ERROR'; message: string };

export async function signupService(input: SignupInput): Promise<SignupResult> {
    return prisma.$transaction(async (trx) => {
        const existingUser = await trx.user.findFirst({
            where:  { email: input.email },
            select: { id: true },
        });

        // If a user with the same email already exists, reject the registration
        if(existingUser) return { success: false, error: 'EMAIL_ALREADY_EXISTS', email: input.email, message: 'Email is already registered' };
        
        // Create new user
        const user = await trx.user.create({
            data: {
                email:          input.email,
                firstName:      input.firstName,
                lastName:       input.lastName,
                passwordHashed: await hashPassword(input.password),
                phone:          input.phone,   // Json field — Prisma accepts the object directly
            },
            select: { id: true, email: true },
        });

        // Create verification token and send email
        const { token } = await createTokenService(user.id, 'EMAIL_VERIFICATION', trx);

        // Send verification email
        const emailSent = await sendVerificationEmail(user.email, token);
        if(!emailSent) {
            logger.warn('Verification email failed to send after signup', {
                userId: user.id,
                ...getCtx()
            });
        }

        return { success: true, userID: user.id, email: user.email };
    });
}





// VERIFY EMAIL
type VerifyEmailResult =
    | { success: true;  userId: string }
    | { success: false; reason: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'TOKEN_REUSE' };

export async function verifyEmailService(token: string): Promise<VerifyEmailResult> {
    return prisma.$transaction(async (trx) => {
        const result = await verifyTokenService(token, 'EMAIL_VERIFICATION', trx);

        if(!result.success) {
            logger.warn('Email verification failed', {
                reason: result.reason,
                ...getCtx(),
            });
            return { success: false, reason: result.reason };
        }

        // Update user's email verification status in the database
        await trx.user.update({
            where: { id: result.userID },
            data:  { emailVerified: true },
        });
    
        logger.info('Email verified successfully', { ...getCtx() });

        return { success: true, userId: result.userID };
    });
}




// LOGIN USER
type LoginResult =
    | { success: true; user: SessionUser }
    | { success: false; reason: 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' };

export async function loginService(input: LoginInput): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { 
            id: true, 
            email: true,
            firstName: true,
            lastName: true,
            role: true,

            passwordHashed: true, 
            emailVerified: true             
        },
    });

    if(!user) {
        logger.warn('Login attempted with non-existent email', {
            ...getCtx(),
        });
        return { success: false, reason: 'INVALID_CREDENTIALS' };
    }

    const passwordMatch = await comparePassword(input.password, user.passwordHashed);
    if(!passwordMatch) {
        logger.warn('Login attempted with incorrect password', {
            ...getCtx(),
        });
        return { success: false, reason: 'INVALID_CREDENTIALS' };
    }

    if(!user.emailVerified) {
        logger.warn('Login attempted with unverified email', {
            ...getCtx(),
        });
        return { success: false, reason: 'EMAIL_NOT_VERIFIED' };
    }

    return { success: true, user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as SessionUser['role'],
    } };
}




// RESEND VERIFICATION EMAIL
type ResendVerificationResult =
    | { success: true }
    | { success: false; reason: 'EMAIL_NOT_FOUND' | 'ALREADY_VERIFIED' | 'EMAIL_SEND_FAILURE' };

export async function resendVerificationService(input: ResendVerificationInput): Promise<ResendVerificationResult> {
    return prisma.$transaction(async (trx) => {
        const user = await trx.user.findUnique({
            where: { email: input.email },
            select: { id: true, email: true, emailVerified: true },
        });

        if(!user) {
            logger.warn('Resend verification attempted for non-existent email', {
                email: input.email,
                ...getCtx(),
            });    
            return { success: false, reason: 'EMAIL_NOT_FOUND' };
        }

        if(user.emailVerified) {
            logger.warn('Resend verification attempted for already verified email', { ...getCtx() });
            return { success: false, reason: 'ALREADY_VERIFIED' };
        }

        const { token } = await createTokenService(user.id, 'EMAIL_VERIFICATION', trx);

        const emailSent = await sendVerificationEmail(user.email, token);
        if(!emailSent) {
            logger.warn('Failed to send verification email', { ...getCtx() });
            return { success: false, reason: 'EMAIL_SEND_FAILURE' };
        }
    
        return { success: true };
    });
}




// REQUEST PASSWORD RESET
type RequestPasswordResetResult =
    | { success: true }
    | { success: false; reason: 'EMAIL_NOT_FOUND' | 'EMAIL_SEND_FAILURE' };

export async function requestPasswordResetService(input: RequestPasswordResetInput): Promise<RequestPasswordResetResult> {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, email: true },
    });

    if(!user) {
        logger.warn('Password reset requested for non-existent email', {
            email: input.email,
            ...getCtx(),
        });
        return { success: false, reason: 'EMAIL_NOT_FOUND' };
    }

    const { token } = await createTokenService(user.id, 'PASSWORD_RESET', prisma);

    const emailSent = await sendPasswordResetEmail(user.email, token);
    if(!emailSent) {
        logger.warn('Failed to send password reset email', { ...getCtx() });
        return { success: false, reason: 'EMAIL_SEND_FAILURE' };
    }

    return { success: true };
}




// RESET PASSWORD
type ResetPasswordResult =
    | { success: true }
    | { success: false; reason: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'TOKEN_REUSE' | 'DATABASE_ERROR' };

export async function resetPasswordService(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    const token = input.token;
    const newPassword = input.password;

    return prisma.$transaction(async (trx) => {
        const result = await verifyTokenService(token, 'PASSWORD_RESET', trx);

        if(!result.success) {
            logger.warn('Password reset failed', {
                reason: result.reason,
                ...getCtx(),
            });
            return { success: false, reason: result.reason };
        }

        const passwordHashed = await hashPassword(newPassword);

        await trx.user.update({
            where: { id: result.userID },
            data:  { passwordHashed },
        });

        logger.info('Password reset successfully', {
            userId: result.userID,
            ...getCtx(),
        });

        return { success: true };
    });
}







/**
 *  PROTECTED SERVICE - requires user to be authenticated
 */

// CHANGE PASSWORD
type ChangePasswordResult =
    | { success: true }
    | { success: false; reason: 'CURRENT_PASSWORD_INCORRECT' | 'DATABASE_ERROR' };

export async function changePasswordService(userID: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
    return prisma.$transaction(async (trx) => {
        const user = await trx.user.findUnique({
            where: { id: userID },
            select: { passwordHashed: true },
        });

        if(!user) {
            logger.error('Change password failed: user not found', { ...getCtx() });
            return { success: false, reason: 'DATABASE_ERROR' };
        }

        const passwordMatch = await comparePassword(currentPassword, user.passwordHashed);
        if(!passwordMatch) {
            logger.warn('Change password failed: current password incorrect', { ...getCtx() });
            return { success: false, reason: 'CURRENT_PASSWORD_INCORRECT' };
        }

        const newHashedPassword = await hashPassword(newPassword);

        await trx.user.update({
            where: { id: userID },
            data:  { passwordHashed: newHashedPassword },
        });

        logger.info('Password changed successfully', { ...getCtx() });

        // Invalidate all existing sessions for the user here to force re-login with the new password

        return { success: true };
    });
}