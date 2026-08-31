import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { interConfigured, createPixCharge } from "@/lib/inter";

export const runtime = "nodejs";

// Gera a cobrança Pix de um pagamento pendente e devolve o copia-e-cola.
// Chamado pelo cliente logado após confirmar a reserva (quando a cobrança
// automática estiver ligada). Sem Inter configurado, responde 503.
export async function POST(request) {
  if (!interConfigured()) {
    return NextResponse.json({ error: "Cobrança automática ainda não configurada." }, { status: 503 });
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { payment_id } = await request.json().catch(() => ({}));
  // valida que o pagamento é do próprio usuário e está pendente (RLS)
  const { data: pay } = await supabase
    .from("payments").select("id,amount,status,external_id,pix_copia_cola,profile_id")
    .eq("id", payment_id).single();
  if (!pay || pay.profile_id !== user.id) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  if (pay.status === "paid") return NextResponse.json({ error: "Já está pago." }, { status: 409 });
  if (pay.pix_copia_cola) return NextResponse.json({ copiaECola: pay.pix_copia_cola }); // já gerado

  const { data: profile } = await supabase.from("profiles").select("full_name,cpf").eq("id", user.id).single();

  let charge;
  try {
    charge = await createPixCharge({ amount: pay.amount, cpf: profile?.cpf, name: profile?.full_name, message: "Reserva Vidah Prime" });
  } catch (e) {
    return NextResponse.json({ error: "Falha ao gerar o Pix. Tente novamente." }, { status: 502 });
  }

  // grava txid + copia-e-cola no pagamento (service role)
  const admin = createAdminClient();
  await admin.from("payments").update({ external_id: charge.txid, pix_copia_cola: charge.copiaECola, raw: charge.raw }).eq("id", pay.id);

  return NextResponse.json({ copiaECola: charge.copiaECola, txid: charge.txid });
}
