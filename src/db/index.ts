import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema'; // Import the schema

const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema, logger: true });