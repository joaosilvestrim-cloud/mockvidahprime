require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(SURL, SVC, { auth: { persistSession: false } });

(async () => {
  // admin login
  const adm = createClient(SURL, ANON, { auth: { persistSession: false } });
  await adm.auth.signInWithPassword({ email: "admin@vidahprime.com.br", password: process.env.ADMIN_PASSWORD || "VidahPrime@2026" });

  const d = new Date(Date.now() + 6 * 864e5); d.setHours(10, 0, 0, 0);
  const start = d.toISOString(), end = new Date(d.getTime() + 36e5).toISOString();
  const { data: blk, error: be } = await adm.from("slot_blocks").insert({ room_id: 2, start_at: start, end_at: end, reason: "teste" }).select("id").single();
  console.log("admin fechou horário:", be ? "FALHOU " + be.message : "OK");

  // usuário aprovado tenta reservar o horário fechado
  const email = "blk." + Date.now() + "@gmail.com", pass = "Teste12345!";
  const { data: u } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true });
  await admin.from("profiles").update({ status: "approved", area: "Teste" }).eq("id", u.user.id);
  const user = createClient(SURL, ANON, { auth: { persistSession: false } });
  await user.auth.signInWithPassword({ email, password: pass });
  const { error } = await user.rpc("create_booking", { p_room: 2, p_use_mode: "avulso", p_payment: "pix", p_slots: [{ start, end }] });
  console.log("reserva em horário fechado:", error?.message === "SLOT_BLOCKED" ? "BLOQUEADA (correto)" : "FALHA: " + (error?.message || "reservou indevidamente"));

  // cleanup
  await adm.from("slot_blocks").delete().eq("id", blk.id);
  await admin.auth.admin.deleteUser(u.user.id);
  console.log("cleanup ok");
})();
