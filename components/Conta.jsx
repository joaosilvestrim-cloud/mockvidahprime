"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, money, Ic, btnPrimary, btnGhost } from "./brand";

const MODE = { avulso:"Hora Avulsa", flex:"Período Flex", fixo:"Período Fixo" };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});

export default function Conta({ profile, bookings, credits, contract }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState("reservas");
  const approved = profile.status === "approved";
  const creditTotal = credits.reduce((s,c)=>s+Number(c.amount),0);
  const activeBookings = bookings.filter(b=>b.status==="confirmed");

  const logout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh(); };
  const cancel = async (id) => {
    if (!confirm("Cancelamentos fora do prazo não geram crédito (24h para reservas por hora ou período, 7 dias para o mensal). Deseja cancelar?")) return;
    const { data, error } = await supabase.rpc("cancel_booking", { p_booking: id });
    if (error) { alert("Erro: " + error.message); return; }
    alert(data?.credited ? `Reserva cancelada. Crédito de ${money(data.amount)} disponível por 6 meses.` : "Reserva cancelada. Sem crédito (cancelamento fora do prazo).");
    router.refresh();
  };

  const StatusBanner = () => {
    if (approved) return null;
    const map = {
      pending: { bg:C.lilacSoft, c:C.indigo, ic:"searchCheck", t:"Cadastro em análise", d:"Nossa equipe está conferindo seus dados. Você poderá reservar assim que for aprovado." },
      rejected: { bg:C.coralSoft, c:C.coralDeep, ic:"info", t:"Cadastro não aprovado", d:"Fale com a equipe pelo WhatsApp para entender os próximos passos." },
      blocked: { bg:C.coralSoft, c:C.coralDeep, ic:"lock", t:"Acesso bloqueado", d:"Seu acesso está suspenso. Fale com a recepção." },
    }[profile.status];
    if (!map) return null;
    return (
      <div style={{background:map.bg,borderRadius:16,padding:"16px 20px",marginBottom:22,display:"flex",gap:14,alignItems:"flex-start"}}>
        <Ic n={map.ic} s={24} c={map.c} style={{flexShrink:0,marginTop:2}}/>
        <div><div style={{fontWeight:700,color:map.c,fontSize:15}}>{map.t}</div><div style={{color:C.slate,fontSize:13.5,marginTop:2}}>{map.d}</div></div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"calc(100vh - 64px)",background:C.bg}}>
      <div style={{background:`linear-gradient(140deg, ${C.navyDeep}, ${C.indigo})`,color:"#fff",padding:"28px 22px",position:"relative",overflow:"hidden"}}>
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}><g fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.3"><path d="M-20 80 Q300 20 700 80 T1300 60"/><path d="M-20 120 Q300 60 700 120 T1300 100"/></g></svg>
        <div style={{maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.16)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:700,border:"1px solid rgba(255,255,255,0.25)"}}>{(profile.full_name||"P").split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
            <div>
              <div style={{fontFamily:F.display,fontSize:21,fontWeight:600}}>{profile.full_name||"Profissional"}</div>
              <div style={{fontSize:13,opacity:0.85,display:"flex",gap:6,alignItems:"center"}}>{profile.area||"—"}{approved && <span style={{color:"#7FE3D0",display:"inline-flex",alignItems:"center",gap:4}}>· <Ic n="checkCircle" s={14} c="#7FE3D0"/> Aprovado</span>}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            {approved && <a href="/reservar" style={{...btnPrimary,padding:"11px 20px",fontSize:14,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}><Ic n="plus" s={17} c="#fff"/> Nova reserva</a>}
            <button onClick={logout} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:10,padding:"11px 16px",cursor:"pointer",fontSize:13,display:"flex",gap:6,alignItems:"center"}}><Ic n="logout" s={16} c="#fff"/> Sair</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"24px 20px 60px"}}>
        <StatusBanner />

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
          {[
            {l:"Reservas ativas",v:activeBookings.length,c:C.indigo,ic:"cal"},
            {l:"Crédito disponível",v:money(creditTotal),c:C.teal,ic:"wallet"},
            {l:"Cadastro",v:approved?"Aprovado":profile.status==="pending"?"Em análise":profile.status,c:C.lilac,ic:"userCheck"},
            {l:"Contrato",v:profile.contract_signed_at?"Assinado":"—",c:C.coral,ic:"doc"},
          ].map(s=>(
            <div key={s.l} style={{background:"#fff",borderRadius:16,padding:18,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{width:40,height:40,borderRadius:11,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic n={s.ic} s={20} c={s.c}/></div>
              <div style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10.5,color:C.faint,marginTop:5,textTransform:"uppercase",fontWeight:700,letterSpacing:1}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:4,marginBottom:22,background:"#fff",borderRadius:12,padding:4,width:"fit-content",boxShadow:SH.sm,flexWrap:"wrap",border:`1px solid ${C.line}`}}>
          {[["reservas","Minhas reservas"],["contrato","Contrato"],["dados","Meus dados"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"9px 18px",border:"none",borderRadius:9,background:tab===t?C.indigo:"transparent",color:tab===t?"#fff":C.slate,fontWeight:tab===t?700:500,cursor:"pointer",fontSize:13}}>{l}</button>
          ))}
        </div>

        {tab==="reservas" && (
          <div>
            {bookings.length===0 ? (
              <div style={{background:"#fff",borderRadius:18,padding:"46px 24px",textAlign:"center",boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
                <div style={{width:60,height:60,borderRadius:16,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n="cal" s={30} c={C.faint}/></div>
                <h3 style={{fontFamily:F.display,fontSize:18,color:C.ink,marginBottom:8}}>Nenhuma reserva ainda</h3>
                <p style={{color:C.slate,fontSize:14,marginBottom:20}}>{approved?"Faça sua primeira reserva e ela aparece aqui.":"Assim que seu cadastro for aprovado, você poderá reservar."}</p>
                {approved && <a href="/reservar" style={{...btnPrimary,padding:"12px 24px",fontSize:14,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>Reservar agora <Ic n="arrowR" s={17} c="#fff"/></a>}
              </div>
            ) : bookings.map(b=>{
              const slots = (b.booking_slots||[]).filter(s=>s.status==="reserved").sort((a,c)=>a.start_at<c.start_at?-1:1);
              const first = slots[0];
              return (
                <div key={b.id} style={{background:"#fff",borderRadius:16,padding:"18px 22px",display:"flex",alignItems:"center",gap:16,boxShadow:SH.sm,marginBottom:12,borderLeft:`4px solid ${b.status==="cancelled"?C.faint:C.teal}`,border:`1px solid ${C.line}`,flexWrap:"wrap",opacity:b.status==="cancelled"?0.65:1}}>
                  <div style={{width:44,height:44,borderRadius:11,background:`linear-gradient(140deg,${b.rooms?.accent||C.indigo},${C.navyDeep})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={b.rooms?.icon||"sofa"} s={22} c="#fff"/></div>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{b.rooms?.name}</div>
                    <div style={{color:C.slate,fontSize:12.5}}>{MODE[b.use_mode]} · {first?`${fmtDate(first.start_at)} às ${fmtTime(first.start_at)}`:"—"}{slots.length>1?` +${slots.length-1}`:""}</div>
                    <div style={{color:C.faint,fontSize:11.5,marginTop:2}}>{money(b.total)} · {b.payment_method==="pix"?"Pix":"Cartão"} {b.status==="cancelled" && "· Cancelada"}</div>
                  </div>
                  {b.status==="confirmed" && (
                    <button onClick={()=>cancel(b.id)} style={{background:C.coralSoft,border:`1px solid ${C.coral}`,borderRadius:11,padding:"8px 14px",fontSize:12.5,cursor:"pointer",color:C.coralDeep,fontWeight:600}}>Cancelar</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="contrato" && (
          <div style={{background:"#fff",borderRadius:18,padding:28,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
              <div><h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink}}>Contrato de licença de uso</h3><div style={{fontSize:12.5,color:C.slate}}>Assinado no cadastro · validade jurídica</div></div>
              {profile.contract_signed_at && <span style={{display:"inline-flex",alignItems:"center",gap:6,background:C.tealSoft,color:C.tealDeep,padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:700}}><Ic n="checkCircle" s={15} c={C.tealDeep}/> Assinado</span>}
            </div>
            <div style={{border:`1px solid ${C.line}`,borderRadius:12,padding:20,fontSize:12.5,lineHeight:1.9,color:C.ink,background:C.bg}}>
              <p style={{marginBottom:8}}><strong>Contratante:</strong> {profile.full_name} · CPF {profile.cpf||"—"} · {profile.council_type} {profile.council_number||""}</p>
              <p style={{marginBottom:8}}><strong>Contratada:</strong> Vidah Prime · Av. General Osório, 736 · Sorocaba/SP</p>
              <p style={{marginBottom:8}}>Cessão de uso das salas para atendimentos em saúde, bem-estar e estética, com responsabilidade sanitária e civil do contratante, respeito ao intervalo de higienização e às regras de cancelamento (24h para reservas por hora ou período, 7 dias para o mensal).</p>
              {profile.contract_signed_at && <p style={{fontSize:11,color:C.faint,marginTop:14,borderTop:`1px solid ${C.line}`,paddingTop:10}}>Assinado digitalmente em {new Date(profile.contract_signed_at).toLocaleString("pt-BR")} · Hash: {profile.contract_hash} · MP 2.200-2/2001 e Lei 14.063/2020</p>}
            </div>
            {contract?.signed_url && (
              <a href={contract.signed_url} target="_blank" rel="noreferrer" style={{...btnPrimary,marginTop:16,padding:"11px 20px",fontSize:13.5,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}><Ic n="doc" s={16} c="#fff"/> Baixar contrato assinado</a>
            )}
          </div>
        )}

        {tab==="dados" && (
          <div style={{background:"#fff",borderRadius:18,padding:28,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
            <h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink,marginBottom:18}}>Meus dados</h3>
            {[["Nome",profile.full_name],["E-mail",profile.email],["WhatsApp",profile.phone],["CPF",profile.cpf],["Conselho / área",`${profile.council_type||""} ${profile.council_number||""}`.trim()],["Área de atuação",profile.area]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${C.line}`,fontSize:14}}><span style={{color:C.slate}}>{k}</span><span style={{fontWeight:600,color:C.ink}}>{v||"—"}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
