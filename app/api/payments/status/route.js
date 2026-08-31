import { NextResponse } from "next/server";
import { interConfigured } from "@/lib/inter";

export const runtime = "nodejs";

// Diz ao painel se a integração do Inter já está configurada (sem expor segredos).
export async function GET() {
  return NextResponse.json({
    provider: "inter",
    configured: interConfigured(),
    canAutomate: interConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
