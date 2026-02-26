const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  const res = await p.query(`
    SELECT e.id, e.employee_id, e.full_name, e.designation, e.status,
           r.name as role_name, r.permissions
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE e.status = 'Active'
    LIMIT 20
  `);
  console.log('Active employees:');
  res.rows.forEach(row => {
    const hasChat = Array.isArray(row.permissions) && row.permissions.includes('chat');
    console.log(`  ID=${row.id} | ${row.full_name} | role=${row.role_name} | chat=${hasChat} | perms=${JSON.stringify(row.permissions)}`);
  });

  const chatEmps = res.rows.filter(r => Array.isArray(r.permissions) && r.permissions.includes('chat'));
  console.log(`\nEmployees with chat permission: ${chatEmps.length}`);
  if (chatEmps.length === 0) {
    console.log('WARNING: No employees have chat permission! Team list will be empty.');
  }

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
