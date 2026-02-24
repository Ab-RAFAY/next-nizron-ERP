const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=disable';

async function checkDb() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    // 1. List all tables
    const tableRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables in public schema:', tableRes.rows.map(r => r.table_name));

    // 2. Check client_complaints columns
    const columnRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'client_complaints' order by ordinal_position");
    console.log('Columns in client_complaints:');
    columnRes.rows.forEach(col => {
      console.log(` - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('Error checking DB:', error);
  } finally {
    await client.end();
  }
}

checkDb();
