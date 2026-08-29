"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C, SH, F, money, Ic, LogoMark, Wordmark, Stars, Eyebrow, RoomTile, btnPrimary } from "./brand";
import { HOW, DIFERENCIAIS, TESTIMONIALS, FAQ_DATA, USE_MODES, WHATSAPP, CONTACT } from "@/lib/content";
import Chat from "./Chat";

export default function Landing({ rooms = [], account = null }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const approved = account?.status === "approved";

  useEffect(() => {
    const h = () => setScrolled(window.scrollY >= 70);
    h(); window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll(".reveal,.reveal-fade");
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goReservar = () => router.push(approved ? "/reservar" : account ? "/conta" : "/cadastro");
  const navColor = scrolled ? C.ink : "#fff";

  return (
    <div style={{ fontFamily: F.body, background: C.bg, minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:66,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:scrolled?"rgba(255,255,255,0.9)":"transparent",backdropFilter:scrolled?"blur(18px)":"none",borderBottom:scrolled?`1px solid ${C.line}`:"1px solid transparent",transition:"background .3s,border-color .3s"}}>
        <a href="#top" style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:11,textDecoration:"none"}}>
          <LogoMark s={38} /><Wordmark color={navColor} size={21} />
        </a>
        <div className="nav-links" style={{display:"flex",gap:28,alignItems:"center"}}>
          {[["Salas","#salas"],["Como funciona","#como"],["Planos","#planos"],["FAQ","#faq"]].map(([l,id])=>(
            <a key={l} href={id} style={{color:navColor,textDecoration:"none",fontSize:14.5,fontWeight:500,opacity:0.9}}>{l}</a>
          ))}
          {account ? (
            <a href="/conta" style={{display:"flex",alignItems:"center",gap:7,background:scrolled?C.lilacSoft:"rgba(255,255,255,0.14)",color:navColor,border:"none",borderRadius:10,padding:"8px 14px",fontSize:13.5,cursor:"pointer",fontWeight:600,textDecoration:"none"}}>
              <Ic n="user" s={17} c={navColor} /> Minha conta
            </a>
          ) : (
            <a href="/entrar" style={{color:navColor,fontSize:14,cursor:"pointer",fontWeight:600,textDecoration:"none"}}>Entrar</a>
          )}
          <button onClick={goReservar} style={{...btnPrimary,padding:"11px 22px",fontSize:14.5,display:"flex",alignItems:"center",gap:7}}>
            Reservar <Ic n="arrowR" s={17} c="#fff" />
          </button>
        </div>
        <button className="hamburger" onClick={()=>setMenu(m=>!m)} style={{background:"none",border:"none",cursor:"pointer",color:navColor,display:"none",alignItems:"center",padding:4}}>
          <Ic n={menu?"x":"menu"} s={26} c={navColor} />
        </button>
        {menu && (
          <div style={{position:"absolute",top:66,left:0,right:0,background:"#fff",boxShadow:SH.lg,padding:24,display:"flex",flexDirection:"column",gap:14,zIndex:300}}>
            {[["Salas","#salas"],["Como funciona","#como"],["Planos","#planos"],["FAQ","#faq"]].map(([l,id])=>(
              <a key={l} href={id} onClick={()=>setMenu(false)} style={{color:C.ink,textDecoration:"none",fontWeight:600,fontSize:16}}>{l}</a>
            ))}
            <a href={account?"/conta":"/entrar"} style={{color:C.ink,textDecoration:"none",fontWeight:600,fontSize:16}}>{account?"Minha conta":"Entrar / Cadastrar"}</a>
            <button onClick={goReservar} style={{...btnPrimary,padding:14,fontSize:16}}>Reservar agora</button>
          </div>
        )}
      </nav>

      <span id="top" />
      {/* HERO */}
      <section style={{background:`linear-gradient(150deg, ${C.navyDeep} 0%, ${C.navy} 42%, ${C.indigo} 100%)`,minHeight:"100vh",display:"flex",alignItems:"center",padding:"120px 24px 70px",position:"relative",overflow:"hidden"}}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          <g fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.4">
            <path d="M-100 300 Q400 60 900 260 T1600 200"/><path d="M-100 360 Q400 120 900 320 T1600 260"/><path d="M-100 420 Q400 180 900 380 T1600 320"/>
          </g>
          <circle className="vp-float" cx="1230" cy="200" r="240" fill={C.teal} fillOpacity="0.14"/>
          <circle className="vp-float2" cx="180" cy="760" r="200" fill={C.coral} fillOpacity="0.12"/>
        </svg>
        <div className="hero-grid" style={{maxWidth:1180,margin:"0 auto",display:"grid",gridTemplateColumns:"1.15fr 0.85fr",gap:56,alignItems:"center",position:"relative",zIndex:1,width:"100%"}}>
          <div>
            <h1 className="vp-anim" style={{fontFamily:F.display,color:"#fff",fontSize:"clamp(36px,5.4vw,62px)",fontWeight:600,lineHeight:1.08,marginBottom:22,letterSpacing:"-0.02em",animationDelay:".05s"}}>
              Seu consultório ideal,<br/><span style={{color:"#7FE3D0",fontStyle:"italic"}}>quando e como precisar</span>
            </h1>
            <p className="vp-anim" style={{color:"rgba(255,255,255,0.82)",fontSize:"clamp(16px,2vw,18.5px)",lineHeight:1.7,marginBottom:34,maxWidth:520,animationDelay:".15s"}}>
              Salas planejadas e equipadas para profissionais da saúde, bem-estar e estética. Mais praticidade para atender. Mais liberdade para cuidar.
            </p>
            <div className="vp-anim" style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:44,animationDelay:".25s"}}>
              <button onClick={goReservar} style={{...btnPrimary,padding:"16px 32px",fontSize:16,display:"flex",alignItems:"center",gap:9}}>Quero me cadastrar <Ic n="arrowR" s={18} c="#fff"/></button>
              <a href="#salas" style={{background:"rgba(255,255,255,0.1)",color:"#fff",border:"1px solid rgba(255,255,255,0.28)",borderRadius:12,padding:"16px 28px",fontSize:16,fontWeight:600,textDecoration:"none",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",gap:8}}>Ver salas</a>
            </div>
            <div className="vp-anim" style={{display:"flex",gap:"clamp(20px,4vw,44px)",flexWrap:"wrap",paddingTop:32,borderTop:"1px solid rgba(255,255,255,0.15)",animationDelay:".35s"}}>
              {[["12","Salas equipadas"],["16","Vagas de estacionamento"],["24/7","Assistente Vi"]].map(([n,l])=>(
                <div key={l} style={{color:"#fff"}}>
                  <div style={{fontFamily:F.display,fontSize:"clamp(24px,3vw,32px)",fontWeight:600,color:"#7FE3D0"}}>{n}</div>
                  <div style={{fontSize:12.5,opacity:0.72,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-video vp-anim" style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:24,padding:16,backdropFilter:"blur(10px)",boxShadow:SH.xl,animationDelay:".2s"}}>
            <div style={{aspectRatio:"4/5",borderRadius:16,background:`linear-gradient(160deg, ${C.indigo}, ${C.navyDeep})`,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <svg viewBox="0 0 300 375" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
                <g fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.3"><path d="M-20 120 Q120 40 300 110"/><path d="M-20 150 Q120 70 300 140"/><path d="M-20 180 Q120 100 300 170"/></g>
                <path d="M0 250 Q100 220 180 260 T320 250 V375 H0Z" fill={C.teal} fillOpacity="0.5"/>
                <path d="M150 300 Q230 260 320 300 V375 H150Z" fill={C.coral} fillOpacity="0.45"/>
              </svg>
              <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
                <span className="vp-pulse-ring"/>
                <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.95)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 10px 30px rgba(0,0,0,0.25)",position:"relative"}}>
                  <Ic n="play" s={26} c={C.navy}/>
                </div>
              </div>
              <div style={{color:"#fff",fontSize:14,fontWeight:600,marginTop:16,zIndex:1}}>Conheça em 60 segundos</div>
              <div style={{color:"rgba(255,255,255,0.6)",fontSize:12,marginTop:3,zIndex:1}}>Vídeo de apresentação (a inserir)</div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" style={{padding:"90px 24px",background:C.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:56}}>
            <Eyebrow>Simples e seguro</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:C.ink,marginTop:12,letterSpacing:"-0.02em"}}>Como funciona</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:20}}>
            {HOW.map(({n,icon,t,d},i)=>(
              <div key={n} className="reveal" style={{background:C.bg,borderRadius:20,padding:"30px 26px",border:`1px solid ${C.line}`,position:"relative",transitionDelay:`${i*90}ms`}}>
                <div style={{position:"absolute",top:22,right:24,fontFamily:F.display,fontSize:34,fontWeight:600,color:C.line}}>{n}</div>
                <div style={{width:54,height:54,borderRadius:15,background:"#fff",border:`1px solid ${C.line}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:SH.sm}}><Ic n={icon} s={26} c={C.teal}/></div>
                <h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink,marginBottom:9}}>{t}</h3>
                <p style={{color:C.slate,lineHeight:1.65,fontSize:14}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section style={{padding:"90px 24px",background:`linear-gradient(160deg, ${C.navyDeep}, ${C.indigoDeep})`,position:"relative",overflow:"hidden"}}>
        <svg viewBox="0 0 1440 600" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}><g fill="none" stroke="#fff" strokeOpacity="0.05" strokeWidth="1.3"><path d="M-50 200 Q400 40 900 200 T1500 160"/><path d="M-50 260 Q400 100 900 260 T1500 220"/></g></svg>
        <div style={{maxWidth:1120,margin:"0 auto",position:"relative"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:56}}>
            <Eyebrow>Por que a Vidah Prime</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:"#fff",marginTop:12,letterSpacing:"-0.02em"}}>Feito para a saúde, o bem-estar e a estética</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:18}}>
            {DIFERENCIAIS.map(({icon,t,d},i)=>(
              <div key={t} className="reveal" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:18,padding:"26px 24px",transitionDelay:`${i*80}ms`}}>
                <div style={{width:50,height:50,borderRadius:14,background:"rgba(127,227,208,0.14)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Ic n={icon} s={25} c="#7FE3D0"/></div>
                <h3 style={{fontFamily:F.display,fontSize:18,fontWeight:600,marginBottom:8,color:"#fff"}}>{t}</h3>
                <p style={{color:"rgba(255,255,255,0.72)",fontSize:13.5,lineHeight:1.65}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SALAS */}
      <section id="salas" style={{padding:"90px 24px",background:C.bg}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:52}}>
            <Eyebrow>Nossos espaços</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:C.ink,marginTop:12,marginBottom:14,letterSpacing:"-0.02em"}}>Nossas salas</h2>
            <p style={{color:C.slate,fontSize:16,maxWidth:620,margin:"0 auto",lineHeight:1.6}}>Salas planejadas para diferentes especialidades e práticas, com estrutura profissional, conforto e recursos pensados para cada tipo de atendimento.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:24}}>
            {rooms.map((r,i)=>(
              <div key={r.id} className="reveal-fade" style={{background:C.white,borderRadius:22,overflow:"hidden",boxShadow:SH.md,border:`1px solid ${C.line}`,transitionDelay:`${i*70}ms`}}>
                <RoomTile room={r}>
                  <span style={{position:"absolute",top:14,left:14,background:"rgba(255,255,255,0.9)",color:r.accent,fontSize:11.5,fontWeight:700,padding:"5px 12px",borderRadius:100}}>{r.category}</span>
                  <span style={{position:"absolute",top:14,right:14,display:"inline-flex",alignItems:"center",gap:5,background:"rgba(0,0,0,0.28)",color:"#fff",fontSize:10.5,fontWeight:600,padding:"5px 10px",borderRadius:100}}><Ic n="eye" s={13} c="#fff"/> foto a inserir</span>
                  {!r.available&&<div style={{position:"absolute",inset:0,background:"rgba(26,23,67,0.55)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{background:C.coral,color:"#fff",padding:"7px 18px",borderRadius:100,fontSize:13,fontWeight:700}}>Em breve</span></div>}
                </RoomTile>
                <div style={{padding:24}}>
                  <h3 style={{fontFamily:F.display,fontSize:19,fontWeight:600,color:C.ink,marginBottom:10}}>{r.name}</h3>
                  <p style={{color:C.slate,fontSize:13.5,lineHeight:1.6,marginBottom:16}}>{r.description}</p>
                  <div style={{borderTop:`1px solid ${C.line}`,paddingTop:14,marginBottom:18}}>
                    <div style={{fontSize:10.5,color:C.faint,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Especialidades</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {(r.specialties||[]).map(s=><span key={s} style={{fontSize:11.5,color:C.indigo,background:C.lilacSoft,padding:"4px 10px",borderRadius:7,fontWeight:500}}>{s}</span>)}
                    </div>
                  </div>
                  <button disabled={!r.available} onClick={goReservar} style={{width:"100%",background:r.available?r.accent:C.line,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:14,fontWeight:700,cursor:r.available?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    {r.available?<>Reservar esta sala <Ic n="arrowR" s={17} c="#fff"/></>:"Em breve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section style={{padding:"90px 24px",background:C.white}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:52}}>
            <Eyebrow>Quem usa, aprova</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:C.ink,marginTop:12,letterSpacing:"-0.02em"}}>Profissionais que confiam na Vidah Prime</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:22}}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={t.name} className="reveal" style={{background:C.bg,borderRadius:20,padding:28,border:`1px solid ${C.line}`,transitionDelay:`${i*80}ms`}}>
                <div style={{marginBottom:16}}><Stars n={5} s={16}/></div>
                <p style={{color:C.ink,fontSize:14,lineHeight:1.75,marginBottom:22}}>&ldquo;{t.text}&rdquo;</p>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.indigo},${C.teal})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13}}>{t.av}</div>
                  <div><div style={{fontWeight:700,color:C.ink,fontSize:13.5}}>{t.name}</div><div style={{color:C.slate,fontSize:12}}>{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" style={{padding:"90px 24px",background:C.bg}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:52}}>
            <Eyebrow>Flexibilidade total</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:C.ink,marginTop:12,marginBottom:14,letterSpacing:"-0.02em"}}>Como você quer usar</h2>
            <p style={{color:C.slate,fontSize:16,maxWidth:600,margin:"0 auto",lineHeight:1.6}}>Do atendimento eventual ao uso recorrente. Escolha o modelo que combina com o ritmo da sua prática. O valor final depende da sala escolhida.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:22,alignItems:"stretch"}}>
            {USE_MODES.map((m,i)=>{
              const hot = m.id==="flex";
              const minPrice = Math.min(...rooms.filter(r=>r.available).map(r=>Number(r.price_hour)));
              return (
                <div key={m.id} className="reveal" style={{background:hot?`linear-gradient(160deg, ${C.navy}, ${C.indigoDeep})`:C.white,border:hot?"none":`1px solid ${C.line}`,borderRadius:22,padding:32,position:"relative",display:"flex",flexDirection:"column",boxShadow:hot?SH.xl:SH.sm,transitionDelay:`${i*90}ms`}}>
                  {m.badge&&<div style={{position:"absolute",top:-13,left:32,background:hot?C.coral:C.teal,color:"#fff",fontSize:11.5,fontWeight:700,padding:"5px 14px",borderRadius:100}}>{m.badge}</div>}
                  <div style={{width:54,height:54,borderRadius:15,background:hot?"rgba(127,227,208,0.14)":C.lilacSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}><Ic n={m.icon} s={26} c={hot?"#7FE3D0":C.indigo}/></div>
                  <h3 style={{fontFamily:F.display,fontSize:22,fontWeight:600,color:hot?"#fff":C.ink,marginBottom:4}}>{m.name}</h3>
                  <p style={{color:hot?"rgba(255,255,255,0.6)":C.faint,fontSize:13,marginBottom:16}}>{m.sub}</p>
                  <p style={{color:hot?"rgba(255,255,255,0.82)":C.slate,fontSize:13.5,lineHeight:1.7,marginBottom:20,flex:1}}>{m.desc}</p>
                  {m.id==="avulso" ? (
                    <div style={{background:C.bg,borderRadius:11,padding:"11px 14px",fontSize:12.5,color:C.slate,marginBottom:22,border:`1px solid ${C.line}`}}>A partir de <strong style={{color:C.ink}}>{money(minPrice)}/hora</strong></div>
                  ) : (
                    <div style={{background:hot?"rgba(127,227,208,0.12)":C.tealSoft,borderRadius:11,padding:"11px 14px",fontSize:12.5,color:hot?"#7FE3D0":C.tealDeep,marginBottom:22,fontWeight:600,display:"flex",gap:8,alignItems:"center"}}><Ic n="checkCircle" s={16} c={hot?"#7FE3D0":C.tealDeep}/> {m.tagline}</div>
                  )}
                  <button onClick={goReservar} style={{width:"100%",background:hot?C.teal:C.indigo,color:"#fff",border:"none",borderRadius:12,padding:14,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Escolher <Ic n="arrowR" s={17} c="#fff"/></button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"90px 24px",background:C.white}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:48}}>
            <Eyebrow>Dúvidas</Eyebrow>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,42px)",fontWeight:600,color:C.ink,marginTop:12,letterSpacing:"-0.02em"}}>Perguntas frequentes</h2>
          </div>
          {FAQ_DATA.map((item,i)=>(
            <div key={i} style={{borderBottom:`1px solid ${C.line}`}}>
              <button onClick={()=>setFaq(faq===i?null:i)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:"20px 0"}}>
                <span style={{fontWeight:600,color:C.ink,fontSize:15.5,paddingRight:16}}>{item.q}</span>
                <span style={{display:"flex",flexShrink:0,transition:"transform .25s",transform:faq===i?"rotate(180deg)":"none"}}><Ic n="chevD" s={20} c={C.teal}/></span>
              </button>
              {faq===i&&<p style={{color:C.slate,fontSize:14.5,lineHeight:1.75,margin:"0 0 20px",paddingRight:32}}>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"70px 24px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",background:`linear-gradient(140deg, ${C.teal}, ${C.tealDeep})`,borderRadius:28,padding:"56px 40px",textAlign:"center",position:"relative",overflow:"hidden",boxShadow:SH.lg}}>
          <svg viewBox="0 0 1000 400" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}><g fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.4"><path d="M-20 120 Q300 20 600 120 T1050 90"/><path d="M-20 170 Q300 70 600 170 T1050 140"/></g><circle cx="850" cy="330" r="160" fill="#fff" fillOpacity="0.06"/></svg>
          <div style={{position:"relative"}}>
            <h2 style={{fontFamily:F.display,fontSize:"clamp(28px,4vw,44px)",fontWeight:600,color:"#fff",marginBottom:16,letterSpacing:"-0.02em"}}>Pronto para elevar sua prática?</h2>
            <p style={{color:"rgba(255,255,255,0.92)",fontSize:17,marginBottom:36,lineHeight:1.6,maxWidth:560,margin:"0 auto 36px"}}>Cadastre-se, envie seus documentos e comece a atender em um espaço à altura dos seus pacientes.</p>
            <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={goReservar} style={{background:"#fff",color:C.tealDeep,border:"none",borderRadius:12,padding:"16px 34px",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:9}}>Começar cadastro <Ic n="arrowR" s={18} c={C.tealDeep}/></button>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" style={{background:"rgba(255,255,255,0.16)",color:"#fff",border:"1px solid rgba(255,255,255,0.35)",textDecoration:"none",borderRadius:12,padding:"16px 30px",fontSize:16,fontWeight:600,display:"inline-flex",alignItems:"center",gap:9}}><Ic n="whatsapp" s={19} c="#fff"/> WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:C.navyDeep,color:"rgba(255,255,255,0.65)",padding:"60px 24px 30px"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:40,marginBottom:44}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><LogoMark s={34}/><Wordmark color="#fff" size={19}/></div>
              <p style={{fontSize:13,lineHeight:1.8}}>Coworking para profissionais da saúde, bem-estar e estética. Estrutura completa, cadastro verificado e flexibilidade para atender.</p>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                <a href="https://instagram.com/vidahprime" target="_blank" rel="noreferrer" style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="instagram" s={18} c="#fff"/></a>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="whatsapp" s={18} c="#fff"/></a>
              </div>
            </div>
            <div>
              <h4 style={{color:"#fff",fontWeight:600,marginBottom:14,fontSize:14}}>Navegação</h4>
              {[["Salas","#salas"],["Como funciona","#como"],["Planos","#planos"],["FAQ","#faq"]].map(([l,h])=><div key={l} style={{marginBottom:9,fontSize:13}}><a href={h} style={{textDecoration:"none",color:"inherit"}}>{l}</a></div>)}
            </div>
            <div>
              <h4 style={{color:"#fff",fontWeight:600,marginBottom:14,fontSize:14}}>Salas</h4>
              {["Sala Clínica","Sala Conecta","Sala Odontológica","Sala Meeting"].map(i=><div key={i} style={{marginBottom:9,fontSize:13}}>{i}</div>)}
            </div>
            <div>
              <h4 style={{color:"#fff",fontWeight:600,marginBottom:14,fontSize:14}}>Contato</h4>
              <div style={{fontSize:13,marginBottom:10,display:"flex",gap:8,alignItems:"flex-start"}}><Ic n="pin" s={15} c="#7FE3D0"/> {CONTACT.address}</div>
              <div style={{fontSize:13,marginBottom:10,display:"flex",gap:8,alignItems:"center"}}><Ic n="phone" s={15} c="#7FE3D0"/> {CONTACT.phone}</div>
              <div style={{fontSize:13,marginBottom:10,display:"flex",gap:8,alignItems:"center"}}><Ic n="whatsapp" s={15} c="#7FE3D0"/> {CONTACT.whats}</div>
              <div style={{fontSize:13,display:"flex",gap:8,alignItems:"center"}}><Ic n="mail" s={15} c="#7FE3D0"/> {CONTACT.email}</div>
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:28,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12,fontSize:12}}>
            <span>© 2026 Vidah Prime · Espaço de saúde</span>
            <span style={{display:"flex",gap:20}}><a href="/entrar" style={{color:"rgba(255,255,255,0.5)",textDecoration:"none"}}>Entrar</a><a href="/admin" style={{color:"rgba(255,255,255,0.5)",textDecoration:"none"}}>Admin</a></span>
          </div>
        </div>
      </footer>

      <Chat onReservar={goReservar} />
    </div>
  );
}
