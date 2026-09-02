"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, Ic, btnPrimary, btnGhost } from "./brand";
import { CONTRACT, REGULATION } from "@/lib/legal";

const COUNCILS = ["CRP","CRM","CRO","CRN","CREFITO","CRFa","Estética","Bem-estar","Outro"];
const DOCS = [
  { k:"professional", l:"Documento profissional", d:"Carteira do conselho ou diploma/certificado (quando aplicável)", required:false },
  { k:"address", l:"Comprovante de endereço", d:"Últimos 90 dias", required:true },
  { k:"personal", l:"Documento pessoal", d:"RG ou CNH", required:true },
];
const STEPS = ["Criar conta","Dados e atuação","Documentos","Contrato","Análise"];

export default function Onboarding({ initial }) {
  const router = useRouter();
  const supabase = createClient();
  const loggedIn = !!initial;
  const [step, setStep] = useState(loggedIn ? 1 : 0);
  const [uid, setUid] = useState(initial?.id || null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: initial?.full_name || "", email: initial?.email || "", password: "",
    phone: initial?.phone || "", cpf: initial?.cpf || "",
    councilType: initial?.council_type || "CRP", councilNumber: initial?.council_number || "",
    area: initial?.area || "", accept: false,
  });
  const [docs, setDocs] = useState({ professional:false, address:false, personal:false });
  const [docNames, setDocNames] = useState({});
  const [signPhase, setSignPhase] = useState("idle"); // idle | signing | local
  const [sig, setSig] = useState({ signUrl:null, docToken:null });
  const fileRefs = { professional: useRef(), address: useRef(), personal: useRef() };
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = { width:"100%",padding:"12px 14px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:14,fontFamily:F.body,boxSizing:"border-box" };

  // STEP 0 — cria conta e entra (chave pública; e-mail auto-confirmado no banco)
  const createAccount = async () => {
    setErr("");
    if (!form.full_name || !form.email || form.password.length < 8) { setErr("Preencha nome, e-mail e uma senha de 8+ caracteres."); return; }
    setBusy(true);
    const email = form.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email, password: form.password, options: { data: { full_name: form.full_name } },
    });
    if (error) {
      setBusy(false);
      setErr(/registered|already|exists/i.test(error.message) ? "Este e-mail já tem cadastro. Faça login." : error.message);
      return;
    }
    if (!data.session) {
      const { error: le } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (le) { setBusy(false); setErr(le.message); return; }
    }
    const { data: { user } } = await supabase.auth.getUser();
    setUid(user?.id || null);
    setBusy(false); setStep(1);
  };

  // STEP 1 — salva dados/atuação
  const saveData = async () => {
    setErr("");
    if (!form.area) { setErr("Informe sua área de atuação."); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, cpf: form.cpf,
      council_type: form.councilType, council_number: form.councilNumber || null, area: form.area,
    }).eq("id", uid);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setStep(2);
  };

  // STEP 2 — upload de documentos
  const upload = async (kind, file) => {
    if (!file) return;
    setErr("");
    setBusy(true);
    const ext = (file.name.split(".").pop() || "dat").toLowerCase();
    const path = `${uid}/${kind}.${ext}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    if (upErr) { setBusy(false); setErr("Falha no upload: " + upErr.message); return; }
    const { error: dbErr } = await supabase.from("documents").upsert(
      { profile_id: uid, kind, storage_path: path }, { onConflict: "profile_id,kind" }
    );
    setBusy(false);
    if (dbErr) { setErr(dbErr.message); return; }
    setDocs(d => ({ ...d, [kind]: true }));
    setDocNames(n => ({ ...n, [kind]: file.name }));
  };
  const docsOk = docs.address && docs.personal;

  // STEP 3 — assinatura digital (ZapSign) com fallback para aceite simples
  const startSign = async () => {
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/signature/create", { method: "POST" });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) { setErr(j.error || "Falha ao iniciar a assinatura."); return; }
      if (j.mode === "local") { setSignPhase("local"); return; }
      setSig({ signUrl: j.signUrl, docToken: j.docToken });
      setSignPhase("signing");
      try { window.open(j.signUrl, "_blank", "noopener"); } catch {}
    } catch { setBusy(false); setErr("Sem conexão. Tente de novo."); }
  };

  const confirmSigned = async () => {
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/signature/status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docToken: sig.docToken }),
      });
      const j = await res.json();
      setBusy(false);
      if (!res.ok) { setErr(j.error || "Falha ao confirmar a assinatura."); return; }
      if (j.signed) { setStep(4); return; }
      setErr("Ainda não recebemos sua assinatura. Assine na aba aberta e clique de novo aqui.");
    } catch { setBusy(false); setErr("Sem conexão. Tente de novo."); }
  };

  const localSubmit = async () => {
    setErr("");
    if (!form.accept) { setErr("É preciso aceitar o contrato."); return; }
    setBusy(true);
    const hash = (Math.random().toString(36).slice(2) + Date.now().toString(36)).toUpperCase();
    const res = await fetch("/api/register/submit", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(j.error || "Falha ao enviar."); return; }
    setStep(4);
  };

  return (
    <div style={{minHeight:"calc(100vh - 64px)",background:C.bg,paddingBottom:40}}>
      {/* progresso */}
      <div style={{background:"#fff",padding:"18px 22px",borderBottom:`1px solid ${C.line}`,position:"sticky",top:64,zIndex:40}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:C.teal,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Cadastro único</div>
              <h1 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink}}>{STEPS[Math.min(step,4)]}</h1>
            </div>
          </div>
          <div style={{display:"flex",gap:5}}>
            {STEPS.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:4,background:i<=Math.min(step,4)?C.teal:C.line,transition:"background .3s"}}/>)}
          </div>
        </div>
      </div>

      <div style={{maxWidth:640,margin:"0 auto",padding:"26px 20px"}}>
        {step<4 && (
          <div style={{background:C.tealSoft,borderRadius:14,padding:"14px 18px",marginBottom:22,display:"flex",gap:12,alignItems:"flex-start"}}>
            <Ic n="shield" s={22} c={C.tealDeep} style={{flexShrink:0,marginTop:1}}/>
            <div style={{fontSize:13.5,color:C.tealDeep,lineHeight:1.6}}>Precisamos conhecer você antes da primeira reserva. Conferimos seus dados e você assina o contrato uma única vez. Depois é só reservar.</div>
          </div>
        )}

        <div style={{background:"#fff",borderRadius:20,padding:26,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
          {step===0 && (
            <div style={{display:"grid",gap:16}}>
              <Field label="Nome completo"><input value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Dr(a). João Silva" style={inputStyle}/></Field>
              <Field label="E-mail"><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="voce@email.com" style={inputStyle}/></Field>
              <Field label="Senha (mín. 8 caracteres)"><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="••••••••" style={inputStyle}/></Field>
            </div>
          )}

          {step===1 && (
            <div style={{display:"grid",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Field label="WhatsApp"><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="(15) 99999-9999" style={inputStyle}/></Field>
                <Field label="CPF"><input value={form.cpf} onChange={e=>set("cpf",e.target.value)} placeholder="000.000.000-00" style={inputStyle}/></Field>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"150px 1fr",gap:14}}>
                <Field label="Conselho / área">
                  <select value={form.councilType} onChange={e=>set("councilType",e.target.value)} style={{...inputStyle,background:"#fff"}}>
                    {COUNCILS.map(o=><option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label={<>Número do registro <span style={{color:C.faint,fontWeight:400}}>(quando aplicável)</span></>}>
                  <input value={form.councilNumber} onChange={e=>set("councilNumber",e.target.value)} placeholder="Ex.: 06/123456" style={inputStyle}/>
                </Field>
              </div>
              <Field label="Área de atuação"><input value={form.area} onChange={e=>set("area",e.target.value)} placeholder="Ex.: Nutrição, Psicologia, Estética..." style={inputStyle}/></Field>
              <div style={{fontSize:12.5,color:C.slate,display:"flex",gap:8,alignItems:"center"}}><Ic n="searchCheck" s={17} c={C.teal}/> Conferimos seus dados e documentos antes de liberar o acesso.</div>
            </div>
          )}

          {step===2 && (
            <div>
              <p style={{color:C.slate,fontSize:14,marginBottom:20}}>Envie seus documentos. Ficam guardados com segurança e são usados só para conferência.</p>
              {DOCS.map(({k,l,d})=>(
                <div key={k}>
                  <input ref={fileRefs[k]} type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>upload(k, e.target.files?.[0])}/>
                  <div onClick={()=>fileRefs[k].current?.click()} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",border:`1.5px solid ${docs[k]?C.teal:C.line}`,borderRadius:14,marginBottom:12,cursor:"pointer",background:docs[k]?C.tealSoft:"#fff"}}>
                    <div style={{width:44,height:44,borderRadius:12,background:docs[k]?C.teal:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={docs[k]?"check":"upload"} s={20} c={docs[k]?"#fff":C.slate}/></div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,color:C.ink,fontSize:14}}>{l}</div>
                      <div style={{color:C.slate,fontSize:12.5}}>{docNames[k] || d}</div>
                    </div>
                    <span style={{fontSize:12.5,color:docs[k]?C.tealDeep:C.teal,fontWeight:600}}>{docs[k]?"Enviado":"Enviar"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step===3 && (
            <div>
              <h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink,marginBottom:6}}>Contrato e regulamento</h3>
              <p style={{color:C.slate,fontSize:13.5,marginBottom:16}}>Assinado uma única vez. Vale para todas as suas reservas futuras. Role para ler o contrato e o regulamento interno.</p>
              <div style={{border:`1px solid ${C.line}`,borderRadius:12,padding:20,height:260,overflowY:"auto",fontSize:12,lineHeight:1.7,color:C.ink,background:C.bg}}>
                <p style={{fontWeight:700,fontSize:12.5,marginBottom:10,color:C.plum}}>{CONTRACT.title}</p>
                {CONTRACT.intro.map((t,i)=><p key={"ci"+i} style={{marginBottom:7}}>{t}</p>)}
                {CONTRACT.clauses.map((c,i)=>(
                  <div key={"cl"+i} style={{marginTop:10}}>
                    <p style={{fontWeight:700,marginBottom:4}}>{c.t}</p>
                    {c.p.map((t,j)=><p key={j} style={{marginBottom:5}}>{t}</p>)}
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${C.line}`,margin:"18px 0"}}/>
                <p style={{fontWeight:700,fontSize:12.5,marginBottom:10,color:C.plum}}>{REGULATION.title}</p>
                {REGULATION.sections.map((s,i)=>(
                  <div key={"rg"+i} style={{marginTop:10}}>
                    <p style={{fontWeight:700,marginBottom:4}}>{s.t}</p>
                    {s.p.map((t,j)=><p key={j} style={{marginBottom:5}}>{t}</p>)}
                  </div>
                ))}
              </div>
              {signPhase==="signing" ? (
                <div style={{marginTop:18}}>
                  <div style={{background:C.tealSoft,borderRadius:12,padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
                    <Ic n="shield" s={20} c={C.tealDeep} style={{flexShrink:0,marginTop:1}}/>
                    <div style={{fontSize:13,color:C.tealDeep,lineHeight:1.6}}>Sua assinatura abriu em outra aba, pela ZapSign. Assine por lá e volte aqui. Também enviamos o link para o seu e-mail.</div>
                  </div>
                  <div style={{border:`1px solid ${C.line}`,borderRadius:12,overflow:"hidden",height:440,background:C.bg}}>
                    <iframe src={sig.signUrl} title="Assinatura digital" style={{width:"100%",height:"100%",border:"none"}} allow="camera"/>
                  </div>
                  <a href={sig.signUrl} target="_blank" rel="noreferrer" style={{...btnGhost,marginTop:10,padding:"10px 16px",fontSize:13,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:7}}>Abrir assinatura em nova aba <Ic n="arrowR" s={15} c={C.ink}/></a>
                </div>
              ) : signPhase==="local" ? (
                <label style={{display:"flex",gap:12,alignItems:"flex-start",marginTop:18,cursor:"pointer"}}>
                  <input type="checkbox" checked={form.accept} onChange={e=>set("accept",e.target.checked)} style={{marginTop:3,width:18,height:18,accentColor:C.teal}}/>
                  <span style={{fontSize:13,color:C.ink,lineHeight:1.6}}>Li e aceito o <b>Contrato de Prestação de Serviços</b> e o <b>Regulamento Interno</b> da Vidah Prime. Assino eletronicamente e reconheço a validade jurídica deste aceite (MP 2.200-2/2001 e Lei 14.063/2020).</span>
                </label>
              ) : (
                <div style={{marginTop:18,display:"flex",gap:10,alignItems:"center",background:C.lilacSoft,borderRadius:12,padding:"13px 16px"}}>
                  <Ic n="shield" s={20} c={C.indigo} style={{flexShrink:0}}/>
                  <div style={{fontSize:13,color:C.ink,lineHeight:1.55}}>Você vai assinar o contrato digitalmente pela <b>ZapSign</b>. Assinatura com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).</div>
                </div>
              )}
            </div>
          )}

          {step===4 && (
            <div style={{textAlign:"center",padding:"14px 6px"}}>
              <div style={{width:74,height:74,borderRadius:"50%",background:C.lilacSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n="searchCheck" s={36} c={C.indigo}/></div>
              <h2 style={{fontFamily:F.display,fontSize:23,fontWeight:600,color:C.ink,marginBottom:10}}>Cadastro em análise</h2>
              <p style={{color:C.slate,fontSize:14.5,lineHeight:1.7,maxWidth:420,margin:"0 auto 22px"}}>Recebemos seus dados e documentos. Nossa equipe vai conferir seu cadastro e liberar seu acesso. Você recebe um aviso assim que for aprovado.</p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <a href="/conta" style={{...btnPrimary,padding:"12px 26px",fontSize:14,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>Ir para minha conta <Ic n="arrowR" s={17} c="#fff"/></a>
                <a href="/" style={{...btnGhost,padding:"12px 24px",fontSize:14,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Voltar ao site</a>
              </div>
            </div>
          )}

          {err && step<4 && <div style={{marginTop:16,background:C.coralSoft,color:C.coralDeep,fontSize:13,padding:"10px 14px",borderRadius:10}}>{err}</div>}
        </div>

        {step<4 && (
          <div style={{display:"flex",gap:10,marginTop:20}}>
            {step>1 && !(step===1 && !loggedIn) && (
              <button onClick={()=>setStep(s=>s-1)} style={{...btnGhost,flex:1,padding:14,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Ic n="arrowL" s={17} c={C.ink}/> Voltar</button>
            )}
            <button onClick={()=>{ if(step===0)createAccount(); else if(step===1)saveData(); else if(step===2){ if(docsOk)setStep(3); else setErr("Envie o comprovante de endereço e o documento pessoal."); } else if(step===3){ if(signPhase==="signing")confirmSigned(); else if(signPhase==="local")localSubmit(); else startSign(); } }}
              disabled={busy}
              style={{flex:2,padding:14,border:"none",borderRadius:12,background:C.teal,color:"#fff",fontWeight:700,fontSize:15,cursor:busy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 22px rgba(20,160,139,0.3)",opacity:busy?0.7:1}}>
              {busy ? <Ic n="spinner" s={18} c="#fff" className="vp-spin"/> :
                step===0 ? <>Criar conta <Ic n="arrowR" s={17} c="#fff"/></> :
                step===3 ? (signPhase==="signing" ? <>Já assinei — continuar <Ic n="check" s={17} c="#fff"/></> : signPhase==="local" ? <>Assinar e enviar cadastro</> : <>Assinar contrato digitalmente <Ic n="arrowR" s={17} c="#fff"/></>) :
                <>Continuar <Ic n="arrowR" s={17} c="#fff"/></>}
            </button>
          </div>
        )}
        {step===0 && (
          <div style={{marginTop:18,textAlign:"center",fontSize:13.5,color:C.slate}}>
            Já tem conta? <a href="/entrar" style={{color:C.teal,fontWeight:600,textDecoration:"none"}}>Entrar</a>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{display:"block",fontSize:12.5,fontWeight:600,color:C.ink,marginBottom:7}}>{label}</label>
      {children}
    </div>
  );
}
