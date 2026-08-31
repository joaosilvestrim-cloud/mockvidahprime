"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, money, Ic, RoomTile, btnPrimary, btnGhost } from "./brand";
import { USE_MODES, WHATSAPP } from "@/lib/content";

const MANHA = ["07:00","08:00","09:00","10:00","11:00"];
const TARDE = ["13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const TIMES = [...MANHA, ...TARDE];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["D","S","T","Q","Q","S","S"];
const STEPS = ["A sala", "Como usar", "Dia e horário", "Confirmar"];
const MODE_HINT = { avulso: "Ex.: um atendimento na quinta de manhã.", flex: "Ex.: sempre à tarde, mas em dias diferentes.", fixo: "Ex.: toda terça, das 14h às 16h." };

export default function Booking({ rooms }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [room, setRoom] = useState(null);
  const [mode, setMode] = useState(null);
  const [calM, setCalM] = useState(new Date().getMonth());
  const [calY, setCalY] = useState(new Date().getFullYear());
  const [date, setDate] = useState(null);
  const [times, setTimes] = useState([]);
  const [busy, setBusy] = useState([]);
  const [pay, setPay] = useState("pix");
  const [busyLoading, setBusyLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!room || !date) { setBusy([]); return; }
    let alive = true;
    (async () => {
      setBusyLoading(true);
      const dayStart = new Date(date.y, date.m, date.d, 0, 0, 0).toISOString();
      const dayEnd = new Date(date.y, date.m, date.d, 23, 59, 59).toISOString();
      const { data } = await supabase.rpc("busy_ranges", { p_room: room.id, p_from: dayStart, p_to: dayEnd });
      if (!alive) return;
      const b = TIMES.filter((t) => {
        const h = parseInt(t);
        const s = new Date(date.y, date.m, date.d, h).getTime(), e = new Date(date.y, date.m, date.d, h + 1).getTime();
        return (data || []).some((r) => new Date(r.start_at).getTime() < e && new Date(r.end_at).getTime() > s);
      });
      setBusy(b); setBusyLoading(false);
    })();
    return () => { alive = false; };
  }, [room, date]); // eslint-disable-line

  const getDays = (m, y) => { const fd = new Date(y,m,1).getDay(), tot = new Date(y,m+1,0).getDate(); const a = Array(fd).fill(null); for (let i=1;i<=tot;i++) a.push(i); return a; };
  const isPast = (d) => d && new Date(calY,calM,d) < new Date(new Date().setHours(0,0,0,0));
  const isSoon = (d) => { if(!d) return false; const diff=(new Date(calY,calM,d)-new Date(new Date().setHours(0,0,0,0)))/86400000; return diff>=0&&diff<2; };
  const dSel = (d) => date && date.y===calY && date.m===calM && date.d===d;
  const pickDate = (d) => { if(!d||isPast(d)||isSoon(d)) return; setDate({y:calY,m:calM,d}); setTimes([]); };
  const togTime = (t) => setTimes((p) => p.includes(t) ? p.filter((x)=>x!==t) : [...p,t]);
  const pickBlock = (block) => { const free = block.filter((t)=>!busy.includes(t)); const allSel = free.every((t)=>times.includes(t)); setTimes((p)=> allSel ? p.filter((t)=>!free.includes(t)) : [...new Set([...p,...free])]); };

  const rate = room ? Number(room.price_hour) : 0;
  const total = rate * times.length * (mode?.id === "fixo" ? 4 : 1);
  const canNext = () => step===0 ? !!room : step===1 ? !!mode : step===2 ? (!!date && times.length>0) : true;
  const dateLabel = date ? `${String(date.d).padStart(2,"0")}/${String(date.m+1).padStart(2,"0")}/${date.y}` : "—";

  const confirm = async () => {
    setErr(""); setConfirming(true);
    const weeks = mode.id === "fixo" ? [0,7,14,21] : [0];
    const slots = [];
    for (const off of weeks) for (const t of times) { const h = parseInt(t); slots.push({ start: new Date(date.y,date.m,date.d+off,h,0,0).toISOString(), end: new Date(date.y,date.m,date.d+off,h+1,0,0).toISOString() }); }
    const { data, error } = await supabase.rpc("create_booking", { p_room: room.id, p_use_mode: mode.id, p_payment: pay, p_slots: slots });
    setConfirming(false);
    if (error) {
      const m = { SLOT_CONFLICT:"Poxa, alguém acabou de reservar um desses horários. Escolha outro, por favor.", SLOT_BLOCKED:"Esse horário não está disponível.", NOT_APPROVED:"Seu cadastro ainda está em análise." }[error.message] || "Não foi possível concluir. Tente de novo.";
      setErr(m); return;
    }
    setDone({ id:data, room, mode, date, times:[...times], total, pay });
    setStep(4);
  };

  const inputStyle = { padding:"11px 12px", border:`1.5px solid ${C.line}`, borderRadius:11, fontSize:14 };

  return (
    <div style={{minHeight:"calc(100vh - 64px)",background:C.bg,paddingBottom:step<4?120:40}}>
      {/* progresso */}
      {step<4 && (
        <div style={{background:"#fff",padding:"16px 20px",borderBottom:`1px solid ${C.line}`,position:"sticky",top:64,zIndex:40}}>
          <div style={{maxWidth:860,margin:"0 auto"}}>
            <div style={{fontSize:12,color:C.teal,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Passo {step+1} de 4</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h1 style={{fontFamily:F.display,fontSize:"clamp(19px,3vw,23px)",fontWeight:600,color:C.ink}}>{["Escolha a sala","Como você quer usar?","Quando você quer atender?","Confirme sua reserva"][step]}</h1>
              <a href="/conta" style={{color:C.slate,fontSize:13,textDecoration:"none",display:"flex",gap:5,alignItems:"center"}}><Ic n="arrowL" s={16} c={C.slate}/> Sair</a>
            </div>
            <div style={{display:"flex",gap:6,marginTop:12}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:5,borderRadius:5,background:i<=step?C.teal:C.line,transition:"background .3s"}}/>)}</div>
          </div>
        </div>
      )}

      <div style={{maxWidth:860,margin:"0 auto",padding:"22px 16px"}}>
        {/* STEP 0 — sala */}
        {step===0 && (
          <div>
            <p style={{color:C.slate,fontSize:15,marginBottom:18}}>Toque na sala onde você quer atender. Você pode trocar depois.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:16}}>
              {rooms.map((r)=>{
                const sel = room?.id===r.id;
                return (
                  <div key={r.id} onClick={()=>setRoom(r)} style={{background:"#fff",borderRadius:18,overflow:"hidden",border:`2.5px solid ${sel?C.teal:"transparent"}`,cursor:"pointer",boxShadow:sel?SH.lg:SH.sm,transition:"all .15s"}}>
                    <RoomTile room={r} h={130} ics={40}>
                      {sel && <div style={{position:"absolute",top:12,right:12,width:30,height:30,background:C.teal,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:SH.md}}><Ic n="check" s={18} c="#fff"/></div>}
                    </RoomTile>
                    <div style={{padding:"14px 16px"}}>
                      <h3 style={{fontFamily:F.display,fontSize:16,fontWeight:600,color:C.ink,marginBottom:6}}>{r.name}</h3>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:C.teal,fontWeight:700,fontSize:16}}>{money(r.price_hour)}<span style={{fontWeight:400,color:C.faint,fontSize:12}}>/hora</span></span>
                        <span style={{background:C.tealSoft,color:C.tealDeep,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:100}}>{r.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1 — modo */}
        {step===1 && (
          <div>
            <p style={{color:C.slate,fontSize:15,marginBottom:18}}>Do jeito que combina com a sua rotina. Não entendeu? A Vi te explica no cantinho da tela.</p>
            <div style={{display:"grid",gap:14}}>
              {USE_MODES.map((m)=>{
                const sel = mode?.id===m.id;
                return (
                  <div key={m.id} onClick={()=>setMode(m)} style={{background:sel?C.tealSoft:"#fff",border:`2.5px solid ${sel?C.teal:C.line}`,borderRadius:18,padding:"20px 22px",cursor:"pointer",display:"flex",gap:16,alignItems:"flex-start"}}>
                    <div style={{width:50,height:50,borderRadius:14,background:sel?"#fff":C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={m.icon} s={26} c={C.plum}/></div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:C.ink,fontSize:16,marginBottom:3}}>{m.name}{m.badge&&<span style={{fontSize:11,color:C.coralDeep,fontWeight:600,marginLeft:8}}>{m.badge}</span>}</div>
                      <div style={{color:C.slate,fontSize:13.5,lineHeight:1.55}}>{m.desc}</div>
                      <div style={{color:C.teal,fontSize:12.5,marginTop:6,fontWeight:600}}>{MODE_HINT[m.id]}</div>
                    </div>
                    <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${sel?C.teal:C.line}`,background:sel?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:4}}>{sel&&<Ic n="check" s={14} c="#fff"/>}</div>
                  </div>
                );
              })}
            </div>
            {mode?.id==="fixo" && <div style={{background:C.lilacSoft,color:C.plum,borderRadius:12,padding:"12px 16px",fontSize:13,marginTop:14,display:"flex",gap:9,alignItems:"center"}}><Ic n="info" s={18} c={C.plum}/> No Período Fixo, o mesmo horário fica reservado toda semana. O valor mostrado é o do mês (4 semanas).</div>}
          </div>
        )}

        {/* STEP 2 — dia e horário */}
        {step===2 && (
          <div>
            <div style={{background:C.tealSoft,borderRadius:12,padding:"12px 16px",marginBottom:18,fontSize:13.5,color:C.tealDeep,display:"flex",gap:9,alignItems:"center"}}><Ic n="info" s={18} c={C.tealDeep}/> Escolha um dia (a partir de 2 dias) e depois os horários. Cinza = já reservado.</div>
            <div style={{background:"#fff",borderRadius:20,padding:22,marginBottom:16,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <button onClick={()=>{if(calM===0){setCalM(11);setCalY(y=>y-1);}else setCalM(m=>m-1);}} style={{background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex"}}><Ic n="arrowL" s={18} c={C.ink}/></button>
                <span style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:18}}>{MONTHS[calM]} {calY}</span>
                <button onClick={()=>{if(calM===11){setCalM(0);setCalY(y=>y+1);}else setCalM(m=>m+1);}} style={{background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex"}}><Ic n="arrowR" s={18} c={C.ink}/></button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{DAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:C.faint,padding:"4px 0"}}>{d}</div>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
                {getDays(calM,calY).map((d,i)=>{const past=isPast(d),soon=isSoon(d),sel=dSel(d),dis=!d||past||soon;return <button key={i} disabled={dis} onClick={()=>pickDate(d)} style={{height:44,border:"none",borderRadius:12,cursor:dis&&d?"not-allowed":(d?"pointer":"default"),background:sel?C.teal:(dis?"transparent":C.bg),color:sel?"#fff":(past||soon?C.faint:(d?C.ink:"transparent")),fontWeight:sel?700:500,fontSize:14}}>{d}</button>;})}
              </div>
            </div>
            {date && (
              <div style={{background:"#fff",borderRadius:20,padding:22,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <h3 style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:17}}>Horários de {dateLabel}</h3>
                  {busyLoading && <Ic n="spinner" s={18} c={C.teal} className="vp-spin"/>}
                </div>
                {[["Manhã",MANHA],["Tarde",TARDE]].map(([label,block])=>{
                  const free = block.filter((t)=>!busy.includes(t));
                  const allSel = free.length>0 && free.every((t)=>times.includes(t));
                  return (
                    <div key={label} style={{marginBottom:16}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13,fontWeight:700,color:C.slate}}>{label}</span>
                        {free.length>0 && <button onClick={()=>pickBlock(block)} style={{background:"none",border:"none",color:C.teal,fontWeight:600,fontSize:12.5,cursor:"pointer"}}>{allSel?"Limpar":`Selecionar toda a ${label.toLowerCase()}`}</button>}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:8}}>
                        {block.map((t)=>{const isB=busy.includes(t),sel=times.includes(t);return <button key={t} disabled={isB} onClick={()=>!isB&&togTime(t)} style={{padding:"12px 6px",border:"none",borderRadius:12,background:isB?C.lineSoft:(sel?C.teal:C.bg),color:isB?C.faint:(sel?"#fff":C.ink),fontWeight:sel?700:500,fontSize:14,cursor:isB?"not-allowed":"pointer",position:"relative"}}>{t}{isB&&<div style={{position:"absolute",bottom:2,left:0,right:0,textAlign:"center",fontSize:8,color:C.faint}}>ocupado</div>}</button>;})}
                      </div>
                    </div>
                  );
                })}
                {times.length>0 && <div style={{color:C.tealDeep,fontSize:13.5,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="check" s={16} c={C.teal}/> {times.length} hora(s) selecionada(s){mode?.id==="fixo"?" por semana":""}</div>}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — confirmar */}
        {step===3 && (
          <div>
            <div style={{background:"#fff",borderRadius:20,overflow:"hidden",marginBottom:18,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",gap:14,padding:18,alignItems:"center",borderBottom:`1px solid ${C.line}`}}>
                <div style={{width:72,height:72,borderRadius:14,overflow:"hidden",flexShrink:0}}><RoomTile room={room} h={72} ics={28}/></div>
                <div>
                  <div style={{fontFamily:F.display,fontSize:18,fontWeight:600,color:C.ink}}>{room?.name}</div>
                  <div style={{color:C.slate,fontSize:13.5}}>{mode?.name}</div>
                </div>
              </div>
              <div style={{padding:"18px 20px"}}>
                {[["Dia",dateLabel],["Horários",[...times].sort().join(", ")||"—"],["Valor da hora",money(rate)]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:14.5,marginBottom:11}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v}</span></div>
                ))}
                <div style={{borderTop:`1px solid ${C.line}`,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontWeight:700,color:C.ink,fontSize:16}}>Total{mode?.id==="fixo"?" no mês":""}</span>
                  <span style={{fontFamily:F.display,fontSize:28,fontWeight:600,color:C.teal}}>{money(total)}</span>
                </div>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:20,padding:22,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <h3 style={{fontFamily:F.display,fontWeight:600,color:C.ink,marginBottom:14,fontSize:17}}>Como você quer pagar?</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[{id:"pix",l:"Pix",s:"na hora",ic:"zap"},{id:"card",l:"Cartão",s:"crédito",ic:"card"}].map((pm)=>(
                  <button key={pm.id} onClick={()=>setPay(pm.id)} style={{padding:18,border:`2.5px solid ${pay===pm.id?C.teal:C.line}`,borderRadius:14,background:pay===pm.id?C.tealSoft:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}><Ic n={pm.ic} s={26} c={pay===pm.id?C.tealDeep:C.slate}/><div style={{fontWeight:700,color:C.ink,fontSize:15}}>{pm.l}</div><div style={{fontSize:12,color:C.tealDeep}}>{pm.s}</div></button>
                ))}
              </div>
              <div style={{padding:"12px 16px",background:C.lilacSoft,borderRadius:11,fontSize:12.5,color:C.plum,display:"flex",alignItems:"center",gap:9}}><Ic n="info" s={17} c={C.plum}/> Após confirmar, a recepção envia as instruções de pagamento. Seu horário fica guardado.</div>
              {err && <div style={{marginTop:14,background:C.coralSoft,color:C.coralDeep,fontSize:13.5,padding:"12px 16px",borderRadius:11}}>{err}</div>}
            </div>
          </div>
        )}

        {/* STEP 4 — sucesso */}
        {step===4 && done && (
          <div style={{background:"#fff",borderRadius:22,padding:"36px 26px",boxShadow:SH.sm,border:`1px solid ${C.line}`,textAlign:"center"}}>
            <div style={{width:88,height:88,borderRadius:"50%",background:C.tealSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}><Ic n="checkCircle" s={46} c={C.teal}/></div>
            <h2 style={{fontFamily:F.display,fontSize:28,fontWeight:600,color:C.ink,marginBottom:8}}>Reserva feita! 🎉</h2>
            <p style={{color:C.slate,fontSize:15.5,marginBottom:24,maxWidth:420,margin:"0 auto 24px"}}>Está tudo certo. Você acompanha a reserva na sua área do cliente.</p>
            <div style={{background:C.bg,borderRadius:16,padding:20,textAlign:"left",maxWidth:420,margin:"0 auto 22px",border:`1px solid ${C.line}`}}>
              {[["Sala",done.room.name],["Como usar",done.mode.name],["Dia",`${String(done.date.d).padStart(2,"0")}/${String(done.date.m+1).padStart(2,"0")}/${done.date.y}`],["Horários",[...done.times].sort().join(", ")],["Total",money(done.total)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:14,padding:"7px 0"}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v}</span></div>
              ))}
            </div>
            <div style={{background:C.tealSoft,borderRadius:14,padding:16,textAlign:"left",maxWidth:420,margin:"0 auto 24px"}}>
              <div style={{fontWeight:700,color:C.tealDeep,fontSize:13.5,marginBottom:8}}>O que acontece agora</div>
              {["Guarde o dia e o horário na sua agenda","A recepção envia as instruções de pagamento","No dia, é só chegar; a sala estará pronta"].map((t,i)=>(
                <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:13,color:C.ink,marginBottom:6}}><Ic n="check" s={16} c={C.teal} style={{flexShrink:0,marginTop:2}}/> {t}</div>
              ))}
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <a href="/conta" style={{...btnPrimary,padding:"14px 26px",fontSize:15,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>Ver minhas reservas <Ic n="arrowR" s={17} c="#fff"/></a>
              <button onClick={()=>{setRoom(null);setMode(null);setDate(null);setTimes([]);setDone(null);setStep(0);}} style={{...btnGhost,padding:"14px 24px",fontSize:15}}>Fazer outra</button>
            </div>
          </div>
        )}
      </div>

      {/* barra inferior */}
      {step<4 && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",padding:"12px 16px",boxShadow:"0 -6px 24px rgba(38,35,94,0.1)",zIndex:60,borderTop:`1px solid ${C.line}`}}>
          <div style={{maxWidth:860,margin:"0 auto",display:"flex",gap:12,alignItems:"center"}}>
            {room && step>0 && (
              <div style={{flexShrink:0}}>
                <div style={{fontSize:11,color:C.faint}}>{room.name}{times.length>0?` · ${times.length}h`:""}</div>
                <div style={{fontFamily:F.display,fontWeight:700,color:C.teal,fontSize:17}}>{times.length>0?money(total):"—"}</div>
              </div>
            )}
            <div style={{display:"flex",gap:10,flex:1}}>
              <button onClick={()=>step>0?setStep((s)=>s-1):router.push("/conta")} style={{...btnGhost,padding:"14px 16px",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Ic n="arrowL" s={17} c={C.ink}/> Voltar</button>
              <button onClick={()=>{ if(!canNext())return; step===3?confirm():setStep((s)=>s+1); }} disabled={!canNext()||confirming} style={{flex:1,padding:"14px",border:"none",borderRadius:12,background:canNext()?C.teal:C.line,color:"#fff",fontWeight:700,fontSize:15.5,cursor:canNext()&&!confirming?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:canNext()?"0 8px 22px rgba(20,160,139,0.3)":"none"}}>
                {confirming ? <Ic n="spinner" s={18} c="#fff" className="vp-spin"/> : step===3 ? <><Ic n="lock" s={17} c="#fff"/> Confirmar reserva</> : <>Continuar <Ic n="arrowR" s={18} c="#fff"/></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
