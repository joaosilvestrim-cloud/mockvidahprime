// Aplica um arquivo .sql no Postgres do Supabase (conexão direta).
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { Client } = require('pg');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('uso: node scripts/apply.js <arquivo.sql>'); process.exit(1); }
  const sql = fs.readFileSync(file, 'utf8');
  const c = new Client({
    host: process.env.PGHOST, port: +process.env.PGPORT,
    database: process.env.PGDATABASE, user: process.env.PGUSER, password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000,
  });
  try {
    await c.connect();
    await c.query('begin');
    await c.query(sql);
    await c.query('commit');
    console.log('APPLIED', file);
  } catch (e) {
    try { await c.query('rollback'); } catch {}
    console.error('ERROR', e.message);
    if (e.position) console.error('at position', e.position);
    process.exit(1);
  } finally { await c.end(); }
})();
