"use client";
import { useState, useRef, useEffect } from "react";
import { C, SH, F, Ic, btnPrimary } from "./brand";
import { WHATSAPP } from "@/lib/content";

const HELLO = "Olá! Sou a Vi, assistente da Vidah Prime.\n\nPosso ajudar com salas, formas de uso, cadastro, cancelamento e pagamento. E se quiser, conecto você com a equipe.\n\nComo posso ajudar?";

function reply(u) {
  const t = u.toLowerCase();
  if (t.includes("sala")) return "Temos a Sala Clínica (com maca, para consultas, procedimentos e estética), a Sala Conecta (escuta e conexão), a Sala Odontológica (consultório completo) e a Sala Meeting (reuniões e palestras). Quer ver as salas?";
  if (/plano|preç|valor|period|flex|fixo|avuls/.test(t)) return "Você pode reservar de 3 jeitos: Hora Avulsa (paga o que usa), Período Flex (manhã ou tarde, sem dia fixo) e Período Fixo (mesmo dia e horário toda semana). O valor depende da sala.";
  if (/cadastr|document/.test(t)) return "O cadastro é único: você envia um documento que comprove sua atuação profissional (quando aplicável), comprovante de endereço e documento pessoal, assina o contrato uma vez e, após a aprovação, já pode reservar.";
  if (t.includes("cancel")) return "O valor não volta em dinheiro, vira crédito. Com mais de 48h de antecedência o crédito vale por até 60 dias. Com menos de 48h, o valor é considerado utilizado.";
  if (/pag|pix|cart/.test(t)) return "Aceitamos Pix e cartão de crédito. O pagamento é feito no momento da reserva e a confirmação sai na hora.";
  if (/quem|profiss|estetic|massot|podolog/.test(t)) return "A Vidah é para saúde, estética e bem-estar: médicos, dentistas, psicólogos, nutricionistas, fisioterapeutas, esteticistas, massoterapeutas, terapeutas e mais.";
  if (/humano|equipe|falar|atend/.test(t)) return "__LEAD__";
  return "Posso ajudar com salas, formas de uso, cadastro, cancelamento e pagamento. Se preferir, falo com a equipe pra você.";
}

export default function Chat({ onReservar }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: HELLO }]);
  const [input, setInput] = useState("");
  const [lead, setLead] = useState(0);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const push = (role, content) => setMsgs((p) => [...p, { role, content }]);
  const send = (direct = null) => {
    const u = (direct || input).trim();
    if (!u) return;
    if (!direct) setInput("");
    push("user", u);
    if (lead === 1) { setLead(2); setTimeout(() => push("assistant", `Prazer, ${u.split(" ")[0]}! Qual o melhor e-mail pra equipe te retornar?`), 400); return; }
    if (lead === 2) { setLead(3); setTimeout(() => push("assistant", "Perfeito. Em uma frase, o que você procura?"), 400); return; }
    if (lead === 3) {
      setLead(4);
      const score = Math.min(98, 60 + (u.length % 38));
      setTimeout(() => push("assistant", `Tudo certo! Encaminhei seu contato para a equipe da Vidah Prime.\n\nScore do profissional: ${score}/100\n\nEnquanto isso, quer adiantar seu cadastro?`), 500);
      return;
    }
    setTimeout(() => {
      const r = reply(u);
      if (r === "__LEAD__") { setLead(1); push("assistant", "Claro! Vou te conectar com a equipe. Qual seu nome?"); }
      else push("assistant", r);
    }, 450);
  };

  return (
    <>
      {!open && (
        <>
          <button onClick={() => setOpen(true)} title="Falar com a Vi" style={{position:"fixed",bottom:24,right:24,zIndex:1000,width:60,height:60,borderRadius:"50%",background:`linear-gradient(140deg, ${C.indigo}, ${C.navy})`,border:"none",cursor:"pointer",boxShadow:"0 12px 32px rgba(38,35,94,0.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic n="chat" s={26} c="#fff" />
          </button>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:96,right:24,zIndex:999,width:50,height:50,borderRadius:"50%",background:"#25D366",cursor:"pointer",boxShadow:"0 8px 22px rgba(37,211,102,0.42)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}>
            <Ic n="whatsapp" s={24} c="#fff" />
          </a>
        </>
      )}
      {open && (
        <div style={{position:"fixed",bottom:full?0:20,right:full?0:20,zIndex:1000,width:full?"100vw":370,height:full?"100dvh":560,background:"#fff",borderRadius:full?0:22,display:"flex",flexDirection:"column",boxShadow:SH.xl,overflow:"hidden",border:`1px solid ${C.line}`}}>
          <div style={{background:`linear-gradient(140deg, ${C.navyDeep}, ${C.indigo})`,padding:"15px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="chat" s={19} c="#fff"/></div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:700,fontSize:14}}>Vi · Assistente Vidah Prime</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,background:"#7FE3D0",borderRadius:"50%"}}/><span style={{color:"rgba(255,255,255,0.72)",fontSize:11}}>Tira dúvidas e conecta com a equipe</span></div>
            </div>
            <button onClick={()=>setFull(f=>!f)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:6,cursor:"pointer",display:"flex"}}><Ic n={full?"x":"plus"} s={15} c="#fff"/></button>
            <button onClick={()=>{setOpen(false);setFull(false);}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:6,cursor:"pointer",display:"flex"}}><Ic n="x" s={15} c="#fff"/></button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10,background:C.bg}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:m.role==="user"?C.coral:`linear-gradient(140deg,${C.indigo},${C.navy})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={m.role==="user"?"user":"chat"} s={15} c="#fff"/></div>
                <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"18px 4px 18px 18px":"4px 18px 18px 18px",background:m.role==="user"?C.indigo:"#fff",color:m.role==="user"?"#fff":C.ink,fontSize:13,lineHeight:1.65,whiteSpace:"pre-wrap",border:m.role==="user"?"none":`1px solid ${C.line}`}}>{m.content}</div>
              </div>
            ))}
            <div ref={end}/>
          </div>
          {msgs.length===1 && lead===0 && (
            <div style={{padding:"8px 14px",display:"flex",gap:6,flexWrap:"wrap",borderTop:`1px solid ${C.line}`,flexShrink:0}}>
              {["Ver salas","Formas de uso","Como me cadastro?","Falar com a equipe"].map(q=>(
                <button key={q} onClick={()=>send(q)} style={{background:C.tealSoft,color:C.tealDeep,border:"none",borderRadius:100,padding:"6px 12px",fontSize:11.5,fontWeight:600,cursor:"pointer"}}>{q}</button>
              ))}
            </div>
          )}
          {lead===4 && (
            <div style={{padding:"8px 14px",borderTop:`1px solid ${C.line}`,flexShrink:0}}>
              <button onClick={()=>{setOpen(false);onReservar&&onReservar();}} style={{width:"100%",...btnPrimary,padding:11,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Adiantar meu cadastro <Ic n="arrowR" s={16} c="#fff"/></button>
            </div>
          )}
          <div style={{padding:"10px 14px",borderTop:`1px solid ${C.line}`,display:"flex",gap:8,flexShrink:0}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Digite sua dúvida..." style={{flex:1,padding:"10px 13px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:13,outline:"none",fontFamily:F.body}}/>
            <button onClick={()=>send()} disabled={!input.trim()} style={{background:input.trim()?C.teal:C.line,border:"none",borderRadius:11,padding:"0 14px",cursor:input.trim()?"pointer":"not-allowed",display:"flex",alignItems:"center"}}><Ic n="arrowR" s={18} c="#fff"/></button>
          </div>
        </div>
      )}
    </>
  );
}
