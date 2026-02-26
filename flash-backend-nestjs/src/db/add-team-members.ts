import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { eq } from 'drizzle-orm';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

const NEW_MEMBERS = [
  {
    email: 'ahmed.khan@management.com',
    password: 'Admin@123',
    full_name: 'Ahmed Khan',
    is_admin: true,
  },
  {
    email: 'sara.malik@management.com',
    password: 'Admin@123',
    full_name: 'Sara Malik',
    is_admin: true,
  },
];

async function addTeamMembers() {
  console.log('Adding management team members...\n');

  for (const member of NEW_MEMBERS) {
    // Check if already exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, member.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ✓ ${member.full_name} (${member.email}) already exists — skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(member.password, 10);
    const [created] = await db
      .insert(schema.users)
      .values({
        email: member.email,
        password: hashedPassword,
        full_name: member.full_name,
        is_admin: member.is_admin,
        is_active: true,
      })
      .returning({ id: schema.users.id });

    console.log(`  ✓ Created ${member.full_name} (${member.email}) — id: ${created.id}`);
  }

  // Show all team members now
  console.log('\n--- Current management team members ---');
  const allAdmins = await db
    .select({
      id: schema.users.id,
      full_name: schema.users.full_name,
      email: schema.users.email,
      is_admin: schema.users.is_admin,
      is_active: schema.users.is_active,
    })
    .from(schema.users)
    .where(eq(schema.users.is_active, true));

  for (const u of allAdmins) {
    if (u.is_admin) {
      console.log(`  [ADMIN] ${u.full_name} — ${u.email} (id: ${u.id})`);
    }
  }

  await pool.end();
  console.log('\nDone!');
}

addTeamMembers().catch((err) => {
  console.error('Error:', err);
  pool.end();
  process.exit(1);
});
