require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const r = await pool.query("SELECT id, username, email FROM users WHERE username ILIKE '%raymond%' OR username ILIKE '%rayym%'");
  if (r.rows.length === 0) { console.log('No raymond account found.'); pool.end(); return; }
  console.log('Found:', r.rows);
  for (const user of r.rows) {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log(`Deleted user: ${user.username} (id: ${user.id})`);
  }
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
