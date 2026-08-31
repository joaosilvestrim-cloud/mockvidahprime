// Tokens de marca + componentes visuais puros (sem hooks → server e client).
import React from "react";

export const C = {
  indigo:"#4E4B8E", indigoDeep:"#35326B", navy:"#26235E", navyDeep:"#1A1743",
  teal:"#14A08B", tealDeep:"#0C7264", tealSoft:"#E4F5F1",
  coral:"#E86B5E", coralDeep:"#CC4D45", coralSoft:"#FCECE9",
  lilac:"#7B6FB0", lilacSoft:"#EEEBF7",
  ink:"#211E43", slate:"#6E6A88", faint:"#9C99B4",
  line:"#E6E3F1", lineSoft:"#F0EEF8",
  bg:"#F5F4FA", card:"#FFFFFF", white:"#FFFFFF",
};
export const SH = {
  sm:"0 1px 2px rgba(38,35,94,0.06)",
  md:"0 6px 20px rgba(38,35,94,0.08)",
  lg:"0 18px 48px rgba(38,35,94,0.14)",
  xl:"0 30px 70px rgba(38,35,94,0.22)",
};
export const F = { display:"'Fraunces',Georgia,serif", body:"'Inter',system-ui,sans-serif" };
export const money = (n) => "R$ " + Number(n||0).toFixed(2).replace(".",",");

