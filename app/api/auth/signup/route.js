import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { email, password, full_name } = await request.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Dados inválidos. A senha precisa de 8+ caracteres." }, { status: 400 });
    }
    const admin = createAdminClient();

    // cria já confirmado (fluxo de cadastro em sessão única)
    const { data, error } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "" },
    });

    if (error) {
      const msg = /already registered|already been registered|exists/i.test(error.message)
        ? "Este e-mail já tem cadastro. Faça login."
        : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: data.user.id });
  } catch (e) {
    return NextResponse.json({ error: "Falha ao criar conta." }, { status: 500 });
  }
}
