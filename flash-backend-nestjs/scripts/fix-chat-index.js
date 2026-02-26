const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  // Check all indexes on chat_threads
  const indexes = await p.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'chat_threads'
  `);
  console.log('Indexes on chat_threads:');
  indexes.rows.forEach(r => console.log(`  ${r.indexname}: ${r.indexdef}`));

  // Drop the old unique index
  console.log('\n--- Dropping old index chat_threads_client_id_unique ---');
  try {
    await p.query('DROP INDEX IF EXISTS chat_threads_client_id_unique');
    console.log('Dropped!');
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Show indexes after
  const after = await p.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'chat_threads'
  `);
  console.log('\nIndexes after fix:');
  after.rows.forEach(r => console.log(`  ${r.indexname}: ${r.indexdef}`));

  // Test insert
  console.log('\n--- Testing insert (client=25, employee=10238) ---');
  try {
    const res = await p.query(
      "INSERT INTO chat_threads (client_id, target_employee_id, last_message_at) VALUES ($1, $2, NOW()) RETURNING id, client_id, target_employee_id",
      [25, 10238]
    );
    console.log('Insert OK:', res.rows[0]);
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  console.log('\n--- Testing insert (client=25, employee=10327) ---');
  try {
    const res = await p.query(
      "INSERT INTO chat_threads (client_id, target_employee_id, last_message_at) VALUES ($1, $2, NOW()) RETURNING id, client_id, target_employee_id",
      [25, 10327]
    );
    console.log('Insert OK:', res.rows[0]);
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  // Final state
  const all = await p.query("SELECT id, client_id, target_employee_id FROM chat_threads ORDER BY id");
  console.log('\nAll threads:');
  all.rows.forEach(r => console.log(`  id=${r.id} client=${r.client_id} employee=${r.target_employee_id}`));

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
