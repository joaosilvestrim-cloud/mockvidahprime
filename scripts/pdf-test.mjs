// Valida a geração do PDF do contrato (não usa a ZapSign, não gasta crédito).
import { readFileSync, writeFileSync } from "fs";
const { buildContractPdf } = await import("../lib/contractPdf.js");

const b64 = await buildContractPdf({
  full_name: "Dra. Ana Teste", email: "ana@exemplo.com", cpf: "123.456.789-00",
  council_type: "CRP", council_number: "06/123456", area: "Psicologia", phone: "(15) 99999-9999",
});
const buf = Buffer.from(b64, "base64");
writeFileSync("scripts/_contract-sample.pdf", buf);
const head = buf.slice(0, 5).toString("latin1");
console.log("PDF gerado:", buf.length, "bytes | header:", head, head === "%PDF-" ? "OK" : "INVALIDO");
