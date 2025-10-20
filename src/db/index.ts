import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import 'dotenv/config';
import * as schema from './schema';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect();

// Passes schema to drizzle so it knows how our db looks like
export const db = drizzle(client, { schema });

export type Database = typeof schema;
