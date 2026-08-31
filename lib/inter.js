// ============================================================
// Integração Banco Inter — API Pix (cobrança imediata) + OAuth2 + mTLS.
// Pronto para plugar. Requer, nas variáveis de ambiente do Vercel:
//   INTER_CLIENT_ID        (Client Id da integração no Inter Empresas)
//   INTER_CLIENT_SECRET    (Client Secret)
//   INTER_CERT_BASE64      (certificado .crt em base64)   -> base64 -w0 cert.crt
//   INTER_KEY_BASE64       (chave privada .key em base64) -> base64 -w0 chave.key
//   INTER_PIX_KEY          (chave Pix da conta recebedora)
//   INTER_CONTA_CORRENTE   (opcional: número da conta, header x-conta-corrente)
//   INTER_ENV              (opcional: "sandbox" para homologação; senão produção)
// Docs: https://developers.inter.co/references/pix
// ============================================================
import { Agent } from "undici";

const BASE = process.env.INTER_ENV === "sandbox"
  ? "https://cdpj-sandbox.partners.uatinter.co"
  : "https://cdpj.partners.bancointer.com.br";

let tokenCache = { value: null, exp: 0 };

function readPem(base64Var, plainVar) {
  const b64 = process.env[base64Var];
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  return process.env[plainVar] || null;
}

export function interConfigured() {
  return !!(
    process.env.INTER_CLIENT_ID &&
    process.env.INTER_CLIENT_SECRET &&
    (process.env.INTER_CERT_BASE64 || process.env.INTER_CERT) &&
    (process.env.INTER_KEY_BASE64 || process.env.INTER_KEY) &&
    process.env.INTER_PIX_KEY
  );
}

function mtlsAgent() {
  const cert = readPem("INTER_CERT_BASE64", "INTER_CERT");
  const key = readPem("INTER_KEY_BASE64", "INTER_KEY");
  return new Agent({ connect: { cert, key } });
}

async function getToken(scope) {
  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;
  const body = new URLSearchParams({
    client_id: process.env.INTER_CLIENT_ID,
    client_secret: process.env.INTER_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope,
  });
  const res = await fetch(`${BASE}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    dispatcher: mtlsAgent(),
  });
  if (!res.ok) throw new Error(`Inter token ${res.status}: ${await res.text()}`);
  const j = await res.json();
  tokenCache = { value: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return j.access_token;
}

function authHeaders(token) {
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (process.env.INTER_CONTA_CORRENTE) h["x-conta-corrente"] = process.env.INTER_CONTA_CORRENTE;
  return h;
}

// Cria uma cobrança Pix imediata. Retorna { txid, copiaECola, raw }.
export async function createPixCharge({ amount, cpf, name, message, expiracao = 3600 }) {
  const token = await getToken("cob.write cob.read");
  const payload = {
    calendario: { expiracao },
    valor: { original: Number(amount).toFixed(2) },
    chave: process.env.INTER_PIX_KEY,
    solicitacaoPagador: message || "Reserva Vidah Prime",
  };
  const doc = (cpf || "").replace(/\D/g, "");
  if (doc) payload.devedor = { cpf: doc, nome: name || "Cliente" };

  const res = await fetch(`${BASE}/pix/v2/cob`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
    dispatcher: mtlsAgent(),
  });
  if (!res.ok) throw new Error(`Inter cob ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return { txid: j.txid, copiaECola: j.pixCopiaECola || null, raw: j };
}

// Consulta uma cobrança por txid (útil para conferência).
export async function getPixCharge(txid) {
  const token = await getToken("cob.read");
  const res = await fetch(`${BASE}/pix/v2/cob/${txid}`, {
    headers: authHeaders(token),
    dispatcher: mtlsAgent(),
  });
  if (!res.ok) throw new Error(`Inter get cob ${res.status}: ${await res.text()}`);
  return res.json();
}

// Cadastra o webhook de recebimento Pix (rodar uma vez após configurar).
export async function registerPixWebhook(url) {
  const token = await getToken("webhook.write");
  const res = await fetch(`${BASE}/pix/v2/webhook/${encodeURIComponent(process.env.INTER_PIX_KEY)}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ webhookUrl: url }),
    dispatcher: mtlsAgent(),
  });
  if (!res.ok) throw new Error(`Inter webhook ${res.status}: ${await res.text()}`);
  return true;
}
