const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.kndwpdugnkzkqubfrybb:u9YXo25kKC53qEyx@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=disable';

async function fixSchema() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    // Add admin_feedback to client_complaints if it doesn't exist
    const addColumnQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'client_complaints' AND column_name = 'admin_feedback'
        ) THEN
          ALTER TABLE client_complaints ADD COLUMN admin_feedback TEXT;
          RAISE NOTICE 'Added column admin_feedback to client_complaints';
        ELSE
          RAISE NOTICE 'Column admin_feedback already exists';
        END IF;
      END $$;
    `;
    
    await client.query(addColumnQuery);
    console.log('Schema update completed successfully');

  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await client.end();
  }
}

fixSchema();
