import type { Config } from 'drizzle-kit';

export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: 'postgres://neon:npg@localhost:5432/neondb',
    },
    verbose: true,
    strict: true,
} satisfies Config;
