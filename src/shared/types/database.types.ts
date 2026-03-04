import { Generated, ColumnType, Insertable, Selectable, Updateable } from 'kysely'




// USERS TABLE
export interface UsersTable {
    id: Generated<string>;
    firstName: string;
    lastName: string;
    passwordHashed: string;
    email: string;
    emailVerified: Generated<boolean>;
    phone: {
        countryCode: string;
        number: string;
    };
    role: string;
    isActive: boolean;
    lastLoginAt: ColumnType<Date, never, Date>; // Allow setting Date on insert/update, but always return Date on select
    createdAt: Generated<Date>;
    updatedAt: Generated<Date>;
}


export type Users = Selectable<UsersTable>;
export type UserInsert = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;




// TOKENS TABLE
export interface TokensTable {
    id: Generated<string>;
    userID: string;
    tokenHashed: string;
    tokenType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Generated<Date>;
}

export type Tokens = Selectable<TokensTable>;
export type TokenInsert = Insertable<TokensTable>;
export type TokenUpdate = Updateable<TokensTable>;