import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL as string,
    },
    verbose: true,
    strict: true,
} satisfies Config;
