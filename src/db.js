import './config/env.js';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  // pg reads PGHOST, PGPORT, PGUSER, PGPASSWORD and PGDATABASE by default.
  // Keep DATABASE_URL as an optional override for externally managed databases.
  connectionString: process.env.DATABASE_URL,
});

export { pool };
