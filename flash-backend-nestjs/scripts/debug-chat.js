const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  // Check table structure
  const cols = await p.query(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='chat_threads' ORDER BY ordinal_position"
  );
  console.log('=== chat_threads columns ===');
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`));

  // Check constraints
  const constraints = await p.query(
    "SELECT conname, contype, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid='chat_threads'::regclass"
  );
  console.log('\n=== chat_threads constraints ===');
  constraints.rows.forEach(r => console.log(`  ${r.conname} [${r.contype}]: ${r.def}`));

  // Try a simple insert/select to see what error occurs
  console.log('\n=== Testing getOrCreateThread logic ===');
  try {
    const res = await p.query(
      "SELECT * FROM chat_threads WHERE client_id = 1 AND target_employee_id = 10327 LIMIT 1"
    );
    console.log('Query result:', res.rows.length, 'rows');
  } catch (e) {
    console.error('Query error:', e.message);
  }

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
