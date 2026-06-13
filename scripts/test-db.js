require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT current_user, version()')
  .then(r => { console.log('DB OK:', r.rows[0]); pool.end(); })
  .catch(e => { console.error('DB FAILED:', e.message); pool.end(); });
