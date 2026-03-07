export type UserRole = 'UNASSIGNED' | 'ADMINISTRATOR';

export type SessionUser = {
    id: string;
    email: string;
    emailVerified: boolean;
    role: UserRole;
    firstName: string;
    lastName: string;
}