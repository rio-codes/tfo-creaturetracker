import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
    (await import('dotenv')).config({ path: '.env.local' });
}

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
} satisfies Config;
