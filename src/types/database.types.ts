export type DatabaseTable = {
    id: number;
    created_at: Date;
    updated_at: Date;
}

// The tables defined here should reflect the tables you are using in your database, non the ones BetterAuth uses as they are created and used internally by BetterAuth
// The tables defined here are for type safety when using the Kysely client throughout your codebase.
// The actual types, for example unique, default values, etc. are not defined here, you should define them in /bootstrap/database-setup.ts when you check/create the tables, and in your migration scripts when you update the schema.
// This is only for type safety when using the Kysely client, it does not effect the actual database schema in any way.
export interface Database { 
    table_name: DatabaseTable;
}
