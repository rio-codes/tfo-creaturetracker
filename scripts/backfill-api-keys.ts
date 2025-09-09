import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../src/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// When running scripts from the command line, the database connection might
// require explicit SSL configuration, which is the cause of the "SSL required" error.
// We'll create a dedicated connection for this script to ensure SSL is enabled.
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set.');
}

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1, // This is a single-use script, no need for a connection pool.
});

const db = drizzle(sql);

async function main() {
    console.log('Starting to backfill API keys for existing users...');

    const usersWithoutKeys = await db
        .select({ id: users.id })
        .from(users)
        .where(isNull(users.apiKey));

    if (usersWithoutKeys.length === 0) {
        console.log('All users already have API keys. No action needed.');
        return;
    }

    console.log(
        `Found ${usersWithoutKeys.length} users without API keys. Generating keys...`
    );

    for (const user of usersWithoutKeys) {
        const newApiKey = randomUUID();
        await db
            .update(users)
            .set({ apiKey: newApiKey })
            .where(eq(users.id, user.id));
        console.log(`Updated user ${user.id} with a new API key.`);
    }

    console.log('Successfully backfilled all API keys.');
}

async function run() {
    try {
        await main();
        process.exitCode = 0;
    } catch (e) {
        console.error('An error occurred during script execution:', e);
        process.exitCode = 1;
    } finally {
        console.log('Closing database connection...');
        await sql.end();
    }
}

run();
