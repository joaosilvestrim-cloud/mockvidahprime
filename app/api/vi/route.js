import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const money = (n) => "R$ " + Number(n || 0).toFixed(2).replace(".", ",");

function buildSystemPrompt(rooms) {
  const salas = (rooms || []).filter(r => r.available)
    .map(r => `- ${r.name} (${r.category}): ${money(r.price_hour)}/hora — ${r.description || ""}`).join("\n");
  const min = rooms?.length ? Math.min(...rooms.filter(r => r.available).map(r => Number(r.price_hour))) : 40;
  return `Você é a Vi, a assistente virtual da Vidah Prime — um coworking para profissionais de saúde, bem-estar e estética em Sorocaba/SP (Av. General Osório, 736).

Como você fala:
- Calorosa, acolhedora, gentil e objetiva. Trata a pessoa por "você".
- Respostas curtas (2 a 4 frases). Sem termos técnicos. Como uma recepcionista simpática.
- Pode usar no máximo 1 emoji ocasional. Sempre em português do Brasil.

O que você sabe (use só estas informações; nunca invente preços ou regras):

SALAS DISPONÍVEIS (a partir de ${money(min)}/hora):
${salas || "- (consultar equipe)"}

FORMAS DE USO:
- Hora Avulsa: paga só as horas que usar, sem mensalidade. Bom para atendimentos pontuais.
- Período Flex: escolhe manhã ou tarde, sem precisar de um dia fixo da semana.
- Período Fixo: reserva o mesmo dia e horário toda semana (cobrado por mês).

COMO FUNCIONA:
- Antes da primeira reserva, faz um cadastro único: envia documento profissional (quando aplicável), comprovante de endereço e documento pessoal, e assina o contrato uma vez. A equipe aprova e libera o acesso.
- Depois de aprovado, é só escolher a sala, o dia e o horário e pagar.

O QUE ESTÁ INCLUÍDO NA RESERVA:
- Recepcionista para acolher os pacientes, sala de espera com TV e música, café, água e chá, ar-condicionado, internet, limpeza e manutenção, e central de esterilização conforme a sala. Estacionamento próprio.

PAGAMENTO:
- Pix ou cartão de crédito, no momento da reserva.

CANCELAMENTO:
- O valor não volta em dinheiro, vira crédito. Com mais de 48h de antecedência, o crédito vale por até 60 dias. Com menos de 48h, o valor é considerado utilizado.

HIGIENIZAÇÃO:
- Entre um atendimento e outro, a sala fica um tempo bloqueada para limpeza e preparo.

QUEM PODE USAR:
- Saúde, estética e bem-estar: médicos, dentistas, psicólogos, nutricionistas, fisioterapeutas, fonoaudiólogos, esteticistas, massoterapeutas, terapeutas e mais. Cada pessoa mantém autonomia sobre seus atendimentos e pacientes.

CONTATO:
- WhatsApp (15) 99741-8555 e e-mail contato@vidahprime.com.br.

Regras de comportamento:
- Se pedirem para reservar, oriente: "É só clicar em Reservar aqui no site. Antes da primeira reserva a gente faz um cadastrinho rápido."
- Se for algo que você não sabe ou fora do assunto, seja gentil e ofereça falar com a equipe pelo WhatsApp.
- Nunca peça senha, CPF completo ou dados de cartão no chat.
- Se a pessoa demonstrar interesse em conhecer/visitar, incentive e ofereça agendar uma visita com a equipe.`;
}

