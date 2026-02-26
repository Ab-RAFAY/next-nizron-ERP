const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const p = new Pool({
  connectionString: 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
});

async function main() {
  // Find a client
  const clients = await p.query("SELECT id, email, name FROM clients LIMIT 5");
  console.log('Clients:', clients.rows);

  if (clients.rows.length === 0) {
    console.log('No clients found!');
    await p.end();
    return;
  }

  const client = clients.rows[0];
  console.log('\nUsing client:', client);

  // Read JWT secret from .env
  const fs = require('fs');
  const envContent = fs.readFileSync('.env', 'utf8');
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  const jwtSecret = jwtSecretMatch ? jwtSecretMatch[1].trim() : 'default-secret';
  console.log('JWT Secret found:', jwtSecret ? 'yes' : 'no');

  // Create a client token
  const token = jwt.sign({ sub: client.id, email: client.email, type: 'client' }, jwtSecret, { expiresIn: '1h' });
  console.log('\nToken:', token.substring(0, 50) + '...');

  // Test GET /chat/thread/messages?employeeId=10327
  console.log('\n=== Testing GET /api/chat/thread/messages?employeeId=10327 ===');
  try {
    const res = await fetch('http://localhost:8000/api/chat/thread/messages?employeeId=10327', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${body.substring(0, 500)}`);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }

  // Test POST /chat/thread/messages?employeeId=10327
  console.log('\n=== Testing POST /api/chat/thread/messages?employeeId=10327 ===');
  try {
    const res = await fetch('http://localhost:8000/api/chat/thread/messages?employeeId=10327', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test message from debug script' }),
    });
    const body = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${body.substring(0, 500)}`);
  } catch (e) {
    console.error('Fetch error:', e.message);
  }

  await p.end();
}
main().catch(e => { console.error(e); p.end(); });