export const ICONS = {
  arrowR:{p:["M5 12h14","M13 6l6 6-6 6"]},
  arrowL:{p:["M19 12H5","M11 18l-6-6 6-6"]},
  chevD:{p:["M6 9l6 6 6-6"]},
  chevR:{p:["M9 6l6 6-6 6"]},
  check:{p:["M20 6L9 17l-5-5"]},
  checkCircle:{c:[{cx:12,cy:12,r:9}],p:["M8.5 12.5l2.4 2.4 4.6-5.1"]},
  menu:{p:["M4 7h16","M4 12h16","M4 17h16"]},
  x:{p:["M6 6l12 12","M18 6L6 18"]},
  user:{c:[{cx:12,cy:8,r:4}],p:["M4.5 20.5c1.4-3.4 4.4-5 7.5-5s6.1 1.6 7.5 5"]},
  userCheck:{c:[{cx:10,cy:8,r:4}],p:["M2.5 20.5c1.3-3.2 4-4.8 7-5","M16 12l2 2 4-4"]},
  shield:{p:["M12 3l7 2.6v5.9c0 4.3-3 7.2-7 8.5-4-1.3-7-4.2-7-8.5V5.6z","M9 12l2 2 4-4.5"]},
  droplet:{p:["M12 3.5c2.5 3 6 6.4 6 9.9a6 6 0 0 1-12 0c0-3.5 3.5-6.9 6-9.9z"]},
  doc:{p:["M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z","M14 3v4.5h4.5","M9 13h6","M9 16.5h6"]},
  pin:{c:[{cx:12,cy:10.5,r:2.4}],p:["M12 21.5c4.4-4 7-7.4 7-11a7 7 0 1 0-14 0c0 3.6 2.6 7 7 11z"]},
  chat:{p:["M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3.5v-3.5A1.5 1.5 0 0 1 4 15.5v-9z","M8 10h8","M8 13h5"]},
  spark:{p:["M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6z"]},
  card:{p:["M3 6.5h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z","M2 10h20","M6 14h4"]},
  clock:{c:[{cx:12,cy:12,r:9}],p:["M12 7.5v5l3.5 2"]},
  cal:{p:["M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z","M4 9.5h16","M8.5 3v4","M15.5 3v4"]},
  calCheck:{p:["M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z","M4 9.5h16","M8.5 3v4","M15.5 3v4","M9 15l2 2 4-4"]},
  play:{fill:true,p:["M8 5.2v13.6a1 1 0 0 0 1.5.87l11-6.8a1 1 0 0 0 0-1.7l-11-6.8A1 1 0 0 0 8 5.2z"]},
  star:{fill:true,p:["M12 2.6l2.85 5.9 6.5.9-4.7 4.5 1.15 6.4L12 17.6 6.2 20.7l1.15-6.4L2.65 9.4l6.5-.9z"]},
  search:{c:[{cx:11,cy:11,r:7}],p:["M20.5 20.5l-4.2-4.2"]},
  searchCheck:{c:[{cx:11,cy:11,r:7}],p:["M20.5 20.5l-4.2-4.2","M8.5 11l2 2 3.5-3.5"]},
  plus:{p:["M12 5v14","M5 12h14"]},
  download:{p:["M12 3.5v11","M8 11l4 4 4-4","M5 20.5h14"]},
  upload:{p:["M12 20.5v-11","M8 13l4-4 4 4","M5 4.5h14"]},
  printer:{p:["M7 8V3.5h10V8","M6 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1","M7 15h10v6H7z"]},
  lock:{p:["M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z","M8.5 11V8a3.5 3.5 0 0 1 7 0v3"]},
  key:{c:[{cx:8,cy:8,r:4.2}],p:["M11 11l9.5 9.5","M17 17l2-2","M20 20l1.5-1.5"]},
  logout:{p:["M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4","M10 12h9.5","M13 8.5l-3.5 3.5 3.5 3.5"]},
  bell:{p:["M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5s2-1.5 2-6.5z","M10 20a2 2 0 0 0 4 0"]},
  info:{c:[{cx:12,cy:12,r:9}],p:["M12 11.5v5","M12 7.7v.2"]},
  building:{p:["M5 21V5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5V21","M3 21h18","M9 8h2","M13 8h2","M9 12h2","M13 12h2","M10.5 21v-4h3v4"]},
  users:{c:[{cx:9,cy:8,r:3.4}],p:["M2.5 20c1-3 3.7-4.5 6.5-4.5s5.5 1.5 6.5 4.5","M16 5.2a3.4 3.4 0 0 1 0 6.4","M17.5 15.6c2 .6 3.4 2 4 4.4"]},
  ruler:{p:["M4 15.5L15.5 4l4.5 4.5L8.5 20z","M8 11.5l2 2","M11 8.5l2 2","M14 5.5l2 2"]},
  sofa:{p:["M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11","M3 11.5a2 2 0 0 1 2 2V17h14v-3.5a2 2 0 0 1 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2v1.5H7V13a2 2 0 0 0-2-2 2 2 0 0 0-2 .5","M6 17v2.5","M18 17v2.5"]},
  palette:{c:[{cx:8.5,cy:11,r:1},{cx:12,cy:7.5,r:1},{cx:15.5,cy:9.5,r:1}],p:["M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-1.8s-.6-1.2-.6-1.9c0-.8.7-1.3 1.6-1.3H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.7 3.5 12 3.5z"]},
  pulse:{p:["M2.5 12.5h4l2.2 6 4-13 2.2 7h6.6"]},
  tooth:{p:["M12 3.5c-1.7-1-4.4-1.2-5.6.6C5 6.2 5.6 10 6.4 13.4c.5 2 .8 4.6 1.5 5.9.6 1 1.7.8 2-.4l1-4c.2-1 1-1 1.2 0l1 4c.3 1.2 1.4 1.4 2 .4.7-1.3 1-3.9 1.5-5.9.8-3.4 1.4-7.2.2-9.3-1.2-1.8-3.9-1.6-5.6-.6z"]},
  present:{p:["M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z","M12 15.5v4","M8.5 20h7","M7.5 12l2.5-2.5 2 2 3.5-3.5"]},
  zap:{fill:true,p:["M13.5 2.2a.5.5 0 0 0-.9-.3L4.3 12.4a.6.6 0 0 0 .47.98H10l-1.5 8.4a.5.5 0 0 0 .9.36l8.3-10.5a.6.6 0 0 0-.47-.98H12z"]},
  phone:{p:["M6.5 4h3l1.5 4-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4 1.5v3a1.8 1.8 0 0 1-1.9 1.8C11.5 19.6 4.4 12.5 4.7 5.9A1.8 1.8 0 0 1 6.5 4z"]},
  mail:{p:["M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z","M3.5 7l8.5 6 8.5-6"]},
  instagram:{c:[{cx:12,cy:12,r:4}],p:["M7.5 3.5h9A4 4 0 0 1 20.5 7.5v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z","M17 6.8v.2"]},
  whatsapp:{p:["M4 20l1.4-4.1a7.5 7.5 0 1 1 2.8 2.7z","M9 8.5c-.3 0-.7.1-.9.5-.3.5-.9 1.4 0 2.9a7 7 0 0 0 3.6 3c1.4.5 1.9.3 2.3.2.5-.1 1.1-.6 1.2-1 .1-.4.1-.8 0-.9l-1.3-.7c-.2-.1-.4 0-.6.2l-.5.6c-.1.1-.2.1-.4 0a5 5 0 0 1-2-1.8c-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3 0-.5l-.6-1.3a.5.5 0 0 0-.4-.3z"]},
  bolt:{fill:true,p:["M13 2.5a.4.4 0 0 0-.75-.2L5.6 12.2a.5.5 0 0 0 .4.8h4.2l-1.2 6.7a.4.4 0 0 0 .74.28l6.65-9.9a.5.5 0 0 0-.4-.78H12z"]},
  wallet:{p:["M4 7.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 18.5H5.5A1.5 1.5 0 0 1 4 17V7.5z","M4 7.5V6a1.5 1.5 0 0 1 1.5-1.5H16","M16.5 12.5h3"]},
  clipboard:{p:["M9 4.5h6M8 6.5H6.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-12a1 1 0 0 0-1-1H16","M9 3.5h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z","M9 12h6","M9 15.5h4"]},
  sliders:{p:["M4 8h10","M18 8h2","M4 16h2","M10 16h10"],c:[{cx:16,cy:8,r:2},{cx:8,cy:16,r:2}]},
  eye:{c:[{cx:12,cy:12,r:2.6}],p:["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"]},
  spinner:{p:["M12 3a9 9 0 1 0 9 9"]},
};

