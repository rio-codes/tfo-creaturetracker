import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set.');
}

const client = postgres(connectionString, {
    prepare: false,
    idle_timeout: 5,
    max: 10,
    ssl: 'require',
});

export const db = drizzle(client, { schema, logger: false });
