import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignatureDoc } from "@/lib/zapsign";

export const runtime = "nodejs";

// Consulta a ZapSign se o documento já foi assinado. Se sim, finaliza o cadastro
// (perfil -> pending) via RPC sig_confirm, na própria sessão do usuário.
export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { docToken } = await request.json().catch(() => ({}));
  if (!docToken) return NextResponse.json({ error: "docToken ausente." }, { status: 400 });

  try {
    const doc = await getSignatureDoc(docToken);
    if (!doc.signed) return NextResponse.json({ signed: false, status: doc.status });

    const hash = String(docToken).slice(0, 24).toUpperCase();
    const { error } = await supabase.rpc("sig_confirm", {
      p_external: docToken,
      p_signed_url: doc.signedUrl,
      p_hash: hash,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ signed: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Falha ao consultar a assinatura." }, { status: 502 });
  }
}
