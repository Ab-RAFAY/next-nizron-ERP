const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=disable';

async function testQuery() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    const columns = [
      "client_complaints.id", 
      "client_complaints.client_id", 
      "clients.name", 
      "clients.company_name", 
      "client_complaints.title", 
      "client_complaints.description", 
      "client_complaints.category", 
      "client_complaints.status", 
      "client_complaints.priority", 
      "client_complaints.assigned_to", 
      "client_complaints.resolution", 
      "client_complaints.admin_feedback", 
      "client_complaints.created_at", 
      "client_complaints.updated_at"
    ];

    for (const col of columns) {
      try {
        await client.query(`SELECT ${col} FROM client_complaints LEFT JOIN clients ON client_complaints.client_id = clients.id LIMIT 1`);
        console.log(`Column ${col}: OK`);
      } catch (e) {
        console.error(`Column ${col}: FAILED - ${e.message}`);
      }
    }

  } catch (error) {
    console.error('GENERIC ERROR:', error.message);
  } finally {
    await client.end();
  }
}

testQuery();
