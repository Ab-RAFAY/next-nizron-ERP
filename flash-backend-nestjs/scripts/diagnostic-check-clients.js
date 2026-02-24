const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=disable';

async function checkClients() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    // Check clients columns
    const columnRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients' order by ordinal_position");
    console.log('Columns in clients:');
    columnRes.rows.forEach(col => {
      console.log(` - ${col.column_name} (${col.data_type})`);
    });

  } catch (error) {
    console.error('Error checking clients table:', error);
  } finally {
    await client.end();
  }
}

checkClients();
