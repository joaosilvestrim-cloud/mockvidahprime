"use client";
import { useState, useRef, useEffect } from "react";
import { C, SH, F, Ic, btnPrimary } from "./brand";
import ViAvatar from "./ViAvatar";
import { WHATSAPP } from "@/lib/content";

const HELLO = "Oi! Eu sou a Vi, da Vidah Prime 🌿\n\nPosso te ajudar com as salas, valores, como reservar, o que está incluído e cancelamento. Como posso ajudar?";
const QUICK = ["Ver as salas", "Quanto custa?", "Como faço para reservar?", "Falar com a equipe"];

export default function Chat({ onReservar }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: HELLO }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [lead, setLead] = useState(0);
  const [nudge, setNudge] = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, open]);
  useEffect(() => {
    if (open) { setNudge(false); return; }
    const t = setTimeout(() => setNudge(true), 3500);
    const t2 = setTimeout(() => setNudge(false), 12000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [open]);

  const push = (role, content) => setMsgs((p) => [...p, { role, content }]);

  const startLead = () => { setLead(1); setTyping(false); push("assistant", "Claro! Vou te conectar com a equipe. Como é o seu nome? 😊"); };

  const send = async (direct = null) => {
    const u = (direct || input).trim();
    if (!u || typing) return;
    if (!direct) setInput("");
    push("user", u);

    // fluxo de captação (quando pediu falar com a equipe)
    if (lead === 1) { setLead(2); setTimeout(() => push("assistant", `Prazer, ${u.split(" ")[0]}! Qual o melhor e-mail pra equipe te retornar?`), 350); return; }
    if (lead === 2) { setLead(3); setTimeout(() => push("assistant", "Perfeito. Em uma frase, o que você procura? (ex.: 2 tardes por semana numa sala clínica)"), 350); return; }
    if (lead === 3) {
      setLead(4);
      setTimeout(() => push("assistant", "Tudo certo! ✅ Já avisei a equipe da Vidah Prime, logo entram em contato com você.\n\nSe quiser, você também pode falar direto no nosso WhatsApp. Ou já adiantar seu cadastro por aqui."), 400);
      return;
    }

    // cérebro da Vi
    setTyping(true);
    try {
      const history = [...msgs, { role: "user", content: u }].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/vi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const j = await res.json();
      setTyping(false);
      if (j.lead) { startLead(); return; }
      push("assistant", j.reply || "Desculpa, tive um probleminha aqui. Pode repetir? Ou fale com a gente no WhatsApp.");
    } catch {
      setTyping(false);
      push("assistant", "Ops, minha conexão falhou 😅 Tenta de novo, ou fale com a equipe pelo WhatsApp.");
    }
  };

  return (
    <>
      {!open && (
        <>
          {nudge && (
            <div onClick={() => setOpen(true)} style={{ position: "fixed", bottom: 96, right: 92, zIndex: 1000, background: "#fff", color: C.ink, padding: "12px 16px", borderRadius: "16px 16px 4px 16px", boxShadow: SH.lg, maxWidth: 220, fontSize: 13.5, cursor: "pointer", border: `1px solid ${C.line}`, animation: "viNudge 12s ease forwards" }}>
              <b>Oi! Sou a Vi</b> 👋<br />Posso te ajudar a reservar uma sala?
            </div>
          )}
          <button onClick={() => setOpen(true)} title="Falar com a Vi" className="vi-bob" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, width: 64, height: 64, borderRadius: "50%", border: "3px solid #fff", cursor: "pointer", boxShadow: "0 12px 32px rgba(69,37,110,0.4)", padding: 0, overflow: "hidden", background: "none" }}>
            <ViAvatar size={58} />
          </button>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 98, right: 30, zIndex: 999, width: 46, height: 46, borderRadius: "50%", background: "#25D366", cursor: "pointer", boxShadow: "0 8px 22px rgba(37,211,102,0.42)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Ic n="whatsapp" s={22} c="#fff" />
          </a>
        </>
      )}

      {open && (
        <div style={{ position: "fixed", bottom: full ? 0 : 20, right: full ? 0 : 20, zIndex: 1000, width: full ? "100vw" : 380, height: full ? "100dvh" : 580, background: "#fff", borderRadius: full ? 0 : 22, display: "flex", flexDirection: "column", boxShadow: SH.xl, overflow: "hidden", border: `1px solid ${C.line}` }}>
          <div style={{ background: `linear-gradient(140deg, ${C.plumDeep}, ${C.plum} 60%, ${C.teal})`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.5)", flexShrink: 0 }}><ViAvatar size={40} talking={typing} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Vi</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, background: "#7FE3D0", borderRadius: "50%" }} /><span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11.5 }}>Assistente da Vidah Prime</span></div>
            </div>
            <button onClick={() => setFull((f) => !f)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><Ic n={full ? "x" : "plus"} s={15} c="#fff" /></button>
            <button onClick={() => { setOpen(false); setFull(false); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><Ic n="x" s={15} c="#fff" /></button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: C.bg }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                {m.role === "assistant" && <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><ViAvatar size={30} /></div>}
                {m.role === "user" && <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic n="user" s={15} c="#fff" /></div>}
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? C.plum : "#fff", color: m.role === "user" ? "#fff" : C.ink, fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap", border: m.role === "user" ? "none" : `1px solid ${C.line}` }}>{m.content}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden" }}><ViAvatar size={30} talking /></div>
                <div className="vi-typing" style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: "4px 18px 18px 18px", padding: "12px 14px" }}><span /><span /><span /></div>
              </div>
            )}
            <div ref={end} />
          </div>

          {msgs.length === 1 && lead === 0 && (
            <div style={{ padding: "8px 14px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
              {QUICK.map((q) => <button key={q} onClick={() => send(q)} style={{ background: C.tealSoft, color: C.tealDeep, border: "none", borderRadius: 100, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{q}</button>)}
            </div>
          )}
          {lead === 4 && (
            <div style={{ padding: "8px 14px", display: "flex", gap: 8, borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ flex: 1, background: "#25D366", color: "#fff", borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}><Ic n="whatsapp" s={16} c="#fff" /> WhatsApp</a>
              <button onClick={() => { setOpen(false); onReservar && onReservar(); }} style={{ flex: 1, ...btnPrimary, padding: 10, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Meu cadastro <Ic n="arrowR" s={16} c="#fff" /></button>
            </div>
          )}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Escreva sua mensagem..." style={{ flex: 1, padding: "11px 14px", border: `1.5px solid ${C.line}`, borderRadius: 12, fontSize: 13.5, outline: "none", fontFamily: F.body }} />
            <button onClick={() => send()} disabled={!input.trim() || typing} style={{ background: input.trim() && !typing ? C.teal : C.line, border: "none", borderRadius: 12, padding: "0 15px", cursor: input.trim() && !typing ? "pointer" : "not-allowed", display: "flex", alignItems: "center" }}><Ic n="arrowR" s={18} c="#fff" /></button>
          </div>
        </div>
      )}
    </>
  );
}
