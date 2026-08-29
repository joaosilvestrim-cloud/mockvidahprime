require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(SURL, SVC, { auth: { persistSession: false } });

(async () => {
  const email = "fixo." + Date.now() + "@gmail.com", pass = "Teste12345!";
  const { data: u } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true });
  await admin.from("profiles").update({ status: "approved", area: "Teste" }).eq("id", u.user.id);
  const user = createClient(SURL, ANON, { auth: { persistSession: false } });
  await user.auth.signInWithPassword({ email, password: pass });

  // fixo: sala 3 (R$40/h), 1 hora, 4 semanas
  const base = new Date(Date.now() + 5 * 864e5); base.setHours(15, 0, 0, 0);
  const slots = [0,7,14,21].map(off => {
    const s = new Date(base); s.setDate(s.getDate()+off);
    return { start: s.toISOString(), end: new Date(s.getTime()+36e5).toISOString() };
  });
  const { data: bid, error } = await user.rpc("create_booking", { p_room: 3, p_use_mode: "fixo", p_payment: "pix", p_slots: slots });
  console.log("reserva fixo:", error ? "FALHOU " + error.message : "OK");

  const { data: b } = await user.from("bookings").select("total,booking_slots(id)").eq("id", bid).single();
  console.log("total (esperado 160 = 40*4):", b?.total, b?.total == 160 ? "OK" : "ERRO");
  console.log("slots criados (esperado 4):", (b?.booking_slots||[]).length, (b?.booking_slots||[]).length === 4 ? "OK" : "ERRO");

  // semana seguinte deve estar ocupada
  const wk2s = new Date(base); wk2s.setDate(wk2s.getDate()+7);
  const from = new Date(wk2s); from.setHours(0,0,0,0);
  const to = new Date(wk2s); to.setHours(23,59,59,0);
  const { data: busy } = await user.rpc("busy_ranges", { p_room: 3, p_from: from.toISOString(), p_to: to.toISOString() });
  console.log("semana 2 ocupada:", (busy||[]).length >= 1 ? "OK" : "ERRO");

  await user.rpc("cancel_booking", { p_booking: bid });
  await admin.auth.admin.deleteUser(u.user.id);
  console.log("cleanup ok");
})();
