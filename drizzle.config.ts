import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: (process.env.POSTGRES_URL || process.env.DEV_DATABASE_URL || process.env.DATABASE_URL) as string,
    },
    verbose: true,
    strict: true,
} satisfies Config;