// resposta esperta sem IA (fallback), já usando os preços reais
function fallback(message, rooms) {
  const t = (message || "").toLowerCase();
  const min = rooms?.length ? Math.min(...rooms.filter(r => r.available).map(r => Number(r.price_hour))) : 40;
  if (/humano|equipe|falar com|atendente/.test(t)) return "__LEAD__";
  if (/oi|olá|ola|bom dia|boa tarde|boa noite/.test(t) && t.length < 20) return "Oi! Que bom te ver por aqui 🌿 Posso te ajudar com as salas, como reservar, valores ou o que está incluído. O que você procura?";
  if (/sala/.test(t)) return `Temos a Sala Clínica (com maca), a Sala Conecta (escuta e conexão), a Sala Odontológica (consultório completo) e a Sala Meeting (reuniões e palestras). Os valores começam em ${money(min)}/hora. Quer ver as salas no site?`;
  if (/preç|preco|valor|quanto/.test(t)) return `Os valores dependem da sala e começam em ${money(min)}/hora. Você pode usar por Hora Avulsa, Período Flex (manhã ou tarde) ou Período Fixo (semanal). Quer que eu te explique cada um?`;
  if (/reserv|agend|alug/.test(t)) return "É só clicar em Reservar aqui no site. Antes da primeira reserva a gente faz um cadastrinho rápido (documentos e contrato, uma vez só). Depois de aprovado, você reserva quando quiser 🙂";
  if (/cadastr|document/.test(t)) return "O cadastro é único: você envia um documento que comprove sua atuação (quando aplicável), comprovante de endereço e documento pessoal, e assina o contrato uma vez. A equipe aprova e libera seu acesso.";
  if (/cancel/.test(t)) return "Sem problema. O valor vira crédito: com mais de 48h de antecedência ele vale por até 60 dias; com menos de 48h, é considerado utilizado.";
  if (/inclu|café|cafe|recep|espera|estrutura|estacion/.test(t)) return "A reserva já inclui recepcionista para seus pacientes, sala de espera com TV e música, café, água, ar-condicionado, internet, limpeza e estacionamento próprio. Você só se preocupa com o atendimento 💙";
  if (/pag|pix|cart/.test(t)) return "O pagamento é por Pix ou cartão de crédito, na hora da reserva.";
  if (/visit|conhecer/.test(t)) return "Vai ser um prazer te receber! Você pode agendar uma visita para conhecer o espaço antes de reservar. Quer que eu chame a equipe pra marcar?";
  if (/quem|profiss|estetic|massot|podolog|posso/.test(t)) return "A Vidah é para saúde, estética e bem-estar: médicos, dentistas, psicólogos, nutricionistas, fisioterapeutas, esteticistas, massoterapeutas, terapeutas e mais. Você mantém total autonomia sobre seus atendimentos.";
  return "Posso te ajudar com as salas, valores, como reservar, o que está incluído e cancelamento. Se preferir, chamo a equipe pra você. O que faz mais sentido agora?";
}

async function callLLM(system, messages) {
  // Groq / OpenAI (mesma API). Prioriza Groq (gratuito e rápido).
  const groq = process.env.GROQ_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;

  if (groq || openai) {
    const base = groq ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1";
    const key = groq || openai;
    const model = groq ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile") : (process.env.OPENAI_MODEL || "gpt-4o-mini");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.5, max_tokens: 400, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!res.ok) throw new Error("LLM " + res.status);
    const j = await res.json();
    return j.choices?.[0]?.message?.content?.trim() || null;
  }
  if (anthropic) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropic, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest", max_tokens: 400, system, messages }),
    });
    if (!res.ok) throw new Error("Anthropic " + res.status);
    const j = await res.json();
    return j.content?.[0]?.text?.trim() || null;
  }
  return null; // sem IA configurada
}

export async function POST(request) {
  const { messages } = await request.json().catch(() => ({ messages: [] }));
  const history = Array.isArray(messages) ? messages.slice(-10) : [];
  const last = [...history].reverse().find(m => m.role === "user")?.content || "";

  const supabase = createClient();
  const { data: rooms } = await supabase.from("rooms").select("name,category,description,price_hour,available").order("sort");

  // pedido explícito de falar com a equipe → dispara captação de lead no cliente
  if (/humano|equipe|falar com|atendente|whats/.test((last || "").toLowerCase())) {
    return NextResponse.json({ reply: null, lead: true });
  }

  try {
    const system = buildSystemPrompt(rooms);
    const reply = await callLLM(system, history);
    if (reply) return NextResponse.json({ reply, ai: true });
  } catch (e) {
    // cai no fallback
  }
  const fb = fallback(last, rooms);
  if (fb === "__LEAD__") return NextResponse.json({ reply: null, lead: true });
  return NextResponse.json({ reply: fb, ai: false });
}
