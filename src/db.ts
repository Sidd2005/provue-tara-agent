import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/provue_tara',
});

// A helper for raw SQL queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
