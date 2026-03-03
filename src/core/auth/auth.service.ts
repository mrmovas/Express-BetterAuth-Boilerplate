import { database } from "../../config/database.config";
import { UserInsert } from "../../shared/types/database.types";

import { hashPassword, comparePassword } from "../../shared/utils/crypto.util";
import { sendVerificationEmail, /*sendPasswordResetEmail, sendWelcomeEmail*/ } from "../../shared/utils/email.util";
import { createTokenService, verifyTokenService } from "../token/token.service";
import { logger } from "../../shared/utils/logger.util";

import { SignupInput } from "./auth.validation";




// SIGNUP A NEW USER
type SignupResult =
    | { success: true;  userId: string; email: string }
    | { success: false; error: 'EMAIL_ALREADY_EXISTS'; email: string; message: string }
    | { success: false; error: 'DATABASE_ERROR'; message: string };

export async function signupService(input: SignupInput): Promise<SignupResult> {
    return await database.transaction().execute(async (trx) => {
        const existingUser = await trx
            .selectFrom('users')
            .select('id')
            .where('email', '=', input.email)
            .executeTakeFirst();

        // If a user with the same email already exists, reject the registration
        if(existingUser) return { success: false, error: 'EMAIL_ALREADY_EXISTS', email: input.email, message: 'Email is already registered' };
        
        // Create new user
        const userData: UserInsert = {
            firstName: input.firstName,
            lastName: input.lastName,
            passwordHashed: await hashPassword(input.password),
            email: input.email,
            phone: {
                countryCode: input.phone.countryCode,
                number: input.phone.number,
            },
            role: 'UNASSIGNED',
            isActive: true,
        }

        // Insert user into database and return the new user's ID and email
        const user = await trx
            .insertInto('users')
            .values(userData)
            .returning(['id', 'email'])
            .executeTakeFirst();

        if(!user) {
            logger.error('Signup failed: DB insert returned no row', {
                email: input.email,
            });
            return { success: false, error: 'DATABASE_ERROR', message: 'Failed to create user. Please try again.' };
        }

        // Create verification token and send email
        const { token } = await createTokenService(user.id, 'EMAIL_VERIFICATION', trx);

        // Send verification email
        const emailSent = await sendVerificationEmail(user.email, token);
        if(!emailSent) {
            logger.warn('Verification email failed to send after signup', {
                userId: user.id,
            });
        }

        logger.info('User registered successfully', { userId: user.id });
        return { success: true, userId: user.id, email: user.email };
    });
}





// VERIFY EMAIL
type VerifyEmailResult =
    | { success: true;  userId: string }
    | { success: false; reason: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'TOKEN_REUSE' };

export async function verifyEmailService(token: string): Promise<VerifyEmailResult> {
    return await database.transaction().execute(async (trx) => {
        const userID = await verifyTokenService(token, 'EMAIL_VERIFICATION', trx);

        if(!userID) return { success: false, reason: 'INVALID_TOKEN' };

        // Update user's email verification status in the database
        await trx
            .updateTable('users')
            .set({ emailVerified: true, updatedAt: new Date() })
            .where('id', '=', userID)
            .execute();
    
        return { success: true, userId: userID };
    });
}