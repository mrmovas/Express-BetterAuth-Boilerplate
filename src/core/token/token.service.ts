import { Kysely, Transaction } from 'kysely';
import { Database } from '../../config/database.config';

import { database } from '../../config/database.config';
import { TokensTable, TokenInsert } from '../../shared/types/database.types';
import { env } from '../../config/env.config';

import { generateAndHashToken, hashToken } from '../../shared/utils/crypto.util';
import { logger } from '../../shared/utils/logger.util';




/**
 * FUNCTIONS
 */


async function invalidateUserTokens(userID: string, type: TokensTable['tokenType'], db: Kysely<Database> | Transaction<Database> = database): Promise<void> {
    try {
        const result = await db
            .updateTable('tokens')
            .set({ usedAt: new Date() })
            .where('userID', '=', userID)
            .where('tokenType', '=', type)
            .where('usedAt', 'is', null)
            .executeTakeFirst();
        
        // Only log if there was actually something to invalidate
        if(result && Number(result.numUpdatedRows) > 0) {
            logger.info('Previous tokens invalidated', {
                userId: userID,
                tokenType: type,
                count: Number(result.numUpdatedRows),
            });
        }
    }

    catch(error) {
        logger.error('Error invalidating user tokens', { userId: userID, tokenType: type, error });
        throw error;
    }
}




/**
 * TOKEN SERVICE
 */


// CREATE TOKEN
export async function createTokenService(userID: string, type: TokensTable['tokenType'], db: Kysely<Database> | Transaction<Database> = database): Promise<{ token: string; expiresAt: Date }> {
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
    const tokenData: TokenInsert = {
        userID,
        tokenHashed: hash,
        tokenType: type,
        expiresAt,
    };

    await db
        .insertInto('tokens')
        .values(tokenData)
        .execute();

    logger.info('Token created', {
        userId: userID,
        tokenType: type,
        expiresAt: expiresAt.toISOString(),
    });

    return { token, expiresAt };
}




// VERIFY TOKEN
export async function verifyTokenService(token: string, type: TokensTable['tokenType'], db: Kysely<Database> | Transaction<Database> = database): Promise<string | null> {
    const hash = hashToken(token);

    const existingToken = await db
        .selectFrom('tokens')
        .select(['userID', 'expiresAt', 'usedAt'])
        .where('tokenHashed', '=', hash)
        .where('tokenType', '=', type)
        .executeTakeFirst();
    
    // No token found
    if(!existingToken) {
        logger.warn('Token verification failed: token not found', { tokenType: type });
        return null;
    }

    // If the token was already used, check if the user is already verified.
    if(existingToken.usedAt) {
        const user = await db
            .selectFrom('users')
            .select('emailVerified')
            .where('id', '=', existingToken.userID)
            .executeTakeFirst();
        
        // If they are already verified, just return the ID. 
        // The Controller can then say "Welcome back!" instead of "Error!"
        if(user?.emailVerified) {
            logger.info('Verification link re-visited by already-verified user', {
                userId: existingToken.userID,
                tokenType: type,
            });
            return existingToken.userID;
        }

        // Token was used but user is still unverified. Possible replay attack?
        logger.warn('Token reuse attempt detected', {
            userId: existingToken.userID,
            tokenType: type,
        });
        return null; 
    }

    if(new Date() > existingToken.expiresAt) {
        logger.warn('Token verification failed: token expired', {
            userId: existingToken.userID,
            tokenType: type,
            expiredAt: existingToken.expiresAt.toISOString(),
        });
        return null;
    }

    // First time use - mark as used
    await db
        .updateTable('tokens')
        .set({ usedAt: new Date() })
        .where('tokenHashed', '=', hash)
        .execute();
    
    logger.info('Token verified and consumed', {
        userId: existingToken.userID,
        tokenType: type,
    });

    return existingToken.userID;
}