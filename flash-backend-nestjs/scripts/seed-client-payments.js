const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config();

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};

const clientKey = 'CLI-015';
const invoices = [
  { invoice_id: 'INV-CLI-015-001', amount: rand(25000, 60000), due_date: iso(addDays(7)), status: 'unpaid' },
  { invoice_id: 'INV-CLI-015-002', amount: rand(15000, 45000), due_date: iso(addDays(-5)), status: 'unpaid' },
  { invoice_id: 'INV-CLI-015-003', amount: rand(10000, 30000), due_date: iso(addDays(-20)), status: 'paid' },
];

const payments = [
  { invoice_id: 'INV-CLI-015-003', amount: rand(10000, 30000), payment_date: iso(addDays(-10)), payment_method: 'bank_transfer' },
];

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const inv of invoices) {
    await client.query(
      'insert into invoices (invoice_id, client_id, amount, due_date, status, created_at) values ($1,$2,$3,$4,$5,$6) on conflict (invoice_id) do nothing',
      [inv.invoice_id, clientKey, inv.amount, inv.due_date, inv.status, iso(addDays(-30))]
    );
  }

  for (const pay of payments) {
    await client.query(
      'insert into client_payments (client_id, invoice_id, amount, payment_date, payment_method, created_at) values ($1,$2,$3,$4,$5,$6)',
      [clientKey, pay.invoice_id, pay.amount, pay.payment_date, pay.payment_method, iso(addDays(-10))]
    );
  }

  await client.end();
  console.log('Inserted invoices/payments for', clientKey);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
