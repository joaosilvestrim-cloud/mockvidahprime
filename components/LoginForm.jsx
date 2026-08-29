"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { C, SH, F, Ic, btnPrimary } from "./brand";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) {
      setLoading(false);
      setErr(/invalid login/i.test(error.message) ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    let dest = "/conta";
    if (data?.user) {
      const { data: p } = await supabase.from("profiles").select("role,status").eq("id", data.user.id).single();
      if (p?.role === "admin") dest = "/admin";
      else if (p?.status === "incomplete") dest = "/cadastro";
    }
    setLoading(false);
    router.push(dest);
    router.refresh();
  };

  const inputStyle = { width:"100%",padding:"12px 14px",border:`1.5px solid ${C.line}`,borderRadius:11,fontSize:14,fontFamily:F.body,boxSizing:"border-box" };

  return (
    <div style={{minHeight:"calc(100vh - 64px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:C.bg}}>
      <div style={{background:"#fff",borderRadius:22,padding:"38px 34px",maxWidth:400,width:"100%",boxShadow:SH.lg,border:`1px solid ${C.line}`}}>
        <h1 style={{fontFamily:F.display,fontSize:24,fontWeight:600,color:C.ink,marginBottom:6}}>Entrar</h1>
        <p style={{color:C.slate,fontSize:14,marginBottom:24}}>Acesse sua conta para reservar salas.</p>
        <form onSubmit={submit} style={{display:"grid",gap:14}}>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,color:C.ink,display:"block",marginBottom:7}}>E-mail</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" style={inputStyle}/>
          </div>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,color:C.ink,display:"block",marginBottom:7}}>Senha</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inputStyle}/>
          </div>
          {err && <div style={{background:C.coralSoft,color:C.coralDeep,fontSize:13,padding:"10px 14px",borderRadius:10}}>{err}</div>}
          <button type="submit" disabled={loading} style={{...btnPrimary,padding:14,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:loading?0.7:1}}>
            {loading ? <Ic n="spinner" s={18} c="#fff" className="vp-spin"/> : <>Entrar <Ic n="arrowR" s={17} c="#fff"/></>}
          </button>
        </form>
        <div style={{marginTop:20,textAlign:"center",fontSize:13.5,color:C.slate}}>
          Ainda não tem conta? <a href="/cadastro" style={{color:C.teal,fontWeight:600,textDecoration:"none"}}>Cadastre-se</a>
        </div>
      </div>
    </div>
  );
}
