// Gera o PDF do contrato + regulamento oficiais (base64) com os dados do contratante.
// Usado como documento base enviado para assinatura na ZapSign.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONTRACT, REGULATION, ENTITY } from "./legal.js";

const A4 = [595.28, 841.89];
const M = 54;

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
  const draw = (text, { size = 9.5, f = font, color = ink, lh = 1.45, gap = 3 } = {}) => {
    const words = String(text || "").split(/\s+/);
    let cur = "";
    const flush = () => { ensure(size * lh); page.drawText(cur, { x: M, y, size, font: f, color }); y -= size * lh; cur = ""; };
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (f.widthOfTextAtSize(test, size) > width) { if (cur) flush(); cur = w; } else cur = test;
    }
    if (cur) flush();
    y -= gap;
  };
  const gap = (h = 8) => { y -= h; };

  // cabeçalho
  page.drawText("VIDAH PRIME", { x: M, y, size: 19, font: bold, color: plum }); y -= 15;
  draw("Espaço de saúde | Sorocaba/SP", { size: 9, color: soft, gap: 10 });

  // contrato
  draw(CONTRACT.title, { size: 12, f: bold, lh: 1.3, gap: 8 });
  for (const t of CONTRACT.intro) draw(t, { size: 9.5, gap: 4 });
  gap(4);
  for (const c of CONTRACT.clauses) {
    draw(c.t, { size: 10, f: bold, gap: 2 });
    for (const t of c.p) draw(t, { size: 9.5, gap: 3 });
    gap(5);
  }

  // regulamento
  page = pdf.addPage(A4); y = A4[1] - M;
  draw(REGULATION.title, { size: 12, f: bold, lh: 1.3, gap: 8 });
  for (const s of REGULATION.sections) {
    draw(s.t, { size: 10, f: bold, gap: 2 });
    for (const t of s.p) draw(t, { size: 9.5, gap: 3 });
    gap(5);
  }

  // qualificação do contratante
  gap(6);
  ensure(120);
  draw("QUALIFICAÇÃO DO CONTRATANTE", { size: 10, f: bold, color: plum, gap: 4 });
  const rows = [
    ["Nome", profile.full_name],
    ["CPF", profile.cpf],
    ["E-mail", profile.email],
    ["Telefone", profile.phone],
    ["Conselho / área", [profile.council_type, profile.council_number].filter(Boolean).join(" ")],
    ["Atuação", profile.area],
  ];
  for (const [k, v] of rows) { if (v) draw(`${k}: ${v}`, { size: 9.5, gap: 2 }); }

  gap(18);
  draw("Ao assinar eletronicamente, o CONTRATANTE declara ter lido e aceito integralmente o Contrato de Prestação de Serviços e o Regulamento Interno acima, reconhecendo sua validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).", { size: 9, color: soft, lh: 1.5, gap: 24 });
  ensure(46);
  page.drawLine({ start: { x: M, y }, end: { x: M + 250, y }, thickness: 0.8, color: soft });
  y -= 13;
  draw(profile.full_name || "CONTRATANTE", { size: 9.5, f: bold, gap: 1 });
  draw(`CONTRATANTE  |  CONTRATADA: ${ENTITY.name} (CNPJ ${ENTITY.cnpj})`, { size: 8, color: soft });

  const bytes = await pdf.save();
  return Buffer.from(bytes).toString("base64");
}
