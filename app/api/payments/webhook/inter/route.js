import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Webhook do Inter: recebe a notificação quando um Pix é pago e marca o
// pagamento como recebido. Cadastre esta URL no Inter (registerPixWebhook):
//   https://SEU-DOMINIO/api/payments/webhook/inter?token=INTER_WEBHOOK_TOKEN
// Formato padrão Bacen: { pix: [ { txid, endToEndId, valor, horario } ] }
export async function POST(request) {
  // verificação simples por token na URL (além do mTLS do Inter)
  const token = new URL(request.url).searchParams.get("token");
  if (process.env.INTER_WEBHOOK_TOKEN && token !== process.env.INTER_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const list = Array.isArray(body?.pix) ? body.pix : [];
  if (list.length === 0) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  for (const pix of list) {
    const txid = pix?.txid;
    if (!txid) continue;
    const { data: pay } = await admin.from("payments").select("id,booking_id").eq("external_id", txid).maybeSingle();
    if (!pay) continue;
    await admin.from("payments").update({ status: "paid", paid_at: new Date().toISOString(), raw: pix }).eq("id", pay.id);
    if (pay.booking_id) await admin.from("bookings").update({ status: "confirmed" }).eq("id", pay.booking_id);
  }
  return NextResponse.json({ ok: true });
}
