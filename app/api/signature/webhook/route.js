import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignatureDoc } from "@/lib/zapsign";

export const runtime = "nodejs";

// Webhook da ZapSign: avisa quando o documento é assinado.
// Configure a URL na ZapSign como: https://SEU-DOMINIO/api/signature/webhook?token=<ZAPSIGN_WEBHOOK_TOKEN>
export async function POST(request) {
  const url = new URL(request.url);
  const expected = process.env.ZAPSIGN_WEBHOOK_TOKEN;
  if (expected && url.searchParams.get("token") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  // ZapSign envia o documento no corpo; campos podem vir aninhados
  const doc = body?.doc || body?.document || body;
  const docToken = doc?.token || body?.token;
  const profileId = doc?.external_id || body?.external_id;
  const status = doc?.status || body?.status;

  // só nos interessa o evento de assinatura concluída
  const isSigned = status === "signed" || /signed/i.test(body?.event_type || body?.status || "");
  if (!isSigned || !docToken) return NextResponse.json({ ok: true, ignored: true });

  let signedUrl = doc?.signed_file || null;
  try {
    if (!signedUrl) {
      const fresh = await getSignatureDoc(docToken);
      signedUrl = fresh.signedUrl;
    }
  } catch { /* segue mesmo sem o link do PDF */ }

  const admin = createAdminClient();
  const hash = String(docToken).slice(0, 24).toUpperCase();

  await admin
    .from("contracts")
    .update({ status: "signed", signed_url: signedUrl, hash })
    .eq("external_id", docToken);

  const pid = profileId || (
    await admin.from("contracts").select("profile_id").eq("external_id", docToken).maybeSingle()
  ).data?.profile_id;

  if (pid) {
    await admin
      .from("profiles")
      .update({ status: "pending", contract_signed_at: new Date().toISOString(), contract_hash: hash })
      .eq("id", pid)
      .in("status", ["incomplete", "rejected"]);
  }

  return NextResponse.json({ ok: true });
}
