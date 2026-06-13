require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  // Add missing columns to users table if they don't exist
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[]`,
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
      console.log('OK:', sql);
    } catch (e) {
      console.error('FAILED:', sql, '->', e.message);
    }
  }
  console.log('\nMigration complete.');
  pool.end();
}
migrate();
