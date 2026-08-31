require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  const adm = createClient(SURL, ANON, { auth: { persistSession: false } });
  await adm.auth.signInWithPassword({ email: "admin@vidahprime.com.br", password: process.env.ADMIN_PASSWORD || "VidahPrime@2026" });

  const path = `covers/test-${Date.now()}.png`;
  const png = Buffer.from("89504e470d0a1a0a0000000d494844520000000100000001080600000" + "01f15c4890000000a49444154789c6360000002000154a24f6f0000000049454e44ae426082", "hex");
  const { error: up } = await adm.storage.from("rooms").upload(path, png, { contentType: "image/png", upsert: true });
  console.log("admin sobe foto:", up ? "FALHOU " + up.message : "OK");
  const { data: pub } = adm.storage.from("rooms").getPublicUrl(path);
  console.log("url publica:", pub.publicUrl.includes("/rooms/") ? "OK" : "?");

  // leitura pública sem login (fetch)
  const r = await fetch(pub.publicUrl);
  console.log("acesso publico da foto:", r.ok ? "OK (" + r.status + ")" : "FALHOU " + r.status);

  // profissional NÃO pode subir no bucket rooms
  const svc = createClient(SURL, SVC, { auth: { persistSession: false } });
  const email = "imgintr." + Date.now() + "@gmail.com";
  const { data: u } = await svc.auth.admin.createUser({ email, password: "Teste12345!", email_confirm: true });
  const usr = createClient(SURL, ANON, { auth: { persistSession: false } });
  await usr.auth.signInWithPassword({ email, password: "Teste12345!" });
  const { error: intr } = await usr.storage.from("rooms").upload(`covers/hack-${Date.now()}.png`, png, { contentType: "image/png" });
  console.log("profissional sobe foto:", intr ? "BLOQUEADO (correto)" : "FALHA DE SEGURANCA");

  // /api/payments/status seria configured:false (sem Inter) — checa a lógica:
  const configured = !!(process.env.INTER_CLIENT_ID && process.env.INTER_CLIENT_SECRET);
  console.log("inter configurado (esperado false):", configured);

  // cleanup
  await adm.storage.from("rooms").remove([path]);
  await svc.auth.admin.deleteUser(u.user.id);
  console.log("cleanup ok");
})();
