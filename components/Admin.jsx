"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, Ic, btnGhost } from "./brand";

const MODE = { avulso:"Hora Avulsa", flex:"Período Flex", fixo:"Período Fixo" };
const STATUS = { pending:"Em análise", approved:"Aprovado", rejected:"Recusado", blocked:"Bloqueado", incomplete:"Incompleto" };
const TIMES = ["07:00","08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const fmtT = (iso) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const overlaps = (aS,aE,bS,bE) => new Date(aS).getTime() < bE && new Date(aE).getTime() > bS;

export default function Admin({ pendings, professionals, todaySlots, rooms }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState("aprovacoes");
  const [busy, setBusy] = useState(null);
  // abrir/fechar
  const availRooms = rooms.filter(r=>r.available);
  const [hRoom, setHRoom] = useState(availRooms[0]?.id || null);
  const [hDate, setHDate] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth(),d:d.getDate()}; });
  const [booked, setBooked] = useState([]);   // ["09:00"]
  const [blocks, setBlocks] = useState([]);    // [{id,start_at,end_at}]
  const [hBusy, setHBusy] = useState(false);

  const loadSlots = async () => {
    if (!hRoom) return;
    setHBusy(true);
    const dayS = new Date(hDate.y,hDate.m,hDate.d,0,0,0).toISOString();
    const dayE = new Date(hDate.y,hDate.m,hDate.d,23,59,59).toISOString();
    const [{ data: bs }, { data: sb }] = await Promise.all([
      supabase.from("booking_slots").select("start_at,cleaning_until").eq("room_id",hRoom).eq("status","reserved").gte("start_at",dayS).lt("start_at",dayE),
      supabase.from("slot_blocks").select("id,start_at,end_at").eq("room_id",hRoom).gte("start_at",dayS).lt("start_at",dayE),
    ]);
    const bk = TIMES.filter(t => { const h=parseInt(t); const s=new Date(hDate.y,hDate.m,hDate.d,h).getTime(), e=new Date(hDate.y,hDate.m,hDate.d,h+1).getTime(); return (bs||[]).some(x=>overlaps(x.start_at,x.cleaning_until,s,e)); });
    setBooked(bk); setBlocks(sb||[]); setHBusy(false);
  };
  useEffect(() => { if (tab==="horarios") loadSlots(); /* eslint-disable-next-line */ }, [tab, hRoom, hDate]);

  const toggleSlot = async (t) => {
    if (booked.includes(t)) return;
    const h = parseInt(t);
    const s = new Date(hDate.y,hDate.m,hDate.d,h,0,0), e = new Date(hDate.y,hDate.m,hDate.d,h+1,0,0);
    const existing = blocks.find(b => overlaps(b.start_at,b.end_at,s.getTime(),e.getTime()));
    if (existing) { await supabase.from("slot_blocks").delete().eq("id",existing.id); }
    else { await supabase.from("slot_blocks").insert({ room_id:hRoom, start_at:s.toISOString(), end_at:e.toISOString(), reason:"Fechado pela recepção" }); }
    loadSlots();
  };
  const isBlocked = (t) => { const h=parseInt(t); const s=new Date(hDate.y,hDate.m,hDate.d,h).getTime(), e=new Date(hDate.y,hDate.m,hDate.d,h+1).getTime(); return blocks.some(b=>overlaps(b.start_at,b.end_at,s,e)); };

  const setStatus = async (id, status) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_status", { p_profile: id, p_status: status });
    setBusy(null);
    if (error) { alert("Erro: " + error.message); return; }
    router.refresh();
  };
  const viewDocs = async (id) => {
    const { data: docs } = await supabase.from("documents").select("kind,storage_path").eq("profile_id", id);
    if (!docs || docs.length===0) { alert("Nenhum documento enviado."); return; }
    for (const d of docs) {
      const { data } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 120);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    }
  };

  const stat = [
    { l:"Aprovações pendentes", v:pendings.length, c:C.coral, ic:"clipboard" },
    { l:"Atendimentos hoje", v:todaySlots.length, c:C.teal, ic:"cal" },
    { l:"Profissionais", v:professionals.length, c:C.indigo, ic:"users" },
    { l:"Salas ativas", v:rooms.filter(r=>r.available).length, c:C.lilac, ic:"building" },
  ];
  const tabs = [["aprovacoes",`Aprovações${pendings.length?` (${pendings.length})`:""}`],["agenda","Agenda"],["salas","Salas"],["profissionais","Profissionais"],["horarios","Abrir / fechar"]];

  return (
    <div style={{minHeight:"calc(100vh - 64px)",background:C.bg}}>
      <div style={{background:C.navyDeep,color:"#fff",padding:"16px 22px"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{fontFamily:F.body,fontWeight:800,fontSize:17}}>Vidah<span style={{color:C.teal,fontWeight:600}}> prime</span> · Administração</div>
          <div style={{fontSize:12.5,opacity:0.75}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
      </div>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"22px 20px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
          {stat.map(s=>(
            <div key={s.l} style={{background:"#fff",borderRadius:16,padding:18,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{width:40,height:40,borderRadius:11,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic n={s.ic} s={20} c={s.c}/></div>
              <div style={{fontFamily:F.display,fontSize:25,fontWeight:600,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11,color:C.faint,marginTop:5,textTransform:"uppercase",fontWeight:700,letterSpacing:1}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:4,marginBottom:22,background:"#fff",borderRadius:12,padding:4,width:"fit-content",boxShadow:SH.sm,flexWrap:"wrap",border:`1px solid ${C.line}`}}>
          {tabs.map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 18px",border:"none",borderRadius:9,background:tab===t?C.indigo:"transparent",color:tab===t?"#fff":C.slate,fontWeight:tab===t?700:500,cursor:"pointer",fontSize:13}}>{l}</button>
          ))}
        </div>

        {tab==="aprovacoes" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:6}}>Cadastros aguardando aprovação</h2>
            <p style={{color:C.slate,fontSize:13.5,marginBottom:18}}>Confira os documentos e os dados antes de liberar o acesso.</p>
            {pendings.length===0 ? (
              <div style={{background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:C.slate,boxShadow:SH.sm,border:`1px solid ${C.line}`,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}><Ic n="checkCircle" s={30} c={C.teal}/> Nenhuma aprovação pendente.</div>
            ) : pendings.map(p=>(
              <div key={p.id} style={{background:"#fff",borderRadius:16,padding:"18px 22px",boxShadow:SH.sm,marginBottom:12,borderLeft:`4px solid ${C.coral}`,border:`1px solid ${C.line}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{p.full_name||"—"}</div>
                    <div style={{color:C.slate,fontSize:13}}>{p.area||"—"} · {p.council_type} {p.council_number||""}</div>
                    <div style={{fontSize:11.5,color:C.faint,marginTop:4}}>{(p.documents||[]).length} documento(s) enviado(s)</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button onClick={()=>viewDocs(p.id)} style={{...btnGhost,padding:"9px 12px",fontSize:12.5,display:"flex",gap:6,alignItems:"center"}}><Ic n="eye" s={15} c={C.ink}/> Ver docs</button>
                    <button disabled={busy===p.id} onClick={()=>setStatus(p.id,"approved")} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="check" s={15} c="#fff"/> Aprovar</button>
                    <button disabled={busy===p.id} onClick={()=>setStatus(p.id,"rejected")} style={{background:C.coralSoft,border:`1px solid ${C.coral}`,borderRadius:10,padding:"9px 12px",fontSize:12.5,cursor:"pointer",color:C.coralDeep}}>Recusar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="agenda" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:18}}>Agenda de hoje</h2>
            {todaySlots.length===0 ? (
              <div style={{background:"#fff",borderRadius:16,padding:40,textAlign:"center",color:C.slate,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>Nenhum atendimento agendado para hoje.</div>
            ) : todaySlots.map((s,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"16px 22px",display:"flex",alignItems:"center",gap:18,boxShadow:SH.sm,marginBottom:10,borderLeft:`4px solid ${C.teal}`,border:`1px solid ${C.line}`}}>
                <div style={{textAlign:"center",minWidth:56}}><div style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:16}}>{fmtT(s.start_at)}</div><div style={{color:C.faint,fontSize:11}}>até {fmtT(s.end_at)}</div></div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.ink,fontSize:14}}>{s.bookings?.profiles?.full_name||"—"}</div>
                  <div style={{color:C.slate,fontSize:12}}>{s.bookings?.profiles?.area||""} · {s.rooms?.name} · {MODE[s.bookings?.use_mode]||""}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="salas" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:18}}>Salas</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
              {rooms.map(r=>(
                <div key={r.id} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:SH.sm,borderTop:`4px solid ${r.available?C.teal:C.coral}`,border:`1px solid ${C.line}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                    <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(140deg,${r.accent||C.indigo},${C.navyDeep})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={r.icon||"sofa"} s={19} c="#fff"/></div>
                    <h3 style={{fontFamily:F.display,fontSize:14.5,fontWeight:600,color:C.ink}}>{r.name}</h3>
                  </div>
                  <div style={{fontSize:12,color:C.slate}}>{r.category}</div>
                  <span style={{display:"inline-block",marginTop:10,padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:700,background:r.available?C.tealSoft:C.coralSoft,color:r.available?C.tealDeep:C.coralDeep}}>{r.available?"Disponível":"Em breve"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="profissionais" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:6}}>Profissionais</h2>
            <p style={{color:C.slate,fontSize:13.5,marginBottom:18}}>Se um profissional começar a dar problema, você pode bloquear o acesso dele. Bloqueado, ele não consegue mais reservar.</p>
            {professionals.map(p=>{
              const blocked = p.status==="blocked";
              return (
                <div key={p.id} style={{background:"#fff",borderRadius:16,padding:"16px 22px",display:"flex",alignItems:"center",gap:16,boxShadow:SH.sm,marginBottom:10,border:`1px solid ${C.line}`,borderLeft:`4px solid ${blocked?C.coral:p.status==="approved"?C.teal:C.faint}`,flexWrap:"wrap"}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:blocked?C.coralSoft:`linear-gradient(135deg,${C.indigo},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:blocked?C.coralDeep:"#fff",fontWeight:700,fontSize:13}}>{(p.full_name||"P").split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:700,color:C.ink,fontSize:14}}>{p.full_name||"—"}</div>
                    <div style={{color:C.slate,fontSize:12}}>{p.area||"—"} · {p.council_type} {p.council_number||""}</div>
                  </div>
                  <span style={{padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:700,background:blocked?C.coralSoft:p.status==="approved"?C.tealSoft:C.lilacSoft,color:blocked?C.coralDeep:p.status==="approved"?C.tealDeep:C.indigo}}>{STATUS[p.status]}</span>
                  {p.status==="approved" && <button disabled={busy===p.id} onClick={()=>setStatus(p.id,"blocked")} style={{background:"#FFF5F5",border:`1px solid ${C.coral}`,color:C.coralDeep,borderRadius:10,padding:"8px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="lock" s={15} c={C.coralDeep}/> Bloquear</button>}
                  {blocked && <button disabled={busy===p.id} onClick={()=>setStatus(p.id,"approved")} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="checkCircle" s={15} c="#fff"/> Reativar</button>}
                  {p.status==="pending" && <button disabled={busy===p.id} onClick={()=>setStatus(p.id,"approved")} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600}}>Aprovar</button>}
                </div>
              );
            })}
          </div>
        )}

        {tab==="horarios" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:6}}>Abrir e fechar horários</h2>
            <p style={{color:C.slate,fontSize:13.5,marginBottom:18}}>Feche um horário para que ninguém consiga reservar (ex.: alguém chegou na recepção ou a sala precisa ficar livre). Horários ocupados por reservas não podem ser alterados aqui.</p>
            <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18,alignItems:"flex-end"}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:C.ink,marginBottom:6}}>Sala</label>
                  <select value={hRoom||""} onChange={e=>setHRoom(Number(e.target.value))} style={{padding:"10px 12px",border:`1.5px solid ${C.line}`,borderRadius:10,fontSize:14,background:"#fff"}}>
                    {availRooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:C.ink,marginBottom:6}}>Data</label>
                  <input type="date" value={`${hDate.y}-${String(hDate.m+1).padStart(2,"0")}-${String(hDate.d).padStart(2,"0")}`} onChange={e=>{const [y,m,d]=e.target.value.split("-").map(Number); setHDate({y,m:m-1,d});}} style={{padding:"10px 12px",border:`1.5px solid ${C.line}`,borderRadius:10,fontSize:14}}/>
                </div>
                {hBusy && <Ic n="spinner" s={20} c={C.teal} className="vp-spin" style={{marginBottom:8}}/>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(96px,1fr))",gap:8}}>
                {TIMES.map(t=>{
                  const bk=booked.includes(t), bl=isBlocked(t);
                  const bg = bk?C.lineSoft : bl?C.coralSoft : C.tealSoft;
                  const col = bk?C.faint : bl?C.coralDeep : C.tealDeep;
                  return (
                    <button key={t} onClick={()=>toggleSlot(t)} disabled={bk} style={{padding:"12px 6px",border:"none",borderRadius:11,background:bg,color:col,fontWeight:600,fontSize:13,cursor:bk?"not-allowed":"pointer"}}>
                      {t}<div style={{fontSize:9.5,marginTop:3,opacity:0.85}}>{bk?"Ocupado":bl?"Fechado":"Aberto"}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{marginTop:16,fontSize:12,color:C.slate}}>Clique para alternar entre aberto e fechado. Horários fechados não aparecem para os profissionais reservarem.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
