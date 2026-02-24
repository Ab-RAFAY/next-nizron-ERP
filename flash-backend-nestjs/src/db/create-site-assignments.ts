import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

const db = drizzle(pool, { schema });

async function createSampleAssignments() {
  try {
    console.log('=== Fetching client sites ===');
    const sites = await db.select().from(schema.client_sites).limit(5);
    console.log(`Found ${sites.length} client sites`);

    if (sites.length === 0) {
      console.log('No client sites found. Please create client sites first.');
      return;
    }

    console.log('\n=== Fetching employees ===');
    const employees = await db.select({
      employee_id: schema.employees.employee_id,
      full_name: schema.employees.full_name,
      designation: schema.employees.designation
    }).from(schema.employees).limit(10);
    
    console.log(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('No employees found.');
      return;
    }

    console.log('\n=== Creating site-guard assignments ===');
    
    // Assign 2-3 guards to each site
    for (const site of sites) {
      const guardsForSite = employees.slice(0, Math.min(3, employees.length));
      
      for (const guard of guardsForSite) {
        const assignment = {
          site_id: site.id,
          employee_id: guard.employee_id,
          assignment_date: new Date().toISOString().split('T')[0],
          shift: ['morning', 'evening', 'night'][Math.floor(Math.random() * 3)],
          status: 'active',
          notes: `Assigned ${guard.full_name} to ${site.name}`
        };

        await db.insert(schema.site_guard_assignments).values(assignment);
        console.log(`✓ Assigned ${guard.employee_id} (${guard.full_name}) to site ${site.id} (${site.name})`);
      }
    }

    console.log('\n=== Verification ===');
    const allAssignments = await db.select().from(schema.site_guard_assignments);
    console.log(`Total assignments created: ${allAssignments.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createSampleAssignments();
