// import { z } from 'zod';
// import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Phone validation
 */
// const phoneSchema = z.object({
//     countryCode: z.string().min(1).max(3), // e.g., "US", "GB", "GR"
//     number: z.string()
// }).refine((data) => {
//     // Attempt to parse and validate
//     const phoneNumber = parsePhoneNumberFromString(data.number, data.countryCode as any);
//     return phoneNumber?.isValid();
// }, {
//     message: "Invalid phone number for the selected country",
//     path: ["number"], // Indicates that the error is related to the 'number' field
// });


type roles = "UNASSIGNED" | "USER" | "ADMIN";


// export interface UserCustomFields {
//     id: string;
//     email: string;
//     passwordHash: string;
//     role: roles;
//     phoneCountryCode?: string | null;
//     phoneNumber?: string | null;
//     isEmailVerified: boolean;
//     createdAt: Date;
//     updatedAt: Date;
// }


export type User = {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    //role: roles;
}