require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(SURL, SVC, { auth: { persistSession: false } });

(async () => {
  const email = "storage." + Date.now() + "@gmail.com", pass = "Teste12345!";
  const { data: u } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true });
  const uid = u.user.id;
  const user = createClient(SURL, ANON, { auth: { persistSession: false } });
  await user.auth.signInWithPassword({ email, password: pass });

  const path = uid + "/personal.txt";
  const { error: up } = await user.storage.from("documents").upload(path, Buffer.from("doc de teste"), { upsert: true, contentType: "text/plain" });
  console.log("upload:", up ? "FALHOU: " + up.message : "OK");
  const { error: db } = await user.from("documents").upsert({ profile_id: uid, kind: "personal", storage_path: path }, { onConflict: "profile_id,kind" });
  console.log("registro documents:", db ? "FALHOU: " + db.message : "OK");
  const { data: signed } = await user.storage.from("documents").createSignedUrl(path, 60);
  console.log("signed url (dono):", signed?.signedUrl ? "OK" : "FALHOU");

  const other = createClient(SURL, ANON, { auth: { persistSession: false } });
  const e2 = "intruso." + Date.now() + "@gmail.com";
  const { data: u2 } = await admin.auth.admin.createUser({ email: e2, password: pass, email_confirm: true });
  await other.auth.signInWithPassword({ email: e2, password: pass });
  const { data: sother } = await other.storage.from("documents").createSignedUrl(path, 60);
  console.log("intruso acessa doc alheio:", sother?.signedUrl ? "FALHA DE SEGURANCA" : "BLOQUEADO (correto)");

  await admin.auth.admin.deleteUser(uid);
  await admin.auth.admin.deleteUser(u2.user.id);
  await admin.storage.from("documents").remove([path]);
  console.log("cleanup ok");
})();
