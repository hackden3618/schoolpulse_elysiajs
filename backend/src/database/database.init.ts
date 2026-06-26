import { Pool } from 'pg';

// Create a singleton pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/schoolpulse',
});

// Export the pool and helper functions
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  client: () => pool.connect(),
};   
