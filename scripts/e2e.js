// Teste de integração ponta a ponta contra o Supabase real.
require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL, SVC, { auth: { persistSession: false } });

const ok = (m) => console.log("  ✓", m);
const fail = (m, e) => { console.error("  ✗", m, e?.message || e || ""); process.exitCode = 1; };

(async () => {
  const email = `e2e.${Date.now()}@gmail.com`;
  const password = "Teste12345!";
  let userId;

  // 1. cria usuário confirmado (como /api/auth/signup)
  {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "E2E Teste" } });
    if (error) return fail("createUser", error);
    userId = data.user.id; ok("usuário criado + confirmado");
  }

  // cliente do "profissional"
  const user = createClient(URL, ANON, { auth: { persistSession: false } });
  {
    const { error } = await user.auth.signInWithPassword({ email, password });
    if (error) return fail("sign in user", error);
    ok("login do profissional");
  }

  // 2. atualiza perfil (RLS: dono)
  {
    const { error } = await user.from("profiles").update({ phone: "(15) 90000-0000", cpf: "000", council_type: "Estética", area: "Estética" }).eq("id", userId);
    if (error) return fail("update profile", error); ok("perfil atualizado (sem conselho obrigatório)");
  }

  // 3. envia cadastro (submit_registration → pending)
  {
    const { error } = await user.rpc("submit_registration", { p_hash: "HASH123", p_ip: "127.0.0.1" });
    if (error) return fail("submit_registration", error); ok("cadastro enviado (pending)");
  }

  // 4. tenta reservar SEM aprovação (deve falhar NOT_APPROVED)
  {
    const d = new Date(Date.now() + 5 * 864e5); d.setHours(9,0,0,0);
    const slots = [{ start: d.toISOString(), end: new Date(d.getTime()+36e5).toISOString() }];
    const { error } = await user.rpc("create_booking", { p_room: 1, p_use_mode: "avulso", p_payment: "pix", p_slots: slots });
    if (error && error.message === "NOT_APPROVED") ok("reserva bloqueada antes da aprovação (NOT_APPROVED)");
    else fail("deveria bloquear reserva sem aprovação", error || "sem erro");
  }

  // 5. admin aprova
  const adminUser = createClient(URL, ANON, { auth: { persistSession: false } });
  {
    const { error: le } = await adminUser.auth.signInWithPassword({ email: "admin@vidahprime.com.br", password: process.env.ADMIN_PASSWORD || "VidahPrime@2026" });
    if (le) return fail("login admin", le);
    const { error } = await adminUser.rpc("admin_set_status", { p_profile: userId, p_status: "approved" });
    if (error) return fail("admin_set_status approve", error); ok("admin aprovou o profissional");
  }

  // 6. cria reserva (aprovado)
  const d = new Date(Date.now() + 5 * 864e5); d.setHours(9,0,0,0);
  const slot = [{ start: d.toISOString(), end: new Date(d.getTime()+36e5).toISOString() }];
  let bookingId;
  {
    const { data, error } = await user.rpc("create_booking", { p_room: 1, p_use_mode: "avulso", p_payment: "pix", p_slots: slot });
    if (error) return fail("create_booking", error); bookingId = data; ok("reserva criada: " + data);
  }

  // 7. busy_ranges deve mostrar o horário ocupado (com limpeza)
  {
    const from = new Date(d); from.setHours(0,0,0,0);
    const to = new Date(d); to.setHours(23,59,59,0);
    const { data, error } = await user.rpc("busy_ranges", { p_room: 1, p_from: from.toISOString(), p_to: to.toISOString() });
    if (error) return fail("busy_ranges", error);
    if ((data||[]).length >= 1) ok(`busy_ranges retornou ${data.length} bloco(s) (reserva + limpeza)`);
    else fail("busy_ranges vazio", "");
  }

  // 8. conflito: mesma sala/horário → SLOT_CONFLICT
  {
    const { error } = await user.rpc("create_booking", { p_room: 1, p_use_mode: "avulso", p_payment: "pix", p_slots: slot });
    if (error && error.message === "SLOT_CONFLICT") ok("conflito de horário bloqueado (SLOT_CONFLICT)");
    else fail("deveria bloquear conflito", error || "sem erro");
  }

  // 9. cancelar (>48h → crédito)
  {
    const { data, error } = await user.rpc("cancel_booking", { p_booking: bookingId });
    if (error) return fail("cancel_booking", error);
    if (data?.credited) ok(`cancelamento gerou crédito de R$ ${data.amount} (>48h)`);
    else fail("deveria gerar crédito (>48h)", JSON.stringify(data));
  }

  // 10. após cancelar, horário livre de novo (nova reserva ok)
  {
    const { data, error } = await user.rpc("create_booking", { p_room: 1, p_use_mode: "flex", p_payment: "card", p_slots: slot });
    if (error) return fail("re-reserva após cancelar", error);
    ok("horário liberado após cancelamento; nova reserva ok");
    await user.rpc("cancel_booking", { p_booking: data });
  }

  // limpeza
  await admin.auth.admin.deleteUser(userId);
  ok("usuário de teste removido");
  console.log(process.exitCode ? "\nFALHOU" : "\nTODOS OS TESTES PASSARAM");
})();
