import { prisma } from '@/config/database.config';
import { PrismaClient, TokenType } from '@/generated/prisma/client';
import { env } from '@/config/env.config';

import { generateAndHashToken, hashToken } from '@/shared/utils/crypto.util';
import { logger } from '@/shared/utils/logger.util';
import { getCtx } from '@/shared/utils/requestContext.utils';
import { DefaultArgs } from '@prisma/client/runtime/client';

type PrismaTransactionClient = Omit<PrismaClient<never, undefined, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">



/**
 * FUNCTIONS
 */


async function invalidateUserTokens(userID: string, type: TokenType, db: PrismaTransactionClient): Promise<void> {
    try {
        const result = await db.token.updateMany({
            where: {
                userID,
                tokenType: type,
                usedAt: { equals: null },
            },
            data: { usedAt: new Date() },
        });
        
        // Only log if there was actually something to invalidate
        if(result.count > 0) {
            logger.info('Previous tokens invalidated', {
                userId: userID,
                tokenType: type,
                count: Number(result.count),
                ...getCtx(),
            });
        }
    }

    catch(error) {
        logger.error('Error invalidating user tokens', { userId: userID, tokenType: type, error, ...getCtx() });
        throw error;
    }
}




/**
 * TOKEN SERVICE
 */


// CREATE TOKEN
export async function createTokenService(userID: string, type: TokenType, db: PrismaTransactionClient): Promise<{ token: string; expiresAt: Date }> {
    const { token, hash } = generateAndHashToken();

    // Calculate expiry based on token type
    const expiryHours = type === 'EMAIL_VERIFICATION' 
        ? env.VERIFICATION_TOKEN_EXPIRY_HOURS 
        : env.PASSWORD_RESET_TOKEN_EXPIRY_HOURS;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Invalidate existing tokens of the same type for the user
    await invalidateUserTokens(userID, type, db);

    // Insert new token into database
    await db.token.create({
        data: {
            userID,
            tokenHashed: hash,
            tokenType: type,
            expiresAt,
        }
    });

    logger.info('Token created', {
        userId: userID,
        tokenType: type,
        expiresAt: expiresAt.toISOString(),
        ...getCtx(),
    });

    return { token, expiresAt };
}




// VERIFY TOKEN
type VerifyTokenResult =
    | { success: true; userID: string }
    | { success: false; reason: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'TOKEN_REUSE' };

export async function verifyTokenService(token: string, type: TokenType, db: PrismaTransactionClient): Promise<VerifyTokenResult> {
    const hash = hashToken(token);

    const existingToken = await db.token.findFirst({
        where: {
            tokenHashed: hash,
            tokenType: type
        },
        select: {
            userID: true,
            expiresAt: true,
            usedAt: true
        }
    });
    
    // No token found
    if(!existingToken) {
        logger.warn('Token verification failed: token not found', { tokenType: type, ...getCtx() });
        return { success: false, reason: 'INVALID_TOKEN' };
    }


    if(existingToken.usedAt && type === 'EMAIL_VERIFICATION') {
        const user = await db.user.findUnique({
            where: { id: existingToken.userID },
            select: { emailVerified: true }
        });

        if(user?.emailVerified) {
            logger.info('Verification link re-visited by already-verified user', {
                userId: existingToken.userID,
                tokenType: type,
                ...getCtx(),
            });
            return { success: true, userID: existingToken.userID };
        }
    }

    if(existingToken.usedAt && type === 'PASSWORD_RESET') {
        logger.warn('Password reset token reuse attempt detected', {
            userId: existingToken.userID,
            tokenType: type,
            ...getCtx(),
        });
        return { success: false, reason: 'TOKEN_REUSE' };
    }

    
    if(new Date() > existingToken.expiresAt) {
        logger.warn('Token verification failed: token expired', {
            userId: existingToken.userID,
            tokenType: type,
            expiredAt: existingToken.expiresAt.toISOString(),
            ...getCtx(),
        });
        return { success: false, reason: 'EXPIRED_TOKEN' };
    }

    // First time use - mark as used
    await db.token.updateMany({
        where: {
            tokenHashed: hash,
            tokenType: type,
            usedAt: null,
        },
        data: { usedAt: new Date() },
    });
    
    logger.info('Token verified and consumed', {
        userId: existingToken.userID,
        tokenType: type,
        ...getCtx(),
    });

    return { success: true, userID: existingToken.userID };
}