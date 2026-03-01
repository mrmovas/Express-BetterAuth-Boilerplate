import { z } from 'zod';




// USER TABLE
const usersSchema = z.object({
    id: z.string(),
    username: z.string().min(3).max(20),
    fullName: z.string().min(3).max(50),
    passwordHashed: z.string(),
    email: z.email(),
    emailVerified: z.boolean().default(false),
    phone: z.string().optional(),
    role: z.string().default('UNASSIGNED'),
    isActive: z.boolean(),
    lastLoginAt: z.coerce.date(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type Users = z.infer<typeof usersSchema>; 




// TOKENS TABLE
const tokensSchema = z.object({
    id: z.string(),
    userID: z.string(),
    tokenHashed: z.string(),
    tokenType: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
    expiresAt: z.coerce.date(),
    usedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date(),
});

export type Tokens = z.infer<typeof tokensSchema>;
