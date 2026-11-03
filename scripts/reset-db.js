import { resetDb, pool } from '../test/helpers.js';

resetDb()
  .then(() => console.log('Database reset and seeded.'))
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
