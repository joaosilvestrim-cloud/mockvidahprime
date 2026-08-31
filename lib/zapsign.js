// Cliente da API ZapSign (assinatura digital).
// Token fica só no servidor (ZAPSIGN_API_TOKEN). Nunca expor ao frontend.

const BASE = "https://api.zapsign.com.br/api/v1";

export function zapConfigured() {
  return !!process.env.ZAPSIGN_API_TOKEN;
}

async function zap(path, opts = {}) {
  const token = process.env.ZAPSIGN_API_TOKEN;
  if (!token) throw new Error("ZAPSIGN_NOT_CONFIGURED");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const m = json?.detail || json?.error || json?.message || json?.non_field_errors?.[0] || text || `HTTP ${res.status}`;
    const e = new Error(typeof m === "string" ? m : JSON.stringify(m));
    e.status = res.status;
    e.body = json;
    throw e;
  }
  return json;
}

// cria um documento a partir de um PDF (base64) com um único signatário
export async function createSignatureDoc({ name, base64Pdf, signer, externalId, sendEmail = false }) {
  const body = {
    name,
    base64_pdf: base64Pdf,
    external_id: externalId || undefined,
    lang: "pt-br",
    disable_signer_emails: !sendEmail,
    signers: [
      {
        name: signer.name,
        email: signer.email || undefined,
        auth_mode: "assinaturaTela",
        send_automatic_email: !!sendEmail,
        send_automatic_whatsapp: false,
      },
    ],
  };
  const doc = await zap("/docs/", { method: "POST", body: JSON.stringify(body) });
  const s0 = doc?.signers?.[0] || {};
  return {
    docToken: doc?.token,
    signerToken: s0?.token,
    signUrl: s0?.sign_url,
    status: doc?.status,
    raw: doc,
  };
}

// consulta o documento (status + link do PDF assinado)
export async function getSignatureDoc(docToken) {
  const doc = await zap(`/docs/${docToken}/`);
  return {
    status: doc?.status, // "pending" | "signed"
    signed: doc?.status === "signed",
    signedUrl: doc?.signed_file || doc?.signedFile || null,
    externalId: doc?.external_id || null,
    raw: doc,
  };
}
