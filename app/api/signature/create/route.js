import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { zapConfigured, createSignatureDoc } from "@/lib/zapsign";
import { buildContractPdf } from "@/lib/contractPdf";

export const runtime = "nodejs";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // sem plataforma configurada: front usa o aceite simples como fallback
  if (!zapConfigured()) return NextResponse.json({ mode: "local" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, cpf, council_type, council_number, area")
    .eq("id", user.id)
    .single();

  const p = { ...(profile || {}), email: profile?.email || user.email };
  if (!p.full_name) return NextResponse.json({ error: "Complete seu nome antes de assinar." }, { status: 400 });

  const ua = request.headers.get("user-agent") || "";

  try {
    const base64Pdf = await buildContractPdf(p);
    const doc = await createSignatureDoc({
      name: `Contrato Vidah Prime - ${p.full_name}`,
      base64Pdf,
      signer: { name: p.full_name, email: p.email },
      externalId: user.id,
      sendEmail: true, // ZapSign também envia o link por e-mail (rede de segurança)
    });
    if (!doc.signUrl) return NextResponse.json({ error: "ZapSign não retornou o link de assinatura." }, { status: 502 });

    const { error: rpcErr } = await supabase.rpc("sig_start", {
      p_external: doc.docToken,
      p_sign_url: doc.signUrl,
      p_ua: ua,
    });
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 400 });

    return NextResponse.json({ mode: "zapsign", signUrl: doc.signUrl, docToken: doc.docToken });
  } catch (e) {
    // ZapSign indisponível ou sem Plano de API: não bloqueia o cadastro,
    // cai no aceite eletrônico interno (também com validade jurídica).
    console.error("[signature/create] fallback para aceite interno:", e.message);
    return NextResponse.json({ mode: "local", fallback: true });
  }
}
