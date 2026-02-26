const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  // Check all constraints on chat_threads
  const constraints = await p.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='chat_threads'::regclass"
  );
  console.log('Current constraints:');
  constraints.rows.forEach(r => console.log(`  ${r.conname} [${r.contype}]: ${r.def}`));

  // Drop old unique constraint if it still exists
  console.log('\n--- Dropping old chat_threads_client_id_unique constraint ---');
  try {
    await p.query('ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_client_id_unique');
    console.log('Dropped chat_threads_client_id_unique');
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Verify the new constraint exists
  console.log('\n--- Ensuring chat_threads_client_employee_unique exists ---');
  try {
    // Check if it exists
    const check = await p.query(
      "SELECT conname FROM pg_constraint WHERE conrelid='chat_threads'::regclass AND conname='chat_threads_client_employee_unique'"
    );
    if (check.rows.length === 0) {
      await p.query('ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_client_employee_unique UNIQUE (client_id, target_employee_id)');
      console.log('Created chat_threads_client_employee_unique');
    } else {
      console.log('chat_threads_client_employee_unique already exists');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }

  // Show final constraints
  const after = await p.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='chat_threads'::regclass"
  );
  console.log('\nFinal constraints:');
  after.rows.forEach(r => console.log(`  ${r.conname} [${r.contype}]: ${r.def}`));

  // Now test insert for client 25 + employee 10238
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

  // Test insert for client 25 + employee 10327
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

  // Show all threads now
  const all = await p.query("SELECT id, client_id, target_employee_id FROM chat_threads ORDER BY id");
  console.log('\nAll threads after fix:');
  all.rows.forEach(r => console.log(`  id=${r.id} client=${r.client_id} employee=${r.target_employee_id}`));

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
