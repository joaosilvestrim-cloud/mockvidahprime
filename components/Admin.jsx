"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, money, Ic, btnGhost } from "./brand";

const MODE = { avulso:"Hora Avulsa", flex:"Período Flex", fixo:"Período Fixo" };
const STATUS = { pending:"Em análise", approved:"Aprovado", rejected:"Recusado", blocked:"Bloqueado", incomplete:"Incompleto" };
const DOC_LABEL = { professional:"Documento profissional", address:"Comprovante de endereço", personal:"Documento pessoal" };
const TIMES = ["07:00","08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"];
const fmtT = (iso) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
const longDate = (o) => new Date(o.y,o.m,o.d).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
const overlaps = (aS,aE,bS,bE) => new Date(aS).getTime() < bE && new Date(aE).getTime() > bS;
const waLink = (phone) => { const d=(phone||"").replace(/\D/g,""); return d ? `https://wa.me/55${d}` : null; };
const isImg = (p) => /\.(jpe?g|png|webp|gif|heic|bmp)$/i.test(p||"");
const initials = (n) => (n||"P").split(" ").map(x=>x[0]).slice(0,2).join("");
const slugify = (s) => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || ("sala-"+Date.now());
const ICON_OPTS = [["pulse","Clínica"],["sofa","Conecta"],["tooth","Odonto"],["present","Reunião"],["palette","Estética"],["spark","Especial"],["building","Estrutura"],["users","Grupo"]];
const COLOR_OPTS = ["#14A08B","#E86B5E","#4E4B8E","#26235E","#7B6FB0","#0F8C79","#1A1743"];
const CAT_OPTS = ["Clínica","Conecta","Odontológica","Meeting","Estética","Bem-estar","Outra"];

