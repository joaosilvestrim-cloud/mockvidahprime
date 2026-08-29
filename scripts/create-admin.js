// Cria (ou atualiza) o usuário administrador via Auth Admin API.
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

const EMAIL = process.env.ADMIN_EMAIL || 'admin@vidahprime.com.br';
const PASS = process.env.ADMIN_PASSWORD || 'VidahPrime@2026';

(async () => {
  // procura usuário existente
  let userId = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users?.find(u => u.email === EMAIL);
  if (found) {
    userId = found.id;
    await admin.auth.admin.updateUserById(userId, { password: PASS, email_confirm: true });
    console.log('admin já existia, senha redefinida:', EMAIL);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL, password: PASS, email_confirm: true,
      user_metadata: { full_name: 'Administração Vidah Prime' },
    });
    if (error) { console.error('ERRO createUser', error.message); process.exit(1); }
    userId = data.user.id;
    console.log('admin criado:', EMAIL);
  }
  // garante profile admin/approved
  const { error: upErr } = await admin.from('profiles').upsert({
    id: userId, email: EMAIL, full_name: 'Administração Vidah Prime',
    role: 'admin', status: 'approved',
  }, { onConflict: 'id' });
  if (upErr) { console.error('ERRO profile', upErr.message); process.exit(1); }
  console.log('OK — admin pronto. login:', EMAIL, '| senha:', PASS);
})();
