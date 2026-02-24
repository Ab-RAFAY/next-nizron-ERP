import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function setClientPasswords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // Check if password column exists
    const checkColRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'password';
    `);

    if (checkColRes.rowCount === 0) {
      console.log('Password column is missing. Adding it to "clients" table...');
      await client.query('ALTER TABLE clients ADD COLUMN password TEXT;');
      console.log('Successfully added password column.');
    } else {
      console.log('Password column already exists.');
    }

    const password = 'client123';
    console.log(`Hashing password: "${password}"...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Updating all clients with the new password...');
    const res = await client.query(
      'UPDATE clients SET password = $1 WHERE email IS NOT NULL AND email != \'\';',
      [hashedPassword]
    );

    console.log(`Successfully updated ${res.rowCount} clients.`);
  } catch (err) {
    console.error('Update failed:', err.message);
  } finally {
    await client.end();
  }
}

setClientPasswords();