export default function Admin({ pendings, professionals, todaySlots, rooms, settings }) {
  const supabase = createClient();
  const router = useRouter();
  const logout = async () => { await supabase.auth.signOut(); router.push("/"); router.refresh(); };
  const [tab, setTab] = useState("aprovacoes");
  const [toast, setToast] = useState(null);
  const [confirmBox, setConfirmBox] = useState(null);
  const [busy, setBusy] = useState(false);

  // listas locais (atualização otimista, sem recarregar a página)
  const [pendingList, setPendingList] = useState(pendings);
  const [proList, setProList] = useState(professionals);
  const [roomList, setRoomList] = useState(rooms);

  const notify = (msg, type="ok") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 3800); };
  const ask = (opts) => setConfirmBox(opts);

  // ---------- ações ----------
  const setStatus = async (id, status, okMsg) => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_status", { p_profile: id, p_status: status });
    setBusy(false);
    if (error) { notify("Não deu certo: " + error.message, "err"); return false; }
    setPendingList(l => l.filter(p => p.id !== id));
    setProList(l => l.map(p => p.id === id ? { ...p, status } : p));
    notify(okMsg);
    return true;
  };

  // ---------- APROVAÇÕES ----------
  const [sel, setSel] = useState(null);   // pessoa selecionada
  const [docs, setDocs] = useState([]);   // [{kind,url,img}]
  const [docsLoading, setDocsLoading] = useState(false);
  useEffect(() => {
    if (!sel) { setDocs([]); return; }
    let alive = true;
    (async () => {
      setDocsLoading(true);
      const out = [];
      for (const d of (sel.documents || [])) {
        const { data } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 300);
        out.push({ kind: d.kind, url: data?.signedUrl || null, img: isImg(d.storage_path) });
      }
      if (alive) { setDocs(out); setDocsLoading(false); }
    })();
    return () => { alive = false; };
  }, [sel]); // eslint-disable-line

  const approve = async (p) => { if (await setStatus(p.id, "approved", `${p.full_name || "Profissional"} foi aprovado.`)) setSel(null); };
  const reject = (p) => ask({
    title: "Recusar este cadastro?", danger: true,
    body: `${p.full_name || "A pessoa"} não vai conseguir reservar salas. Você pode aprovar depois se mudar de ideia.`,
    okLabel: "Sim, recusar",
    onOk: async () => { if (await setStatus(p.id, "rejected", "Cadastro recusado.")) setSel(null); },
  });

  // ---------- AGENDA ----------
  const [aDate, setADate] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth(),d:d.getDate()}; });
  const [aSlots, setASlots] = useState(todaySlots);
  const [aLoading, setALoading] = useState(false);
  const isToday = (() => { const t=new Date(); return aDate.y===t.getFullYear()&&aDate.m===t.getMonth()&&aDate.d===t.getDate(); })();
  const loadAgenda = async (dt) => {
    setALoading(true);
    const s = new Date(dt.y,dt.m,dt.d,0,0,0).toISOString();
    const e = new Date(dt.y,dt.m,dt.d,23,59,59).toISOString();
    const { data } = await supabase.from("booking_slots")
      .select("start_at,end_at,rooms(name,accent,icon),bookings(use_mode,profiles(full_name,area,phone))")
      .eq("status","reserved").gte("start_at",s).lt("start_at",e).order("start_at");
    setASlots(data || []); setALoading(false);
  };
  const shiftDay = (n) => { const d=new Date(aDate.y,aDate.m,aDate.d+n); const nd={y:d.getFullYear(),m:d.getMonth(),d:d.getDate()}; setADate(nd); loadAgenda(nd); };
  const goToday = () => { const d=new Date(); const nd={y:d.getFullYear(),m:d.getMonth(),d:d.getDate()}; setADate(nd); loadAgenda(nd); };

  // ---------- SALAS (gerenciar) ----------
  const [editor, setEditor] = useState(null); // null | {room fields}
  const [imgBusy, setImgBusy] = useState(false);
  const blank = () => ({ id:null, name:"", category:"Clínica", description:"", price_hour:"", icon:"pulse", accent:"#14A08B", available:true, specialties:[], image_url:null });
  const openNew = () => setEditor(blank());
  const openEdit = (r) => setEditor({ ...r, price_hour:String(r.price_hour||"") });
  const uploadRoomImage = async (file) => {
    if (!file) return;
    setImgBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
    const { error } = await supabase.storage.from("rooms").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) { setImgBusy(false); notify("Erro no upload da foto: " + error.message, "err"); return; }
    const { data } = supabase.storage.from("rooms").getPublicUrl(path);
    setEditor(e => ({ ...e, image_url: data.publicUrl }));
    setImgBusy(false);
  };
  const saveRoom = async () => {
    const e = editor;
    if (!e.name.trim()) { notify("Dê um nome para a sala.", "err"); return; }
    const price = parseFloat(String(e.price_hour).replace(",","."));
    if (isNaN(price) || price<=0) { notify("Informe um valor por hora válido.", "err"); return; }
    setBusy(true);
    const payload = {
      name:e.name.trim(), category:e.category, description:e.description||"", price_hour:price,
      icon:e.icon, accent:e.accent, available:e.available, specialties:e.specialties||[], image_url:e.image_url||null,
    };
    let error, saved;
    if (e.id) {
      ({ error } = await supabase.from("rooms").update(payload).eq("id", e.id));
      saved = { ...e, ...payload };
    } else {
      const maxSort = Math.max(0, ...roomList.map(r=>r.sort||0));
      const { data, error: er } = await supabase.from("rooms").insert({ ...payload, slug: slugify(e.name)+"-"+Date.now().toString(36).slice(-4), sort: maxSort+1 }).select().single();
      error = er; saved = data;
    }
    setBusy(false);
    if (error) { notify("Erro ao salvar: " + error.message, "err"); return; }
    setRoomList(l => e.id ? l.map(r=>r.id===e.id?{...r,...saved}:r) : [...l, saved]);
    setEditor(null);
    notify(e.id ? "Sala atualizada." : "Sala criada.");
  };
  const deleteRoom = (r) => ask({
    title: `Excluir "${r.name}"?`, danger: true,
    body: "A sala será removida da lista. Se ela já tiver reservas, não será possível excluir; nesse caso marque como “Em breve”.",
    okLabel: "Excluir",
    onOk: async () => {
      const { error } = await supabase.from("rooms").delete().eq("id", r.id);
      if (error) { notify("Essa sala tem histórico de reservas, então não dá para excluir. Marque como “Em breve”.", "err"); return; }
      setRoomList(l => l.filter(x=>x.id!==r.id));
      notify("Sala excluída.");
    },
  });

  // ---------- PAGAMENTOS ----------
  const [payments, setPayments] = useState([]);
  const [payLoading, setPayLoading] = useState(false);
  const [payEnabled, setPayEnabled] = useState((settings?.payments_enabled || "false") === "true");
  const [interReady, setInterReady] = useState(null); // null=desconhecido, bool
  const loadPayments = async () => {
    setPayLoading(true);
    const { data } = await supabase.from("payments")
      .select("id,amount,method,status,created_at,paid_at,provider,bookings(use_mode,rooms(name)),profiles(full_name)")
      .order("created_at", { ascending: false }).limit(100);
    setPayments(data || []); setPayLoading(false);
    try { const r = await fetch("/api/payments/status"); const j = await r.json(); setInterReady(!!j.configured); } catch { setInterReady(false); }
  };
  useEffect(() => { if (tab==="pagamentos") loadPayments(); /* eslint-disable-next-line */ }, [tab]);
  const markPaid = (p) => ask({
    title: "Confirmar recebimento?", body: `Marcar o pagamento de ${money(p.amount)} de ${p.profiles?.full_name||"—"} como PAGO.`, okLabel: "Sim, recebi",
    onOk: async () => {
      const { error } = await supabase.from("payments").update({ status:"paid", paid_at:new Date().toISOString() }).eq("id", p.id);
      if (error) { notify("Erro: " + error.message, "err"); return; }
      setPayments(l => l.map(x => x.id===p.id ? { ...x, status:"paid", paid_at:new Date().toISOString() } : x));
      notify("Pagamento marcado como recebido.");
    },
  });
  const togglePayEnabled = async () => {
    const next = !payEnabled;
    const { error } = await supabase.from("settings").upsert({ key:"payments_enabled", value: next?"true":"false" }, { onConflict:"key" });
    if (error) { notify("Erro: " + error.message, "err"); return; }
    setPayEnabled(next);
    notify(next ? "Cobrança automática ligada." : "Cobrança automática desligada.");
  };

  // ---------- AJUSTES ----------
  const [cfg, setCfg] = useState({
    cleaning_buffer_min: settings?.cleaning_buffer_min || "30",
    cancel_window_hours: settings?.cancel_window_hours || "48",
    credit_validity_days: settings?.credit_validity_days || "60",
  });
  const saveCfg = async () => {
    setBusy(true);
    const rows = Object.entries(cfg).map(([key,value]) => ({ key, value: String(value) }));
    const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) { notify("Erro: " + error.message, "err"); return; }
    notify("Ajustes salvos.");
  };

  const toggleRoom = (r) => ask({
    title: r.available ? `Deixar "${r.name}" indisponível?` : `Deixar "${r.name}" disponível?`,
    body: r.available ? "Ela some das opções de reserva e aparece como “Em breve” no site." : "Ela volta a aparecer no site e pode ser reservada.",
    okLabel: "Confirmar",
    onOk: async () => {
      const { error } = await supabase.from("rooms").update({ available: !r.available }).eq("id", r.id);
      if (error) { notify("Erro: " + error.message, "err"); return; }
      setRoomList(l => l.map(x => x.id === r.id ? { ...x, available: !x.available } : x));
      notify(r.available ? `"${r.name}" marcada como Em breve.` : `"${r.name}" está disponível.`);
    },
  });

  // ---------- PROFISSIONAIS ----------
  const [q, setQ] = useState("");
  const filteredPros = proList.filter(p => (p.full_name || "").toLowerCase().includes(q.toLowerCase()) || (p.area || "").toLowerCase().includes(q.toLowerCase()));
  const block = (p) => ask({
    title: `Bloquear ${p.full_name || "este profissional"}?`, danger: true,
    body: "Ele não vai mais conseguir reservar salas. Você pode reativar quando quiser.",
    okLabel: "Sim, bloquear",
    onOk: () => setStatus(p.id, "blocked", "Acesso bloqueado."),
  });
  const reactivate = (p) => setStatus(p.id, "approved", "Acesso reativado.");
  const approveFromList = (p) => setStatus(p.id, "approved", `${p.full_name || "Profissional"} foi aprovado.`);

  // ---------- ABRIR / FECHAR ----------
  const availRooms = roomList.filter(r=>r.available);
  const [hRoom, setHRoom] = useState(availRooms[0]?.id || null);
  const [hDate, setHDate] = useState(() => { const d=new Date(); return {y:d.getFullYear(),m:d.getMonth(),d:d.getDate()}; });
  const [booked, setBooked] = useState([]);
  const [blocks, setBlocks] = useState([]);
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
  const isBlocked = (t) => { const h=parseInt(t); const s=new Date(hDate.y,hDate.m,hDate.d,h).getTime(), e=new Date(hDate.y,hDate.m,hDate.d,h+1).getTime(); return blocks.some(b=>overlaps(b.start_at,b.end_at,s,e)); };
  const toggleSlot = async (t) => {
    if (booked.includes(t)) return;
    const h = parseInt(t);
    const s = new Date(hDate.y,hDate.m,hDate.d,h,0,0), e = new Date(hDate.y,hDate.m,hDate.d,h+1,0,0);
    const existing = blocks.find(b => overlaps(b.start_at,b.end_at,s.getTime(),e.getTime()));
    if (existing) await supabase.from("slot_blocks").delete().eq("id",existing.id);
    else await supabase.from("slot_blocks").insert({ room_id:hRoom, start_at:s.toISOString(), end_at:e.toISOString(), reason:"Fechado pela recepção" });
    loadSlots();
  };

  const dateInput = (o, set) => `${o.y}-${String(o.m+1).padStart(2,"0")}-${String(o.d).padStart(2,"0")}`;

  const tabs = [
    ["aprovacoes","Aprovar cadastros","userCheck", pendingList.length],
    ["agenda","Agenda do dia","cal", 0],
    ["salas","Salas","building", 0],
    ["profissionais","Profissionais","users", 0],
    ["horarios","Abrir e fechar","clock", 0],
    ["pagamentos","Pagamentos","wallet", 0],
    ["ajustes","Ajustes","sliders", 0],
  ];

  return (
    <div style={{minHeight:"calc(100vh - 64px)",background:C.bg}}>
      {/* boas-vindas */}
      <div style={{background:`linear-gradient(140deg, ${C.plumDeep}, ${C.plum})`,color:"#fff",padding:"22px 22px"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontFamily:F.body,fontWeight:800,fontSize:18}}>Vidah<span style={{color:"#7FE3D0",fontWeight:600}}> prime</span> · Administração</div>
            <div style={{fontSize:13.5,opacity:0.85,marginTop:2}}>Bem-vindo(a). Aqui você aprova cadastros, acompanha a agenda e cuida das salas.</div>
          </div>
          <button onClick={logout} style={{background:"rgba(255,255,255,0.16)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13.5,fontWeight:600,display:"flex",gap:7,alignItems:"center"}}><Ic n="logout" s={17} c="#fff"/> Sair</button>
        </div>
      </div>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"20px 16px 70px"}}>
        {/* resumo */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:20}}>
          {[
            { l:"Esperando aprovação", v:pendingList.length, c:C.coral, ic:"clipboard", go:"aprovacoes" },
            { l:"Atendimentos hoje", v:todaySlots.length, c:C.teal, ic:"cal", go:"agenda" },
            { l:"Profissionais", v:proList.length, c:C.indigo, ic:"users", go:"profissionais" },
            { l:"Salas disponíveis", v:roomList.filter(r=>r.available).length, c:C.lilac, ic:"building", go:"salas" },
          ].map(s=>(
            <button key={s.l} onClick={()=>setTab(s.go)} style={{textAlign:"left",background:"#fff",borderRadius:16,padding:16,boxShadow:SH.sm,border:`1px solid ${C.line}`,cursor:"pointer"}}>
              <div style={{width:38,height:38,borderRadius:11,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><Ic n={s.ic} s={19} c={s.c}/></div>
              <div style={{fontFamily:F.display,fontSize:24,fontWeight:600,color:s.c}}>{s.v}</div>
              <div style={{fontSize:11.5,color:C.slate,marginTop:2}}>{s.l}</div>
            </button>
          ))}
        </div>

        {/* abas grandes */}
        <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
          {tabs.map(([t,l,ic,count])=>(
            <button key={t} onClick={()=>{ setTab(t); setSel(null); if(t==="agenda"&&aSlots===todaySlots){} }} style={{display:"flex",alignItems:"center",gap:8,padding:"11px 16px",border:`1.5px solid ${tab===t?C.indigo:C.line}`,borderRadius:12,background:tab===t?C.indigo:"#fff",color:tab===t?"#fff":C.ink,fontWeight:600,cursor:"pointer",fontSize:13.5}}>
              <Ic n={ic} s={18} c={tab===t?"#fff":C.indigo}/> {l}
              {count>0 && <span style={{background:tab===t?"rgba(255,255,255,0.25)":C.coralSoft,color:tab===t?"#fff":C.coralDeep,borderRadius:100,padding:"1px 8px",fontSize:12,fontWeight:700}}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ---------- APROVAÇÕES ---------- */}
        {tab==="aprovacoes" && !sel && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Cadastros esperando sua aprovação</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:18}}>Toque em uma pessoa para ver os dados e os documentos. Depois é só aprovar ou recusar.</p>
            {pendingList.length===0 ? (
              <EmptyCard ic="checkCircle" title="Tudo em dia!" text="Não há ninguém esperando aprovação no momento." />
            ) : pendingList.map(p=>(
              <button key={p.id} onClick={()=>setSel(p)} style={{width:"100%",textAlign:"left",background:"#fff",borderRadius:16,padding:"16px 18px",boxShadow:SH.sm,marginBottom:12,border:`1px solid ${C.line}`,borderLeft:`5px solid ${C.coral}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:`linear-gradient(135deg,${C.indigo},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>{initials(p.full_name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:C.ink,fontSize:15.5}}>{p.full_name||"—"}</div>
                  <div style={{color:C.slate,fontSize:13}}>{p.area||"—"} · {p.council_type} {p.council_number||""}</div>
                  <div style={{color:C.faint,fontSize:12,marginTop:2}}>Cadastrou em {fmtDate(p.created_at)} · {(p.documents||[]).length} documento(s)</div>
                </div>
                <span style={{display:"flex",alignItems:"center",gap:6,color:C.indigo,fontWeight:600,fontSize:13.5}}>Abrir <Ic n="chevR" s={18} c={C.indigo}/></span>
              </button>
            ))}
          </div>
        )}

        {/* ficha da pessoa */}
        {tab==="aprovacoes" && sel && (
          <div>
            <button onClick={()=>setSel(null)} style={{...btnGhost,padding:"9px 14px",fontSize:13.5,display:"inline-flex",alignItems:"center",gap:7,marginBottom:16}}><Ic n="arrowL" s={17} c={C.ink}/> Voltar para a lista</button>
            <div style={{background:"#fff",borderRadius:20,boxShadow:SH.sm,border:`1px solid ${C.line}`,overflow:"hidden"}}>
              <div style={{padding:"24px",display:"flex",gap:16,alignItems:"center",borderBottom:`1px solid ${C.line}`,flexWrap:"wrap"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${C.indigo},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:20}}>{initials(sel.full_name)}</div>
                <div style={{flex:1,minWidth:180}}>
                  <h2 style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:C.ink}}>{sel.full_name||"—"}</h2>
                  <div style={{color:C.slate,fontSize:14}}>{sel.area||"Área não informada"}</div>
                </div>
                <span style={{background:C.coralSoft,color:C.coralDeep,padding:"6px 14px",borderRadius:100,fontSize:12.5,fontWeight:700}}>Em análise</span>
              </div>

              <div style={{padding:"22px 24px",borderBottom:`1px solid ${C.line}`}}>
                <div style={{fontSize:11.5,color:C.faint,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Dados</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"12px 24px"}}>
                  <Info label="E-mail" value={sel.email} />
                  <Info label="WhatsApp" value={sel.phone} action={waLink(sel.phone) && { href: waLink(sel.phone), label: "Chamar", ic: "whatsapp" }} />
                  <Info label="CPF" value={sel.cpf} />
                  <Info label="Conselho / área" value={`${sel.council_type||""} ${sel.council_number||""}`.trim() || "—"} />
                  <Info label="Área de atuação" value={sel.area} />
                  {(() => { const cu = (sel.contracts||[]).find(c=>c.signed_url)?.signed_url; const zap = (sel.contracts||[]).some(c=>c.provider==="zapsign"); return (
                    <Info label="Contrato" value={sel.contract_signed_at ? (zap ? "Assinado (ZapSign)" : "Assinado") : "Pendente"} action={cu && { href: cu, label: "Ver PDF", ic: "doc" }} />
                  ); })()}
                </div>
              </div>

              <div style={{padding:"22px 24px"}}>
                <div style={{fontSize:11.5,color:C.faint,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Documentos enviados</div>
                {docsLoading ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,color:C.slate,fontSize:14}}><Ic n="spinner" s={18} c={C.teal} className="vp-spin"/> Carregando documentos...</div>
                ) : docs.length===0 ? (
                  <div style={{color:C.slate,fontSize:14}}>Nenhum documento enviado.</div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
                    {docs.map((d,i)=>(
                      <div key={i} style={{border:`1px solid ${C.line}`,borderRadius:14,overflow:"hidden",background:C.bg}}>
                        <div style={{padding:"10px 14px",fontSize:13,fontWeight:600,color:C.ink,borderBottom:`1px solid ${C.line}`,display:"flex",alignItems:"center",gap:8}}><Ic n="doc" s={16} c={C.indigo}/> {DOC_LABEL[d.kind]||d.kind}</div>
                        {d.img && d.url ? (
                          <a href={d.url} target="_blank" rel="noreferrer" style={{display:"block"}}>
                            <img src={d.url} alt={DOC_LABEL[d.kind]} style={{width:"100%",height:180,objectFit:"cover",display:"block"}}/>
                          </a>
                        ) : (
                          <div style={{padding:20,textAlign:"center"}}>
                            <a href={d.url||"#"} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,color:C.teal,fontWeight:700,fontSize:14,textDecoration:"none"}}><Ic n="eye" s={18} c={C.teal}/> Abrir documento</a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{padding:"18px 24px 24px",display:"flex",gap:12,flexWrap:"wrap",borderTop:`1px solid ${C.line}`}}>
                <button disabled={busy} onClick={()=>approve(sel)} style={{flex:1,minWidth:180,background:C.teal,color:"#fff",border:"none",borderRadius:12,padding:"15px",fontSize:15.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:9,boxShadow:"0 8px 22px rgba(20,160,139,0.3)"}}><Ic n="checkCircle" s={20} c="#fff"/> Aprovar acesso</button>
                <button disabled={busy} onClick={()=>reject(sel)} style={{flex:1,minWidth:180,background:"#FFF5F5",color:C.coralDeep,border:`1.5px solid ${C.coral}`,borderRadius:12,padding:"15px",fontSize:15.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:9}}><Ic n="x" s={20} c={C.coralDeep}/> Recusar</button>
              </div>
            </div>
          </div>
        )}

        {/* ---------- AGENDA ---------- */}
        {tab==="agenda" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Agenda</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:16}}>Veja quem vai atender em cada dia. Use as setas para trocar de dia.</p>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,flexWrap:"wrap"}}>
              <button onClick={()=>shiftDay(-1)} style={{...btnGhost,padding:"10px 12px",cursor:"pointer"}}><Ic n="arrowL" s={18} c={C.ink}/></button>
              <div style={{minWidth:230,textAlign:"center",fontWeight:600,color:C.ink,fontSize:15,textTransform:"capitalize"}}>{longDate(aDate)}</div>
              <button onClick={()=>shiftDay(1)} style={{...btnGhost,padding:"10px 12px",cursor:"pointer"}}><Ic n="arrowR" s={18} c={C.ink}/></button>
              {!isToday && <button onClick={goToday} style={{background:C.indigo,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",fontWeight:600,cursor:"pointer",fontSize:13.5}}>Hoje</button>}
              {aLoading && <Ic n="spinner" s={20} c={C.teal} className="vp-spin"/>}
            </div>
            {aSlots.length===0 ? (
              <EmptyCard ic="cal" title="Dia livre" text="Nenhum atendimento agendado para este dia." />
            ) : aSlots.map((s,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,boxShadow:SH.sm,marginBottom:10,borderLeft:`5px solid ${s.rooms?.accent||C.teal}`,border:`1px solid ${C.line}`,flexWrap:"wrap"}}>
                <div style={{textAlign:"center",minWidth:60}}><div style={{fontFamily:F.display,fontWeight:600,color:C.ink,fontSize:17}}>{fmtT(s.start_at)}</div><div style={{color:C.faint,fontSize:11}}>até {fmtT(s.end_at)}</div></div>
                <div style={{width:40,height:40,borderRadius:11,background:`linear-gradient(140deg,${s.rooms?.accent||C.indigo},${C.navyDeep})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={s.rooms?.icon||"sofa"} s={20} c="#fff"/></div>
                <div style={{flex:1,minWidth:160}}>
                  <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{s.bookings?.profiles?.full_name||"—"}</div>
                  <div style={{color:C.slate,fontSize:12.5}}>{s.bookings?.profiles?.area||""} · {s.rooms?.name} · {MODE[s.bookings?.use_mode]||""}</div>
                </div>
                {waLink(s.bookings?.profiles?.phone) && <a href={waLink(s.bookings?.profiles?.phone)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#E9F9EF",color:"#1F9D57",borderRadius:10,padding:"8px 12px",fontSize:12.5,fontWeight:600,textDecoration:"none"}}><Ic n="whatsapp" s={15} c="#1F9D57"/> Falar</a>}
              </div>
            ))}
          </div>
        )}

        {/* ---------- SALAS (gerenciar) ---------- */}
        {tab==="salas" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <div>
                <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Salas</h2>
                <p style={{color:C.slate,fontSize:14}}>Crie salas novas, edite as que existem, ou marque como “Em breve” durante uma reforma.</p>
              </div>
              <button onClick={openNew} style={{background:C.teal,color:"#fff",border:"none",borderRadius:12,padding:"12px 18px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",gap:8,alignItems:"center",boxShadow:"0 8px 22px rgba(20,160,139,0.3)"}}><Ic n="plus" s={18} c="#fff"/> Nova sala</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
              {roomList.map(r=>(
                <div key={r.id} style={{background:"#fff",borderRadius:16,padding:20,boxShadow:SH.sm,borderTop:`5px solid ${r.available?C.teal:C.coral}`,border:`1px solid ${C.line}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                    <div style={{width:42,height:42,borderRadius:11,background:`linear-gradient(140deg,${r.accent||C.indigo},${C.navyDeep})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={r.icon||"sofa"} s={21} c="#fff"/></div>
                    <div style={{flex:1}}><h3 style={{fontFamily:F.display,fontSize:15.5,fontWeight:600,color:C.ink}}>{r.name}</h3><div style={{fontSize:12,color:C.slate}}>{r.category} · {money(r.price_hour)}/h</div></div>
                  </div>
                  <span style={{padding:"4px 11px",borderRadius:100,fontSize:11.5,fontWeight:700,background:r.available?C.tealSoft:C.coralSoft,color:r.available?C.tealDeep:C.coralDeep}}>{r.available?"Disponível":"Em breve"}</span>
                  <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
                    <button onClick={()=>openEdit(r)} style={{...btnGhost,padding:"8px 12px",fontSize:12.5,cursor:"pointer",display:"flex",gap:6,alignItems:"center"}}><Ic n="sliders" s={15} c={C.ink}/> Editar</button>
                    <button onClick={()=>toggleRoom(r)} style={{...btnGhost,padding:"8px 12px",fontSize:12.5,cursor:"pointer"}}>{r.available?"Em breve":"Disponível"}</button>
                    <button onClick={()=>deleteRoom(r)} style={{background:"#FFF5F5",border:`1px solid ${C.coral}`,color:C.coralDeep,borderRadius:10,padding:"8px 12px",fontSize:12.5,cursor:"pointer",fontWeight:600}}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------- PAGAMENTOS ---------- */}
        {tab==="pagamentos" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Pagamentos</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:18}}>Acompanhe o que foi pago e o que está pendente. Enquanto a cobrança automática do Inter não está ligada, você marca aqui o que já recebeu.</p>

            {/* status da integração */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:SH.sm,border:`1px solid ${C.line}`,marginBottom:18,display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{width:46,height:46,borderRadius:12,background:payEnabled?C.tealSoft:C.lilacSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="wallet" s={24} c={payEnabled?C.tealDeep:C.indigo}/></div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontWeight:700,color:C.ink,fontSize:15,display:"flex",alignItems:"center",gap:8}}>Integração com o banco Inter
                  {interReady!==null && <span style={{fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:100,background:interReady?"#E4F6EC":C.lilacSoft,color:interReady?"#1F9D57":C.indigo}}>{interReady?"Conectado":"Aguardando credenciais"}</span>}
                </div>
                <div style={{color:C.slate,fontSize:13}}>{interReady ? (payEnabled?"Cobrança Pix automática ligada.":"Conectado. Ligue a cobrança automática quando quiser.") : "Assim que a conta Inter Empresas estiver pronta e as credenciais forem inseridas, a cobrança Pix passa a ser automática. Por enquanto, a reconciliação é manual (abaixo)."}</div>
              </div>
              <button onClick={togglePayEnabled} disabled={!interReady} title={interReady?"":"Só terá efeito depois que a API do Inter for conectada"} style={{display:"flex",alignItems:"center",gap:8,background:payEnabled?C.teal:"#fff",color:payEnabled?"#fff":C.slate,border:`1.5px solid ${payEnabled?C.teal:C.line}`,borderRadius:100,padding:"8px 14px",fontSize:13,fontWeight:600,cursor:interReady?"pointer":"not-allowed",opacity:interReady?1:0.5}}>
                <span style={{width:14,height:14,borderRadius:"50%",background:payEnabled?"#fff":C.faint}}/> {payEnabled?"Ligada":"Desligada"}
              </button>
            </div>

            {/* resumo */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:18}}>
              {[
                { l:"Recebido", v:money(payments.filter(p=>p.status==="paid").reduce((s,p)=>s+Number(p.amount),0)), c:"#1F9D57" },
                { l:"Pendente", v:money(payments.filter(p=>p.status==="pending").reduce((s,p)=>s+Number(p.amount),0)), c:C.partial||"#B8791F" },
                { l:"Total de cobranças", v:payments.length, c:C.indigo },
              ].map(s=>(
                <div key={s.l} style={{background:"#fff",borderRadius:16,padding:16,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
                  <div style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11.5,color:C.faint,marginTop:4,textTransform:"uppercase",fontWeight:700,letterSpacing:1}}>{s.l}</div>
                </div>
              ))}
            </div>

            {payLoading ? (
              <div style={{display:"flex",alignItems:"center",gap:8,color:C.slate,fontSize:14}}><Ic n="spinner" s={18} c={C.teal} className="vp-spin"/> Carregando...</div>
            ) : payments.length===0 ? (
              <EmptyCard ic="wallet" title="Sem pagamentos ainda" text="Quando houver reservas, as cobranças aparecem aqui." />
            ) : payments.map(p=>{
              const st = { pending:{l:"Aguardando",bg:"#FBF0DC",c:"#B8791F"}, paid:{l:"Recebido",bg:"#E4F6EC",c:"#1F9D57"}, refunded:{l:"Estornado",bg:C.lilacSoft,c:C.indigo}, cancelled:{l:"Cancelado",bg:C.lineSoft,c:C.slate}, failed:{l:"Falhou",bg:C.coralSoft,c:C.coralDeep} }[p.status] || {l:p.status,bg:C.lineSoft,c:C.slate};
              return (
                <div key={p.id} style={{background:"#fff",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,boxShadow:SH.sm,marginBottom:10,border:`1px solid ${C.line}`,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{p.profiles?.full_name||"—"}</div>
                    <div style={{color:C.slate,fontSize:12.5}}>{p.bookings?.rooms?.name||"—"} · {p.method==="pix"?"Pix":"Cartão"} · {fmtDate(p.created_at)}</div>
                  </div>
                  <div style={{fontFamily:F.display,fontSize:18,fontWeight:600,color:C.ink}}>{money(p.amount)}</div>
                  <span style={{padding:"5px 12px",borderRadius:100,fontSize:11.5,fontWeight:700,background:st.bg,color:st.c}}>{st.l}</span>
                  {p.status==="pending" && <button onClick={()=>markPaid(p)} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:12.5,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="check" s={15} c="#fff"/> Marcar como pago</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- AJUSTES ---------- */}
        {tab==="ajustes" && (
          <div style={{maxWidth:560}}>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Ajustes da operação</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:18}}>Regras que valem para todas as reservas. Mude com calma e clique em salvar.</p>
            <div style={{background:"#fff",borderRadius:18,padding:24,boxShadow:SH.sm,border:`1px solid ${C.line}`,display:"grid",gap:18}}>
              <CfgField label="Tempo de limpeza entre atendimentos" hint="Minutos que a sala fica bloqueada após cada atendimento, para higienizar." unit="minutos"
                value={cfg.cleaning_buffer_min} onChange={v=>setCfg(c=>({...c,cleaning_buffer_min:v}))}/>
              <CfgField label="Prazo para cancelar com crédito" hint="Cancelando com mais horas de antecedência que isto, o valor vira crédito." unit="horas"
                value={cfg.cancel_window_hours} onChange={v=>setCfg(c=>({...c,cancel_window_hours:v}))}/>
              <CfgField label="Validade do crédito" hint="Por quantos dias o crédito de um cancelamento pode ser usado." unit="dias"
                value={cfg.credit_validity_days} onChange={v=>setCfg(c=>({...c,credit_validity_days:v}))}/>
              <button disabled={busy} onClick={saveCfg} style={{background:C.teal,color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 22px rgba(20,160,139,0.3)"}}><Ic n="check" s={18} c="#fff"/> Salvar ajustes</button>
            </div>
          </div>
        )}

        {/* ---------- PROFISSIONAIS ---------- */}
        {tab==="profissionais" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Profissionais</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:16}}>Todos os cadastrados. Bloqueie quem estiver dando problema; ele para de conseguir reservar.</p>
            <div style={{position:"relative",marginBottom:18,maxWidth:380}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><Ic n="search" s={18} c={C.faint}/></span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome ou área..." style={{width:"100%",padding:"12px 14px 12px 42px",border:`1.5px solid ${C.line}`,borderRadius:12,fontSize:14,fontFamily:F.body}}/>
            </div>
            {filteredPros.length===0 ? <EmptyCard ic="users" title="Ninguém encontrado" text="Tente outro nome ou área." /> :
            filteredPros.map(p=>{
              const blocked=p.status==="blocked";
              return (
                <div key={p.id} style={{background:"#fff",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,boxShadow:SH.sm,marginBottom:10,border:`1px solid ${C.line}`,borderLeft:`5px solid ${blocked?C.coral:p.status==="approved"?C.teal:C.faint}`,flexWrap:"wrap"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:blocked?C.coralSoft:`linear-gradient(135deg,${C.indigo},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:blocked?C.coralDeep:"#fff",fontWeight:700,fontSize:13}}>{initials(p.full_name)}</div>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:700,color:C.ink,fontSize:15}}>{p.full_name||"—"}</div>
                    <div style={{color:C.slate,fontSize:12.5}}>{p.area||"—"} · {p.council_type} {p.council_number||""}</div>
                  </div>
                  <span style={{padding:"5px 12px",borderRadius:100,fontSize:11.5,fontWeight:700,background:blocked?C.coralSoft:p.status==="approved"?C.tealSoft:C.lilacSoft,color:blocked?C.coralDeep:p.status==="approved"?C.tealDeep:C.indigo}}>{STATUS[p.status]}</span>
                  {waLink(p.phone) && <a href={waLink(p.phone)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#E9F9EF",color:"#1F9D57",borderRadius:10,padding:"8px 12px",fontSize:12.5,fontWeight:600,textDecoration:"none"}}><Ic n="whatsapp" s={15} c="#1F9D57"/> Falar</a>}
                  {p.status==="approved" && <button disabled={busy} onClick={()=>block(p)} style={{background:"#FFF5F5",border:`1.5px solid ${C.coral}`,color:C.coralDeep,borderRadius:10,padding:"9px 14px",fontSize:13,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="lock" s={15} c={C.coralDeep}/> Bloquear</button>}
                  {blocked && <button disabled={busy} onClick={()=>reactivate(p)} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:13,cursor:"pointer",fontWeight:600,display:"flex",gap:6,alignItems:"center"}}><Ic n="checkCircle" s={15} c="#fff"/> Reativar</button>}
                  {p.status==="pending" && <button disabled={busy} onClick={()=>approveFromList(p)} style={{background:C.teal,color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:13,cursor:"pointer",fontWeight:600}}>Aprovar</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- ABRIR / FECHAR ---------- */}
        {tab==="horarios" && (
          <div>
            <h2 style={{fontFamily:F.display,fontSize:21,fontWeight:600,color:C.ink,marginBottom:4}}>Abrir e fechar horários</h2>
            <p style={{color:C.slate,fontSize:14,marginBottom:16}}>Feche um horário para ninguém conseguir reservar. Toque de novo para abrir. Simples assim.</p>
            <div style={{background:"#fff",borderRadius:16,padding:22,boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
                <div><label style={{display:"block",fontSize:12.5,fontWeight:600,color:C.ink,marginBottom:6}}>Sala</label>
                  <select value={hRoom||""} onChange={e=>setHRoom(Number(e.target.value))} style={{padding:"11px 12px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:14,background:"#fff"}}>{availRooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
                </div>
                <div><label style={{display:"block",fontSize:12.5,fontWeight:600,color:C.ink,marginBottom:6}}>Dia</label>
                  <input type="date" value={dateInput(hDate)} onChange={e=>{const [y,m,d]=e.target.value.split("-").map(Number); setHDate({y,m:m-1,d});}} style={{padding:"11px 12px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:14}}/>
                </div>
                {hBusy && <Ic n="spinner" s={20} c={C.teal} className="vp-spin" style={{marginBottom:10}}/>}
              </div>
              <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap"}}>
                <Legend color={C.tealSoft} dot={C.teal} label="Aberto (pode reservar)"/>
                <Legend color={C.coralSoft} dot={C.coral} label="Fechado (por você)"/>
                <Legend color={C.lineSoft} dot={C.faint} label="Ocupado (já reservado)"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
                {TIMES.map(t=>{
                  const bk=booked.includes(t), bl=isBlocked(t);
                  const bg=bk?C.lineSoft:bl?C.coralSoft:C.tealSoft, col=bk?C.faint:bl?C.coralDeep:C.tealDeep;
                  return <button key={t} onClick={()=>toggleSlot(t)} disabled={bk} style={{padding:"14px 6px",border:"none",borderRadius:12,background:bg,color:col,fontWeight:700,fontSize:14,cursor:bk?"not-allowed":"pointer"}}>{t}<div style={{fontSize:10,marginTop:4,opacity:0.9,fontWeight:600}}>{bk?"Ocupado":bl?"Fechado":"Aberto"}</div></button>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:2000,background:toast.type==="err"?C.coralDeep:"#1F9D57",color:"#fff",padding:"13px 22px",borderRadius:100,boxShadow:SH.lg,display:"flex",alignItems:"center",gap:10,fontSize:14,fontWeight:600,maxWidth:"90vw"}}>
          <Ic n={toast.type==="err"?"info":"checkCircle"} s={19} c="#fff"/> {toast.msg}
        </div>
      )}

      {/* editor de sala */}
      {editor && (
        <div onClick={()=>!busy&&setEditor(null)} style={{position:"fixed",inset:0,zIndex:2100,background:"rgba(26,23,67,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:26,maxWidth:520,width:"100%",boxShadow:SH.xl}}>
            <h3 style={{fontFamily:F.display,fontSize:20,fontWeight:600,color:C.ink,marginBottom:18}}>{editor.id?"Editar sala":"Nova sala"}</h3>
            <div style={{display:"grid",gap:16}}>
              <div>
                <label style={LB}>Foto da sala</label>
                <div style={{position:"relative",height:170,borderRadius:14,overflow:"hidden",border:`1.5px dashed ${C.line}`,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {editor.image_url ? <img src={editor.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> :
                    <div style={{textAlign:"center",color:C.faint}}><Ic n="upload" s={26} c={C.faint}/><div style={{fontSize:13,marginTop:6}}>Nenhuma foto ainda</div></div>}
                  {imgBusy && <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="spinner" s={26} c={C.teal} className="vp-spin"/></div>}
                </div>
                <div style={{display:"flex",gap:10,marginTop:10}}>
                  <label style={{...btnGhost,padding:"9px 14px",fontSize:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7}}>
                    <Ic n="upload" s={16} c={C.ink}/> {editor.image_url?"Trocar foto":"Enviar foto"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadRoomImage(e.target.files?.[0])}/>
                  </label>
                  {editor.image_url && <button onClick={()=>setEditor({...editor,image_url:null})} style={{background:"#FFF5F5",border:`1px solid ${C.coral}`,color:C.coralDeep,borderRadius:10,padding:"9px 14px",fontSize:13,cursor:"pointer"}}>Remover foto</button>}
                </div>
              </div>
              <div><label style={LB}>Nome da sala</label><input value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})} placeholder="Ex.: Sala Clínica 08" style={IN}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={LB}>Tipo</label>
                  <select value={editor.category} onChange={e=>setEditor({...editor,category:e.target.value})} style={{...IN,background:"#fff"}}>{CAT_OPTS.map(o=><option key={o}>{o}</option>)}</select>
                </div>
                <div><label style={LB}>Valor por hora (R$)</label><input value={editor.price_hour} onChange={e=>setEditor({...editor,price_hour:e.target.value})} placeholder="55" inputMode="decimal" style={IN}/></div>
              </div>
              <div><label style={LB}>Descrição</label><textarea value={editor.description} onChange={e=>setEditor({...editor,description:e.target.value})} placeholder="Para que a sala serve, o que tem nela..." rows={3} style={{...IN,resize:"vertical"}}/></div>
              <div>
                <label style={LB}>Ícone</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {ICON_OPTS.map(([ic,lbl])=>(
                    <button key={ic} onClick={()=>setEditor({...editor,icon:ic})} title={lbl} style={{width:46,height:46,borderRadius:12,border:`2px solid ${editor.icon===ic?C.teal:C.line}`,background:editor.icon===ic?C.tealSoft:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n={ic} s={22} c={editor.icon===ic?C.tealDeep:C.slate}/></button>
                  ))}
                </div>
              </div>
              <div>
                <label style={LB}>Cor</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {COLOR_OPTS.map(col=>(
                    <button key={col} onClick={()=>setEditor({...editor,accent:col})} style={{width:34,height:34,borderRadius:"50%",background:col,border:editor.accent===col?`3px solid ${C.ink}`:`2px solid #fff`,boxShadow:SH.sm,cursor:"pointer"}}/>
                  ))}
                </div>
              </div>
              <label style={{display:"flex",gap:10,alignItems:"center",cursor:"pointer"}}>
                <input type="checkbox" checked={editor.available} onChange={e=>setEditor({...editor,available:e.target.checked})} style={{width:18,height:18,accentColor:C.teal}}/>
                <span style={{fontSize:14,color:C.ink}}>Disponível para reserva já (desmarque para “Em breve”)</span>
              </label>
            </div>
            <div style={{display:"flex",gap:10,marginTop:22}}>
              <button onClick={()=>setEditor(null)} disabled={busy} style={{...btnGhost,flex:1,padding:13,fontSize:14,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveRoom} disabled={busy} style={{flex:1,padding:13,border:"none",borderRadius:12,background:C.teal,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{busy?<Ic n="spinner" s={17} c="#fff" className="vp-spin"/>:<><Ic n="check" s={17} c="#fff"/> Salvar</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* confirmação */}
      {confirmBox && (
        <div onClick={()=>setConfirmBox(null)} style={{position:"fixed",inset:0,zIndex:2100,background:"rgba(26,23,67,0.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:28,maxWidth:420,width:"100%",boxShadow:SH.xl}}>
            <div style={{width:52,height:52,borderRadius:14,background:confirmBox.danger?C.coralSoft:C.lilacSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Ic n={confirmBox.danger?"info":"checkCircle"} s={26} c={confirmBox.danger?C.coralDeep:C.indigo}/></div>
            <h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink,marginBottom:8}}>{confirmBox.title}</h3>
            <p style={{color:C.slate,fontSize:14,lineHeight:1.6,marginBottom:22}}>{confirmBox.body}</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmBox(null)} style={{...btnGhost,flex:1,padding:13,fontSize:14,cursor:"pointer"}}>Cancelar</button>
              <button onClick={async()=>{ const fn=confirmBox.onOk; setConfirmBox(null); await fn(); }} style={{flex:1,padding:13,border:"none",borderRadius:12,background:confirmBox.danger?C.coralDeep:C.teal,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>{confirmBox.okLabel||"Confirmar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const IN = { width:"100%",padding:"12px 14px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:14,fontFamily:F.body,boxSizing:"border-box" };
const LB = { display:"block",fontSize:12.5,fontWeight:600,color:C.ink,marginBottom:7 };

function CfgField({ label, hint, unit, value, onChange }) {
  return (
    <div>
      <label style={{...LB,marginBottom:3}}>{label}</label>
      <div style={{fontSize:12.5,color:C.slate,marginBottom:8}}>{hint}</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <input value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,""))} inputMode="numeric" style={{...IN,width:120,fontSize:16,fontWeight:600,textAlign:"center"}}/>
        <span style={{fontSize:14,color:C.slate}}>{unit}</span>
      </div>
    </div>
  );
}

function Info({ label, value, action }) {
  return (
    <div>
      <div style={{fontSize:11.5,color:C.faint,fontWeight:600,marginBottom:2}}>{label}</div>
      <div style={{fontSize:14.5,color:C.ink,fontWeight:600,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        {value||"—"}
        {action && <a href={action.href} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,background:"#E9F9EF",color:"#1F9D57",borderRadius:8,padding:"3px 10px",fontSize:12,fontWeight:700,textDecoration:"none"}}><Ic n={action.ic} s={14} c="#1F9D57"/> {action.label}</a>}
      </div>
    </div>
  );
}
function EmptyCard({ ic, title, text }) {
  return (
    <div style={{background:"#fff",borderRadius:18,padding:"46px 24px",textAlign:"center",boxShadow:SH.sm,border:`1px solid ${C.line}`}}>
      <div style={{width:60,height:60,borderRadius:16,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n={ic} s={30} c={C.teal}/></div>
      <h3 style={{fontFamily:F.display,fontSize:18,color:C.ink,marginBottom:6}}>{title}</h3>
      <p style={{color:C.slate,fontSize:14}}>{text}</p>
    </div>
  );
}
function Legend({ color, dot, label }) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:12.5,color:C.slate}}><span style={{width:16,height:16,borderRadius:5,background:color,border:`1px solid ${dot}33`,position:"relative"}}><span style={{position:"absolute",inset:4,borderRadius:"50%",background:dot}}/></span>{label}</span>;
}
