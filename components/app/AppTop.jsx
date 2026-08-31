import { C, SH, Ic, LogoMark, Wordmark } from "@/components/brand";

export default function AppTop({ right }) {
  return (
    <header style={{position:"sticky",top:0,zIndex:100,height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:"rgba(255,255,255,0.92)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${C.line}`}}>
      <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
        <Wordmark color={C.plum} size={20} />
      </a>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        {right}
        <a href="/" style={{display:"flex",alignItems:"center",gap:6,color:C.slate,fontSize:13,textDecoration:"none"}}>
          <Ic n="arrowL" s={16} c={C.slate}/> Voltar ao site
        </a>
      </div>
    </header>
  );
}
