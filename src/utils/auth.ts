import { betterAuth } from "better-auth";

import { env } from "@/config/env.config";
import { db } from "@/config/database.config";

import { sendVerificationEmail, sendPasswordResetEmail } from '@/utils/email.util';
import { logger } from "@/utils/logger.util";



export const auth = betterAuth({
    appName: "Express-BetterAuth-Boilerplate",
    baseURL: env.APP_URL,
    basePath: "/api/auth",
    trustedOrigins: [env.FRONTEND_URL, env.APP_URL],
    secret: env.BETTER_AUTH_SECRET,

    fetchOptions: {
        credentials: 'include',
    },

    advanced: {
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for", "x-real-ip"], // Headers to check for the client's IP address, in order of priority
		},
	},


    rateLimit: {
        enabled: true,
        storage: "database",
        window: 60, // time window in seconds
        max: 20, // max number of attempts within the time window
        customRules: {
            // Highest risk - brute force target
            "/sign-in/email": {
                window: 60 * 15,  // 15 min
                max: 10
            },
            // Slow down account creation (spam/abuse)
            "/sign-up/email": {
                window: 60 * 60,  // 1 hour
                max: 5
            },
            // Prevent email enumeration via timing/volume
            "/request-password-reset": {
                window: 60 * 60, // 1 hour
                max: 5
            },
            // Prevent inbox flooding
            "/send-verification-email": {
                window: 60 * 60, // 1 hour
                max: 3
            },
        }
    },

    database: {
        type: "postgres",
        db: db,
    },
    
    emailAndPassword: { 
        enabled: true, 
        requireEmailVerification: true,
        minPasswordLength: 8,
		maxPasswordLength: 128,
        autoSignIn: false,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url/*, token*/ }) => {
            await sendPasswordResetEmail(user.email, url);
        },
        resetPasswordTokenExpiresIn: env.PASSWORD_RESET_TOKEN_EXPIRE_IN, // 3600 seconds = 1 hour (by default)
    },

    user: {
        additionalFields: {
            firstName: {
                type: "string",
                required: true,
                input: true, // This field will be included in the registration form
            },
            lastName: {
                type: "string",
                required: true,
                input: true, // This field will be included in the registration form
            },
            country: {
                type: "string",
                required: true,
                input: true, // This field will be included in the registration form
            },
            phoneNumber: {
                type: "string",
                required: true,
                input: true, // This field will be included in the registration form
            },
            role: {
                type: ["user", "admin"],
                required: true,
                defaultValue: 'user',
                input: false, // This field will NOT be included in the registration form
            }
        }
    },

    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail(user.email, url);
        },
        sendOnSignUp: true,
        expiresIn: env.VERIFICATION_TOKEN_EXPIRE_IN, // 3600 seconds = 1 hour (by default)
    },


    databaseHooks: {
        user: {
            create: {
                // before: async (user, ctx) => {
                //     console.log("Creating user:", user); user is the object that will be saved to the database, containing all user fields including additionalFields.
                //     console.log("Context:", ctx); ctx contains the request, headers, body, params, query 
                // },
                // after: async (user) => {}
            }
        }
    },


    logger: {
        level: env.BETTER_AUTH_LOG_LEVEL || 'info',
        log(level, message, ...args) {
            logger.log(level, `[BetterAuth] ${message}`, ...args);
        }
    }
});