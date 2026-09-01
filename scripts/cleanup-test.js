// Remove um usuário de teste (auth.users -> cascata para profiles).
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

(async () => {
  const email = process.argv[2];
  if (!email) { console.error('uso: node scripts/cleanup-test.js <email>'); process.exit(1); }
  const c = new Client({
    host: process.env.PGHOST, port: +process.env.PGPORT,
    database: process.env.PGDATABASE, user: process.env.PGUSER, password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000,
  });
  await c.connect();
  const r = await c.query('delete from auth.users where email = $1', [email.toLowerCase()]);
  console.log('removidos:', r.rowCount, 'usuario(s) com email', email);
  await c.end();
})();
