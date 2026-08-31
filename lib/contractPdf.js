// Gera o PDF do contrato da Vidah Prime (base64) com os dados do contratante.
// Usado como documento base enviado para assinatura na ZapSign.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const TITLE = "CONTRATO DE LICENCA DE USO DE ESPACO E TERMO DE RESPONSABILIDADE";
const CLAUSES = [
  ["1. Objeto.", "Licenca temporaria e nao exclusiva de uso das salas da Vidah Prime, destinadas a atendimentos em saude, bem-estar e estetica."],
  ["2. Responsabilidade sanitaria e profissional.", "O CONTRATANTE se responsabiliza por manter regular sua situacao junto aos orgaos competentes e a vigilancia sanitaria para a sua atividade, isentando a Vidah Prime de responsabilidade por atos profissionais."],
  ["3. Responsabilidade civil.", "O CONTRATANTE responde civil e profissionalmente pelos servicos que presta a seus pacientes/clientes dentro do espaco."],
  ["4. Regras de uso.", "Reservas com antecedencia, respeito ao tempo de higienizacao entre atendimentos e as regras de cancelamento (48h)."],
  ["5. Cancelamento.", "Cancelamentos com +48h de antecedencia viram credito valido por 60 dias. Com -48h, o valor e considerado utilizado."],
  ["6. Validade juridica.", "As partes reconhecem a validade juridica da assinatura eletronica aposta neste instrumento, nos termos da MP 2.200-2/2001 e da Lei 14.063/2020."],
  ["7. Foro.", "Comarca de Sorocaba/SP."],
];

const A4 = [595.28, 841.89];
const M = 56;

export async function buildContractPdf(profile = {}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const plum = rgb(0.27, 0.145, 0.43);
  const ink = rgb(0.13, 0.13, 0.17);
  const soft = rgb(0.42, 0.42, 0.48);
  const width = A4[0] - M * 2;

  let page = pdf.addPage(A4);
  let y = A4[1] - M;

  const ensure = (h) => { if (y - h < M) { page = pdf.addPage(A4); y = A4[1] - M; } };
  const line = (text, { size = 10, f = font, color = ink, lh = 1.5 } = {}) => {
    const words = String(text || "").split(/\s+/);
    let cur = "";
    const flush = () => { ensure(size * lh); page.drawText(cur, { x: M, y, size, font: f, color }); y -= size * lh; cur = ""; };
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > width) { if (cur) flush(); cur = w; } else cur = test;
    }
    if (cur) flush();
  };
  const gap = (h = 8) => { y -= h; };

  // cabecalho
  page.drawText("VIDAH PRIME", { x: M, y, size: 20, font: bold, color: plum }); y -= 16;
  line("Espaco de saude | Sorocaba/SP", { size: 9.5, color: soft }); gap(14);
  line(TITLE, { size: 12.5, f: bold, color: ink, lh: 1.35 }); gap(14);

  // clausulas
  for (const [h, body] of CLAUSES) {
    line(h, { size: 10.5, f: bold });
    gap(2);
    line(body, { size: 10, lh: 1.55 });
    gap(9);
  }

  // dados do contratante
  gap(10);
  line("DADOS DO CONTRATANTE", { size: 10.5, f: bold, color: plum }); gap(4);
  const rows = [
    ["Nome", profile.full_name],
    ["CPF", profile.cpf],
    ["E-mail", profile.email],
    ["Telefone", profile.phone],
    ["Conselho / area", [profile.council_type, profile.council_number].filter(Boolean).join(" ")],
    ["Atuacao", profile.area],
  ];
  for (const [k, v] of rows) {
    if (!v) continue;
    line(`${k}: ${v}`, { size: 10, lh: 1.5 });
  }

  gap(22);
  line("Ao assinar eletronicamente, o CONTRATANTE declara ter lido e aceito integralmente as clausulas acima.", { size: 9.5, color: soft, lh: 1.55 });
  gap(30);
  ensure(40);
  page.drawLine({ start: { x: M, y }, end: { x: M + 240, y }, thickness: 0.8, color: soft });
  y -= 14;
  line(profile.full_name || "CONTRATANTE", { size: 10, f: bold });
  line("Assinatura do CONTRATANTE", { size: 8.5, color: soft });

  const bytes = await pdf.save();
  return Buffer.from(bytes).toString("base64");
}
