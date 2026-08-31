require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

(async () => {
  const adm = createClient(SURL, ANON, { auth: { persistSession: false } });
  const { error: le } = await adm.auth.signInWithPassword({ email: "admin@vidahprime.com.br", password: process.env.ADMIN_PASSWORD || "VidahPrime@2026" });
  if (le) return console.error("login admin FALHOU", le.message);

  // criar sala (id automático)
  const { data: created, error: ce } = await adm.from("rooms").insert({
    name: "Sala Teste CRUD", slug: "teste-crud-" + Date.now().toString(36), category: "Estética",
    description: "sala de teste", price_hour: 66, icon: "palette", accent: "#7B6FB0", available: true, specialties: [], sort: 99,
  }).select().single();
  console.log("criar sala:", ce ? "FALHOU " + ce.message : "OK (id " + created.id + ")");

  // editar
  const { error: ue } = await adm.from("rooms").update({ price_hour: 77, available: false }).eq("id", created.id);
  console.log("editar sala:", ue ? "FALHOU " + ue.message : "OK");

  // um profissional comum NÃO pode criar sala (RLS)
  const { createClient: cc } = require("@supabase/supabase-js");
  const svc = cc(SURL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const email = "roomintr." + Date.now() + "@gmail.com";
  const { data: u } = await svc.auth.admin.createUser({ email, password: "Teste12345!", email_confirm: true });
  await svc.from("profiles").update({ status: "approved" }).eq("id", u.user.id);
  const usr = cc(SURL, ANON, { auth: { persistSession: false } });
  await usr.auth.signInWithPassword({ email, password: "Teste12345!" });
  const { error: intr } = await usr.from("rooms").insert({ name: "hack", slug: "hack" + Date.now(), category: "x", price_hour: 1 });
  console.log("profissional cria sala:", intr ? "BLOQUEADO (correto)" : "FALHA DE SEGURANCA");

  // ajustes: admin altera setting
  const { error: se } = await adm.from("settings").upsert({ key: "cleaning_buffer_min", value: "20" }, { onConflict: "key" });
  const { data: s } = await adm.from("settings").select("value").eq("key", "cleaning_buffer_min").single();
  console.log("salvar ajuste:", se ? "FALHOU " + se.message : "OK (buffer=" + s.value + ")");
  // profissional NÃO altera settings
  const { error: sintr } = await usr.from("settings").upsert({ key: "cleaning_buffer_min", value: "0" }, { onConflict: "key" });
  console.log("profissional altera ajuste:", sintr ? "BLOQUEADO (correto)" : "FALHA DE SEGURANCA");

  // limpeza: volta buffer p/ 30, apaga sala e user de teste
  await adm.from("settings").upsert({ key: "cleaning_buffer_min", value: "30" }, { onConflict: "key" });
  const { error: de } = await adm.from("rooms").delete().eq("id", created.id);
  console.log("excluir sala (sem reservas):", de ? "FALHOU " + de.message : "OK");
  await svc.auth.admin.deleteUser(u.user.id);
  console.log("cleanup ok");
})();
