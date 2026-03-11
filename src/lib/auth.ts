import { betterAuth } from "better-auth";
import { createAuthClient } from "better-auth/client"
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "@/config/env.config";
import { prisma } from "@/config/database.config";

import { sendVerificationEmail} from '@/utils/email.util';
import { logger } from "@/utils/logger.util";



export const auth = betterAuth({
    appName: "Express Auth Boilerplate",
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    trustedOrigins: [env.FRONTEND_URL, env.APP_URL],
    secret: env.BETTER_AUTH_SECRET,

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    
    emailAndPassword: { 
        enabled: true, 
        requireEmailVerification: true,
        autoSignIn: false,
        revokeSessionsOnPasswordReset: true,

    },

    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            sendVerificationEmail(user.email, url);
        },
        sendOnSignUp: true,
    },


    databaseHooks: {
        user: {
            create: {
                // before: async (user) => {},
                // after: async (user) => {}
            }
        }
    },


    logger: {
        level: env.BETTER_AUTH_LOG_LEVEL || 'info',
        log(level, message, ...args) {
            logger[level](`[BetterAuth] ${message}`, ...args);
        }
    }
});

export const authClient = createAuthClient({
    baseURL: env.BETTER_AUTH_BASE_URL,
});