export function Ic({ n, s=20, c="currentColor", sw=1.7, style, className }) {
  const d = ICONS[n]; if (!d) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={d.fill?c:"none"} stroke={d.fill?"none":c}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
      {(d.c||[]).map((cc,i)=><circle key={"c"+i} cx={cc.cx} cy={cc.cy} r={cc.r}/>)}
      {d.p.map((p,i)=><path key={i} d={p}/>)}
    </svg>
  );
}

export function LogoMark({ s=36 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" aria-hidden="true" style={{flexShrink:0}}>
      <defs><clipPath id="lm"><circle cx="20" cy="20" r="20"/></clipPath></defs>
      <g clipPath="url(#lm)">
        <rect width="40" height="40" fill="#4E4B8E"/>
        <g fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.9">
          <path d="M1 11 Q20 1 39 11"/><path d="M1 15 Q20 5 39 15"/><path d="M1 19 Q20 9 39 19"/>
        </g>
        <path d="M0 25 Q12 20.5 22 26.5 T40 24.5 V40 H0 Z" fill="#14A08B"/>
        <path d="M17 30 Q29 21.5 40 29.5 V40 H17 Z" fill="#26235E"/>
        <path d="M0 26.5 Q5 28.5 7 34.5 L0 36.5 Z" fill="#E86B5E"/>
      </g>
    </svg>
  );
}

export function Wordmark({ color=C.navy, size=20 }) {
  return (
    <span style={{fontFamily:F.body,fontWeight:800,fontSize:size,letterSpacing:"-0.02em",lineHeight:1,color,whiteSpace:"nowrap"}}>
      V<span style={{position:"relative",display:"inline-block"}}>ı<span style={{position:"absolute",top:-size*0.08,left:"50%",transform:"translateX(-50%)",width:size*0.15,height:size*0.15,borderRadius:"50%",background:C.coral}}/></span>dah
      <span style={{color:C.teal,fontWeight:600}}> prime</span>
    </span>
  );
}

export function Stars({ n=5, s=15 }) {
  return (
    <span style={{display:"inline-flex",gap:1.5}}>
      {Array.from({length:5}).map((_,i)=><Ic key={i} n="star" s={s} c={i<Math.round(n)?C.coral:C.line}/>)}
    </span>
  );
}

export function Eyebrow({ children }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:8,color:C.teal,fontWeight:700,fontSize:12,letterSpacing:2,textTransform:"uppercase"}}>
      <span style={{width:22,height:2,background:C.teal,borderRadius:2}}/>{children}
    </span>
  );
}

export function RoomTile({ room, h=170, ics=46, children }) {
  const accent = room.accent || C.indigo;
  if (room.image_url) {
    return (
      <div style={{height:h,position:"relative",overflow:"hidden",background:C.navyDeep}}>
        <img src={room.image_url} alt={room.name} loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, rgba(26,23,67,0.35) 0%, rgba(26,23,67,0) 45%)"}}/>
        {children}
      </div>
    );
  }
  return (
    <div style={{height:h,position:"relative",overflow:"hidden",background:`linear-gradient(140deg, ${accent} 0%, ${C.navyDeep} 130%)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <svg viewBox="0 0 300 170" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
        <g fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.3">
          <path d="M-30 70 Q80 -6 200 40 T440 26"/>
          <path d="M-30 96 Q80 20 200 66 T440 52"/>
          <path d="M-30 122 Q80 46 200 92 T440 78"/>
        </g>
        <circle cx="255" cy="140" r="70" fill="#fff" fillOpacity="0.06"/>
      </svg>
      <div style={{width:80,height:80,borderRadius:22,background:"rgba(255,255,255,0.16)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",border:"1px solid rgba(255,255,255,0.25)"}}>
        <Ic n={room.icon||"sofa"} s={ics} c="#fff" sw={1.6}/>
      </div>
      {children}
    </div>
  );
}

export const btnPrimary = { background:C.teal, color:"#fff", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer", fontFamily:F.body, boxShadow:"0 8px 22px rgba(20,160,139,0.32)" };
export const btnGhost = { background:"transparent", color:C.ink, border:`1.5px solid ${C.line}`, borderRadius:12, fontWeight:600, cursor:"pointer", fontFamily:F.body };
