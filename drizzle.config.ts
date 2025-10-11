import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: '.env.local' });
}

const database_url = process.env.DATABASE_URL;
if (!database_url) {
    throw new Error('DATABASE_URL is not defined');
}

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: database_url as string,
    },
    verbose: true,
} satisfies Config;
