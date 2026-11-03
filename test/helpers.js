import fs from 'node:fs';
import { pool } from '../src/db.js';

async function resetDb() {
  const schema = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
  const seed = fs.readFileSync(new URL('../db/seed.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  await pool.query(seed);
}

export { resetDb, pool };
