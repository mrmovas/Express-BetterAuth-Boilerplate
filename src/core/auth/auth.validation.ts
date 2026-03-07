import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';




/** ================================================
 * DEFINING VALIDATION SCHEMAS
 */ 


/**
 * Password validation rules
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');


/**
 * Email validation
 */
const emailSchema = z
    .email({ message: 'Invalid email address' })
    .toLowerCase()
    .trim();


/**
 * Phone validation
 */
const phoneSchema = z.object({
    countryCode: z.string().min(1).max(3), // e.g., "US", "GB", "GR"
    number: z.string()
}).refine((data) => {
    // Attempt to parse and validate
    const phoneNumber = parsePhoneNumberFromString(data.number, data.countryCode as any);
    return phoneNumber?.isValid();
}, {
    message: "Invalid phone number for the selected country",
    path: ["number"], // Indicates that the error is related to the 'number' field
});


/**
 * Token validation
 */
const tokenSchema = z.string().length(64, 'Invalid token format');




/** ============================================
 *  EXPORTING VALIDATION SCHEMAS
 */


/**
 * Signup validation schema
 */
export const signupSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
    phone: phoneSchema,
}).strict();

export type SignupInput = z.infer<typeof signupSchema>;


/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
  token: tokenSchema,
}).strict();;

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;


/**
 * Login validation schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
}).strict();;

export type LoginInput = z.infer<typeof loginSchema>;


/**
 * Resend verification email schema
 */
export const resendVerificationSchema = z.object({
    email: emailSchema,
}).strict();

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;


/**
 * Request password reset schema
 */
export const requestPasswordResetSchema = z.object({
    email: emailSchema,
}).strict();

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;


/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
    password: passwordSchema,
    token: tokenSchema,
}).strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
    oldPassword: z.string().min(8, 'Current password must be at least 8 characters'),
    newPassword: passwordSchema,
}).strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
