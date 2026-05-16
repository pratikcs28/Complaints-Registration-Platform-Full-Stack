import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import 'dotenv/config';

// For query purposes
const queryClient = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres');
export const db = drizzle(queryClient, { schema });
