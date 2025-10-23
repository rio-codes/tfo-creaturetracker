import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function migrateData(isDryRun: boolean, db: any) {
    if (isDryRun) {
        console.log('--- Running in DRY-RUN mode. No changes will be saved. ---');
    }
    console.log('Starting data migration for creature foreign keys...');

    try {
        await db.execute(sql`
			-- Update breeding_pairs male parents
			UPDATE breeding_pairs
			SET male_parent_user_id = c.user_id, male_parent_code = c.code
			FROM creature c
			WHERE breeding_pairs.male_parent_id = c.id;

			-- Update breeding_pairs female parents
			UPDATE breeding_pairs
			SET female_parent_user_id = c.user_id, female_parent_code = c.code
			FROM creature c
			WHERE breeding_pairs.female_parent_id = c.id;

			-- Update breeding_log_entries progeny 1
			UPDATE breeding_log_entries
			SET progeny_1_user_id = c.user_id, progeny_1_code = c.code
			FROM creature c
			WHERE breeding_log_entries.progeny_1_id = c.id;

			-- Update breeding_log_entries progeny 2
			UPDATE breeding_log_entries
			SET progeny_2_user_id = c.user_id, progeny_2_code = c.code
			FROM creature c
			WHERE breeding_log_entries.progeny_2_id = c.id;

			-- Update achieved_goals
			UPDATE achieved_goal
			SET matching_progeny_user_id = c.user_id, matching_progeny_code = c.code
			FROM creature c
			WHERE achieved_goal.matching_progeny_id = c.id;
		`);

        console.log('Data migration successful!');
    } catch (error) {
        console.error('Data migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set.');
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql, { schema });
    const isDryRun = process.argv.includes('--dry-run');

    try {
        await migrateData(isDryRun, db);
        process.exitCode = 0;
        console.log('Connected to database');
    } catch (e) {
        console.error('An error occurred during script execution:', e);
        process.exitCode = 1;
    } finally {
        console.log('Closing database connection...');
        await sql.end();
    }
}

run();
