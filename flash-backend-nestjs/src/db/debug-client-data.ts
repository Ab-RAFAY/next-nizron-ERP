import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

async function checkClientData() {
  try {
    console.log('=== Checking Client Sites ===');
    const sites = await db.select().from(schema.client_sites).limit(5);
    console.log(`Found ${sites.length} client sites:`);
    console.log(JSON.stringify(sites, null, 2));

    console.log('\n=== Checking Site Guard Assignments ===');
    const assignments = await db.select().from(schema.site_guard_assignments).limit(10);
    console.log(`Found ${assignments.length} site guard assignments:`);
    console.log(JSON.stringify(assignments, null, 2));

    console.log('\n=== Checking Attendance Records ===');
    const attendance = await db.select().from(schema.attendance).limit(10);
    console.log(`Found ${attendance.length} attendance records:`);
    console.log(JSON.stringify(attendance, null, 2));

    console.log('\n=== Checking if any employee_ids match ===');
    if (assignments.length > 0 && attendance.length > 0) {
      const assignmentEmpIds = assignments.map(a => a.employee_id);
      const attendanceEmpIds = attendance.map(a => a.employee_id);
      console.log('Assignment employee IDs:', assignmentEmpIds);
      console.log('Attendance employee IDs:', attendanceEmpIds);
      
      const matches = assignmentEmpIds.filter(id => attendanceEmpIds.includes(id));
      console.log('Matching employee IDs:', matches);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkClientData();
