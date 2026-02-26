const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  // Check existing threads for client 25
  const threads = await p.query("SELECT * FROM chat_threads WHERE client_id = 25");
  console.log('Threads for client 25:', threads.rows);

  // Check all threads
  const all = await p.query("SELECT id, client_id, target_employee_id FROM chat_threads ORDER BY id");
  console.log('\nAll threads:');
  all.rows.forEach(r => console.log(`  id=${r.id} client=${r.client_id} employee=${r.target_employee_id}`));

  // Try manual insert
  console.log('\n=== Testing manual insert ===');
  try {
    const res = await p.query(
      "INSERT INTO chat_threads (client_id, target_employee_id, last_message_at) VALUES ($1, $2, NOW()) RETURNING *",
      [25, 10238]
    );
    console.log('Insert OK:', res.rows[0]);
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
