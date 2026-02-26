const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding target_employee_id column...');
    await client.query('ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS target_employee_id INTEGER');
    console.log('  Done.');

    console.log('Dropping old unique constraint...');
    await client.query('ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_client_id_unique');
    console.log('  Done.');

    console.log('Adding new unique constraint (client_id, target_employee_id)...');
    try {
      await client.query('ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_client_employee_unique UNIQUE (client_id, target_employee_id)');
      console.log('  Done.');
    } catch (e) {
      console.log('  Constraint may already exist:', e.message);
    }

    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_threads' ORDER BY ordinal_position");
    console.log('\nUpdated chat_threads columns:');
    for (const row of res.rows) {
      console.log('  ' + row.column_name + ' (' + row.data_type + ')');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
