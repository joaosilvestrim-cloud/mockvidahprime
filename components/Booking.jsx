"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, money, Ic, RoomTile, btnPrimary, btnGhost } from "./brand";
import { USE_MODES } from "@/lib/content";

const TIMES = ["07:00","08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["D","S","T","Q","Q","S","S"];
const STEPS = ["Escolha a sala","Forma de uso","Agendamento","Pagamento","Confirmação"];

export default function Booking({ rooms }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [room, setRoom] = useState(null);
  const [mode, setMode] = useState(null);
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [date, setDate] = useState(null); // {y,m,d}
  const [times, setTimes] = useState([]);
  const [busy, setBusy] = useState([]); // ["09:00", ...]
  const [pay, setPay] = useState("pix");
  const [busyLoading, setBusyLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");

  // carrega ocupação quando data/sala mudam
  useEffect(() => {
    if (!room || !date) { setBusy([]); return; }
    let alive = true;
    (async () => {
      setBusyLoading(true);
      const dayStart = new Date(date.y, date.m, date.d, 0, 0, 0).toISOString();
      const dayEnd = new Date(date.y, date.m, date.d, 23, 59, 59).toISOString();
      const { data } = await supabase.rpc("busy_ranges", { p_room: room.id, p_from: dayStart, p_to: dayEnd });
      if (!alive) return;
      const b = [];
      for (const t of TIMES) {
        const h = parseInt(t);
        const s = new Date(date.y, date.m, date.d, h, 0, 0).getTime();
        const e = new Date(date.y, date.m, date.d, h + 1, 0, 0).getTime();
        const isBusy = (data || []).some(r => new Date(r.start_at).getTime() < e && new Date(r.end_at).getTime() > s);
        if (isBusy) b.push(t);
      }
      setBusy(b); setBusyLoading(false);
    })();
    return () => { alive = false; };
  }, [room, date]); // eslint-disable-line

  const getDays = (m, y) => { const fd = new Date(y,m,1).getDay(), tot = new Date(y,m+1,0).getDate(); const a = Array(fd).fill(null); for (let i=1;i<=tot;i++) a.push(i); return a; };
  const isPast = (d) => d && new Date(calY,calM,d) < new Date(new Date().setHours(0,0,0,0));
  const isSoon = (d) => { if(!d) return false; const diff=(new Date(calY,calM,d)-new Date(new Date().setHours(0,0,0,0)))/86400000; return diff>=0&&diff<2; };
  const dSel = (d) => date && date.y===calY && date.m===calM && date.d===d;
  const pickDate = (d) => { if(!d||isPast(d)||isSoon(d)) return; setDate({y:calY,m:calM,d}); setTimes([]); };
  const togTime = (t) => setTimes(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t]);

  const rate = room ? Number(room.price_hour) : 0;
  const total = rate * times.length * (mode?.id==="fixo" ? 4 : 1);
  const canNext = () => step===0 ? !!room : step===1 ? !!mode : step===2 ? (!!date && times.length>0) : true;

  const confirm = async () => {
    setErr(""); setConfirming(true);
    const slots = times.map(t => {
      const h = parseInt(t);
      return { start: new Date(date.y,date.m,date.d,h,0,0).toISOString(), end: new Date(date.y,date.m,date.d,h+1,0,0).toISOString() };
    });
    const { data, error } = await supabase.rpc("create_booking", { p_room: room.id, p_use_mode: mode.id, p_payment: pay, p_slots: slots });
    setConfirming(false);
    if (error) {
      const m = { SLOT_CONFLICT:"Um dos horários acabou de ser reservado. Escolha outro.", SLOT_BLOCKED:"Horário indisponível.", NOT_APPROVED:"Seu cadastro ainda não foi aprovado." }[error.message] || error.message;
      setErr(m); return;
    }
    setDone({ id:data, room, mode, date, times:[...times], total, pay });
    setStep(4);
  };

  const stepBg = { minHeight:"calc(100vh - 64px)", background:C.bg, paddingBottom:110 };

  return (
    <div style={stepBg}>
      {/* progresso */}
      <div style={{background:"#fff",padding:"18px 22px",borderBottom:`1px solid ${C.line}`,position:"sticky",top:64,zIndex:40}}>
        <div style={{maxWidth:820,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h1 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink}}>{STEPS[step]}</h1>
            <a href="/conta" style={{color:C.slate,fontSize:13,textDecoration:"none",display:"flex",gap:6,alignItems:"center"}}><Ic n="arrowL" s={16} c={C.slate}/> Minha conta</a>
          </div>
          <div style={{display:"flex",gap:5}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:4,background:i<=step?C.teal:C.line}}/>)}</div>
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:"26px 20px"}}>
        {step===0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:18}}>
            {rooms.map(r=>(
              <div key={r.id} onClick={()=>setRoom(r)} style={{background:"#fff",borderRadius:18,overflow:"hidden",border:`2px solid ${room?.id===r.id?C.teal:"transparent"}`,cursor:"pointer",boxShadow:room?.id===r.id?SH.lg:SH.sm}}>
                <RoomTile room={r} h={110} ics={36}>
                  {room?.id===r.id&&<div style={{position:"absolute",top:10,right:10,width:26,height:26,background:C.teal,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="check" s={15} c="#fff"/></div>}
                </RoomTile>
                <div style={{padding:"15px 16px"}}>
                  <h3 style={{fontFamily:F.display,fontSize:15.5,fontWeight:600,color:C.ink,marginBottom:4}}>{r.name}</h3>
                  <p style={{color:C.slate,fontSize:12,marginBottom:10,lineHeight:1.5}}>{r.description}</p>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:C.teal,fontWeight:700,fontSize:15}}>{money(r.price_hour)}<span style={{fontWeight:400,color:C.faint,fontSize:12}}>/h</span></span>
                    <span style={{background:C.tealSoft,color:C.tealDeep,fontSize:10.5,fontWeight:700,padding:"3px 9px",borderRadius:100}}>{r.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step===1 && (
          <div style={{display:"grid",gap:14}}>
            {USE_MODES.map(m=>(
              <div key={m.id} onClick={()=>setMode(m)} style={{background:mode?.id===m.id?C.tealSoft:"#fff",border:`2px solid ${mode?.id===m.id?C.teal:C.line}`,borderRadius:16,padding:"18px 22px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:46,height:46,borderRadius:12,background:mode?.id===m.id?"#fff":C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={m.icon} s={24} c={C.indigo}/></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{m.name}{m.badge&&<span style={{fontSize:11,color:C.coralDeep,fontWeight:600}}> · {m.badge}</span>}</div>
                  <div style={{color:C.slate,fontSize:13}}>{m.desc}</div>
                </div>
                <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${mode?.id===m.id?C.teal:C.line}`,background:mode?.id===m.id?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{mode?.id===m.id&&<Ic n="check" s={13} c="#fff"/>}</div>
              </div>
            ))}
            {mode?.id==="fixo" && <div style={{background:C.lilacSoft,color:C.indigo,borderRadius:11,padding:"11px 14px",fontSize:12.5}}>O Período Fixo reserva o mesmo horário toda semana. O valor exibido é a estimativa mensal (4 semanas).</div>}
          </div>
        )}

        {step===2 && (
          <div>
            <div style={{background:C.coralSoft,borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:C.coralDeep,display:"flex",gap:9,alignItems:"center"}}>
              <Ic n="clock" s={18} c={C.coralDeep}/> Reserve com pelo menos 2 dias de antecedência. Após cada atendimento, reservamos um tempo para higienização.
            </div>
            <div style={{background:"#fff",borderRadius:20,padding:24,marginBottom:20,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <button onClick={()=>{if(calM===0){setCalM(11);setCalY(y=>y-1);}else setCalM(m=>m-1);}} style={{background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:"9px 13px",cursor:"pointer",display:"flex"}}><Ic n="arrowL" s={17} c={C.ink}/></button>
                <span style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:17}}>{MONTHS[calM]} {calY}</span>
                <button onClick={()=>{if(calM===11){setCalM(0);setCalY(y=>y+1);}else setCalM(m=>m+1);}} style={{background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:"9px 13px",cursor:"pointer",display:"flex"}}><Ic n="arrowR" s={17} c={C.ink}/></button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>{DAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:C.faint,padding:"4px 0"}}>{d}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {getDays(calM,calY).map((d,i)=>{
                  const past=isPast(d),soon=isSoon(d),sel=dSel(d),dis=!d||past||soon;
                  return <button key={i} disabled={dis} onClick={()=>pickDate(d)} style={{height:40,border:"none",borderRadius:10,cursor:dis&&d?"not-allowed":(d?"pointer":"default"),background:sel?C.teal:(dis?"transparent":C.bg),color:sel?"#fff":(past||soon?C.faint:(d?C.ink:"transparent")),fontWeight:sel?700:500,fontSize:13.5}}>{d}</button>;
                })}
              </div>
            </div>
            {date && (
              <div style={{background:"#fff",borderRadius:20,padding:24,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <h3 style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:17}}>Horários disponíveis</h3>
                  {busyLoading && <Ic n="spinner" s={18} c={C.teal} className="vp-spin"/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(92px,1fr))",gap:8}}>
                  {TIMES.map(t=>{
                    const isB=busy.includes(t), sel=times.includes(t);
                    return <button key={t} disabled={isB} onClick={()=>!isB&&togTime(t)} style={{padding:"11px 6px",border:"none",borderRadius:11,background:isB?C.lineSoft:(sel?C.teal:C.bg),color:isB?C.faint:(sel?"#fff":C.ink),fontWeight:sel?700:500,fontSize:13.5,cursor:isB?"not-allowed":"pointer",position:"relative"}}>
                      {t}{isB&&<div style={{position:"absolute",bottom:2,left:0,right:0,textAlign:"center",fontSize:8,color:C.faint}}>Ocupado</div>}
                    </button>;
                  })}
                </div>
                {times.length>0&&<div style={{marginTop:14,color:C.tealDeep,fontSize:13,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="check" s={16} c={C.teal}/> {times.length}h selecionada(s)</div>}
              </div>
            )}
          </div>
        )}

        {step===3 && (
          <div>
            <div style={{background:"#fff",borderRadius:20,padding:24,marginBottom:20,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <h3 style={{fontFamily:F.display,fontWeight:600,color:C.ink,marginBottom:18,fontSize:18}}>Resumo da reserva</h3>
              {[["Sala",room?.name],["Forma de uso",mode?.name],["Data",date?`${String(date.d).padStart(2,"0")}/${String(date.m+1).padStart(2,"0")}/${date.y}`:"—"],["Horários",times.sort().join(", ")||"—"],["Valor da hora",money(rate)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:11}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v}</span></div>
              ))}
              <div style={{borderTop:`1px solid ${C.line}`,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                <span style={{fontWeight:700,color:C.ink,fontSize:16}}>Total</span>
                <span style={{fontFamily:F.display,fontSize:27,fontWeight:600,color:C.teal}}>{money(total)}</span>
              </div>
              {mode?.id==="fixo"&&<div style={{marginTop:8,fontSize:12,color:C.tealDeep,textAlign:"right"}}>Período Fixo: valor mensal (mesmo horário toda semana).</div>}
            </div>
            <div style={{background:"#fff",borderRadius:20,padding:24,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <h3 style={{fontFamily:F.display,fontWeight:600,color:C.ink,marginBottom:6,fontSize:18}}>Forma de pagamento</h3>
              <p style={{fontSize:12.5,color:C.slate,marginBottom:16}}>Contrato já assinado no cadastro. Escolha como pagar.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:18}}>
                {[{id:"pix",l:"Pix",s:"aprovação rápida",ic:"zap"},{id:"card",l:"Cartão",s:"crédito",ic:"card"}].map(pm=>(
                  <button key={pm.id} onClick={()=>setPay(pm.id)} style={{padding:16,border:`2px solid ${pay===pm.id?C.teal:C.line}`,borderRadius:14,background:pay===pm.id?C.tealSoft:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <Ic n={pm.ic} s={22} c={pay===pm.id?C.tealDeep:C.slate}/><div style={{fontWeight:700,color:C.ink,fontSize:14}}>{pm.l}</div><div style={{fontSize:11.5,color:C.tealDeep}}>{pm.s}</div>
                  </button>
                ))}
              </div>
              <div style={{padding:"12px 16px",background:C.lilacSoft,borderRadius:11,fontSize:12,color:C.indigo,display:"flex",alignItems:"center",gap:9}}><Ic n="info" s={16} c={C.indigo}/> Pagamento pelo banco Inter. Após confirmar, a recepção envia as instruções de pagamento.</div>
              {err && <div style={{marginTop:14,background:C.coralSoft,color:C.coralDeep,fontSize:13,padding:"10px 14px",borderRadius:10}}>{err}</div>}
            </div>
          </div>
        )}

        {step===4 && done && (
          <div style={{background:"#fff",borderRadius:20,padding:34,boxShadow:SH.sm,border:`1px solid ${C.line}`,textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:C.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n="checkCircle" s={40} c={C.teal}/></div>
            <h2 style={{fontFamily:F.display,fontSize:26,fontWeight:600,color:C.ink,marginBottom:8}}>Reserva confirmada!</h2>
            <p style={{color:C.slate,fontSize:15,marginBottom:24}}>Reserva registrada. Você acompanha tudo na sua área do cliente.</p>
            <div style={{background:C.bg,borderRadius:16,padding:22,textAlign:"left",maxWidth:440,margin:"0 auto",border:`1px solid ${C.line}`}}>
              {[["Sala",done.room.name],["Forma de uso",done.mode.name],["Data",`${String(done.date.d).padStart(2,"0")}/${String(done.date.m+1).padStart(2,"0")}/${done.date.y}`],["Horários",done.times.sort().join(", ")],["Total",money(done.total)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"6px 0"}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v}</span></div>
              ))}
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:24}}>
              <a href="/conta" style={{...btnPrimary,padding:"13px 26px",fontSize:14,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>Ver na minha conta <Ic n="arrowR" s={17} c="#fff"/></a>
              <button onClick={()=>{setRoom(null);setMode(null);setDate(null);setTimes([]);setDone(null);setStep(0);}} style={{...btnGhost,padding:"13px 24px",fontSize:14}}>Nova reserva</button>
            </div>
          </div>
        )}
      </div>

      {step<4 && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",padding:"14px 20px",boxShadow:"0 -6px 24px rgba(38,35,94,0.08)",display:"flex",gap:10,zIndex:60,borderTop:`1px solid ${C.line}`}}>
          <div style={{maxWidth:820,margin:"0 auto",display:"flex",gap:10,width:"100%"}}>
            <button onClick={()=>step>0?setStep(s=>s-1):router.push("/conta")} style={{...btnGhost,flex:1,padding:14,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Ic n="arrowL" s={17} c={C.ink}/> Voltar</button>
            <button onClick={()=>{ if(!canNext())return; step===3?confirm():setStep(s=>s+1); }} disabled={!canNext()||confirming}
              style={{flex:2,padding:14,border:"none",borderRadius:12,background:canNext()?C.teal:C.line,color:"#fff",fontWeight:700,fontSize:15,cursor:canNext()&&!confirming?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:canNext()?"0 8px 22px rgba(20,160,139,0.3)":"none"}}>
              {confirming ? <Ic n="spinner" s={18} c="#fff" className="vp-spin"/> : step===3 ? <><Ic n="lock" s={17} c="#fff"/> Confirmar reserva</> : <>Continuar <Ic n="arrowR" s={17} c="#fff"/></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
