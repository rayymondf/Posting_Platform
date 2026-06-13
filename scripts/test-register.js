require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['testuser999']);
    console.log('SELECT ok, existing rows:', existing.rows.length);
    const hash = await bcrypt.hash('password123', 10);
    const r = await pool.query(
      'INSERT INTO users (username, email, password, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username',
      ['testuser999', null, hash, 'testuser999']
    );
    console.log('INSERT ok:', r.rows[0]);
    await pool.query('DELETE FROM users WHERE username = $1', ['testuser999']);
    console.log('Cleanup ok — registration flow works');
  } catch (e) {
    console.error('FAILED:', e.message, e.detail || '');
  }
  pool.end();
}
test();
