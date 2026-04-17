import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  const revealRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    document.title = 'MANGZONE — نظام إدارة العيادات';
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-vis'); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addRef = (el: HTMLDivElement | null) => { if (el) revealRefs.current.push(el); };

  const go = () => navigate('/login');

  return (
    <div dir="rtl" style={{ fontFamily: "'Cairo',sans-serif", background: '#04040a', color: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        .lp-gt{background:linear-gradient(135deg,#fff 0%,#a78bfa 50%,#818cf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-ot{-webkit-text-stroke:2px rgba(167,139,250,.35);-webkit-text-fill-color:transparent}
        .lp-reveal{opacity:0;transform:translateY(36px);transition:all .8s cubic-bezier(.16,1,.3,1)}
        .lp-vis{opacity:1!important;transform:translateY(0)!important}
        @keyframes lp-blink{0%,100%{opacity:1;box-shadow:0 0 6px #10b981}50%{opacity:.3}}
        @keyframes lp-drift{0%,100%{transform:translateY(0) translateX(-50%)}50%{transform:translateY(-28px) translateX(-50%)}}
        @keyframes lp-rp{0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)}50%{opacity:.35;transform:translate(-50%,-50%) scale(1.04)}}
        @media(max-width:768px){
          .lp-fg{grid-template-columns:1fr!important}
          .lp-rg{grid-template-columns:1fr!important}
          .lp-pi{grid-template-columns:repeat(2,1fr)!important}
          .lp-nav{padding:14px 20px!important}
          .lp-h1{font-size:clamp(38px,11vw,88px)!important;letter-spacing:-1px!important}
          .lp-cta-h{font-size:clamp(40px,12vw,100px)!important;letter-spacing:-1px!important}
          .lp-sec{padding:80px 20px!important}
          .lp-mock-body{grid-template-columns:1fr 1fr!important}
          .lp-mock-full{grid-column:span 2!important}
          .lp-mock-hide{display:none!important}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav" style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'18px 64px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(4,4,10,.8)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#fff',boxShadow:'0 0 24px rgba(124,58,237,.5)'}}>MZ</div>
          <span style={{fontSize:18,fontWeight:900,letterSpacing:1}}>MANGZONE</span>
        </div>
        <button onClick={go} style={{padding:'10px 28px',borderRadius:100,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',fontFamily:"'Cairo',sans-serif",fontSize:14,fontWeight:700,border:'none',cursor:'pointer',boxShadow:'0 0 30px rgba(124,58,237,.4)',transition:'all .25s'}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 0 50px rgba(124,58,237,.7)'}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 0 30px rgba(124,58,237,.4)'}}>
          جرّب الديمو ←
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'140px 24px 100px',position:'relative',overflow:'hidden'}}>
        {/* Grid bg */}
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(124,58,237,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.06) 1px,transparent 1px)',backgroundSize:'60px 60px',WebkitMaskImage:'radial-gradient(ellipse 80% 60% at 50% 50%,black,transparent)'}} />
        {/* Orbs */}
        <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'rgba(124,58,237,.12)',top:-150,left:'50%',filter:'blur(80px)',animation:'lp-drift 8s ease-in-out infinite',pointerEvents:'none'}} />
        <div style={{position:'absolute',width:350,height:350,borderRadius:'50%',background:'rgba(79,70,229,.1)',bottom:50,right:-80,filter:'blur(80px)',animation:'lp-drift 10s ease-in-out infinite reverse',pointerEvents:'none'}} />

        <div style={{position:'relative',zIndex:2,display:'inline-flex',alignItems:'center',gap:8,padding:'8px 20px',borderRadius:100,border:'1px solid rgba(124,58,237,.4)',background:'rgba(124,58,237,.1)',fontSize:13,fontWeight:600,color:'#a78bfa',marginBottom:36}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#10b981',animation:'lp-blink 2s infinite',display:'inline-block'}} />
          النظام جاهز للاستخدام الآن
        </div>

        <h1 className="lp-h1" style={{position:'relative',zIndex:2,fontSize:'clamp(44px,8vw,92px)',fontWeight:900,lineHeight:1.05,letterSpacing:-2,marginBottom:28}}>
          <span className="lp-gt">إدارة عيادتك</span><br/>
          <span className="lp-ot">بذكاء حقيقي</span>
        </h1>

        <p style={{position:'relative',zIndex:2,fontSize:'clamp(15px,2vw,20px)',color:'rgba(248,250,252,.55)',lineHeight:1.8,maxWidth:580,marginBottom:52}}>
          نظام يربط المواعيد، الفواتير، والدفع في مكان واحد.<br/>
          من استقبال المريض حتى استلام الدفعة — كل شيء تحت السيطرة.
        </p>

        <div style={{position:'relative',zIndex:2,display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
          <button onClick={go} style={{padding:'18px 44px',borderRadius:100,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',fontFamily:"'Cairo',sans-serif",fontSize:17,fontWeight:800,border:'none',cursor:'pointer',boxShadow:'0 0 40px rgba(124,58,237,.4)',transition:'all .3s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 0 70px rgba(124,58,237,.7)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(124,58,237,.4)'}}>
            🚀 جرّب الديمو الآن
          </button>
          <a href="#features" style={{padding:'18px 44px',borderRadius:100,background:'transparent',color:'#f8fafc',fontFamily:"'Cairo',sans-serif",fontSize:17,fontWeight:700,border:'1px solid rgba(255,255,255,.12)',textDecoration:'none',transition:'all .3s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(124,58,237,.5)';(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.08)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.12)';(e.currentTarget as HTMLElement).style.background='transparent'}}>
            اكتشف المميزات
          </a>
        </div>

        {/* Dashboard mockup */}
        <div style={{position:'relative',zIndex:2,marginTop:80,width:'100%',maxWidth:980}}>
          <div style={{position:'absolute',inset:-60,background:'radial-gradient(ellipse at center,rgba(124,58,237,.18),transparent 65%)',pointerEvents:'none',zIndex:-1}} />
          <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:24,overflow:'hidden',boxShadow:'0 60px 120px rgba(0,0,0,.7)'}}>
            <div style={{background:'rgba(255,255,255,.03)',padding:'14px 20px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid rgba(255,255,255,.06)'}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:'#ff5f57'}} />
              <div style={{width:10,height:10,borderRadius:'50%',background:'#febc2e'}} />
              <div style={{width:10,height:10,borderRadius:'50%',background:'#28c840'}} />
              <div style={{flex:1,textAlign:'center',fontSize:11,color:'rgba(255,255,255,.22)'}}>mangzone.netlify.app/dashboard</div>
            </div>
            <div className="lp-mock-body" style={{padding:24,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              {[{l:'إجمالي المرضى',v:'21',c:'#a78bfa'},{l:'مواعيد اليوم',v:'6',c:'#f8fafc'},{l:'إيرادات الشهر',v:'1,500',c:'#4ade80'},{l:'فواتير معلقة',v:'3',c:'#60a5fa'}].map(({l,v,c})=>(
                <div key={l} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:18}}>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.35)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>{l}</div>
                  <div style={{fontSize:26,fontWeight:900,color:c}}>{v}</div>
                </div>
              ))}
              <div className="lp-mock-full" style={{gridColumn:'span 4',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.05)',borderRadius:16,padding:16}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginBottom:12,fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>جدول اليوم</div>
                {[{t:'13:00',n:'Ahmed Mohammed',s:'Teeth Cleaning',c:'#4ade80',b:'Arrived ✓'},{t:'15:30',n:'Khaled Abdullah',s:'Zirconia Crown',c:'#a78bfa',b:'Scheduled'},{t:'19:30',n:'Dina Mostafa',s:'Root Canal',c:'#60a5fa',b:'Scheduled'}].map(({t,n,s,c,b})=>(
                  <div key={t} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{fontSize:11,color:'rgba(255,255,255,.35)',width:42,flexShrink:0,direction:'ltr'}}>{t}</span>
                    <div style={{width:30,height:30,borderRadius:'50%',background:`${c}26`,color:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,flexShrink:0}}>{n.split(' ').map(w=>w[0]).join('')}</div>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.85)'}}>{n}</div><div style={{fontSize:10,color:'rgba(255,255,255,.3)'}}>{s}</div></div>
                    <span style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:100,background:`${c}26`,color:c,whiteSpace:'nowrap'}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-sec" style={{padding:'140px 64px',maxWidth:1200,margin:'0 auto'}}>
        <div ref={addRef} className="lp-reveal">
          <div style={{fontSize:11,fontWeight:700,letterSpacing:3,color:'#a78bfa',textTransform:'uppercase',marginBottom:16}}>المميزات</div>
          <h2 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:900,lineHeight:1.1,letterSpacing:-1.5,marginBottom:80}}>
            كل ما تحتاجه<br/><span className="lp-gt">في نظام واحد</span>
          </h2>
          <div className="lp-fg" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.07)',borderRadius:24,overflow:'hidden'}}>
            {[
              {n:'01',t:'تتبّع المرضى بسهولة',d:'ملف طبي كامل — تاريخ الزيارات، العلاجات، الفواتير، والتنبيهات الطبية. كل شيء بضغطة واحدة.'},
              {n:'02',t:'إدارة المواعيد بدون تعقيد',d:'جدول يومي واضح، حجز سريع، ومتابعة حالة كل موعد لحظة بلحظة. لا فوضى، لا تعارض.'},
              {n:'03',t:'تقارير مالية دقيقة',d:'إيرادات، مصروفات، فواتير معلقة، وتحليل شهري كامل. كل الأرقام واضحة ودقيقة.'},
              {n:'04',t:'مساعد ذكي بالعربي',d:'اسأل بالعربي عن أي شيء في العيادة. مدعوم بـ Gemini AI — يرد فوراً.'},
              {n:'05',t:'صلاحيات متعددة وآمنة',d:'ADMIN، طبيب، استقبال، محاسب — كل دور له صلاحياته. أمان تام بـ Supabase RLS.'},
              {n:'06',t:'يعمل من أي جهاز',d:'جوال، تابلت، أو كمبيوتر. في المتصفح مباشرة بدون تثبيت. في أي مكان وأي وقت.'},
            ].map(({n,t,d})=>(
              <div key={n} style={{background:'#04040a',padding:40,transition:'all .3s',cursor:'default'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.04)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#04040a'}}>
                <div style={{fontSize:52,fontWeight:900,background:'linear-gradient(135deg,rgba(124,58,237,.5),rgba(124,58,237,.15))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1,marginBottom:24}}>{n}</div>
                <div style={{fontSize:20,fontWeight:800,marginBottom:12}}>{t}</div>
                <div style={{fontSize:14,color:'rgba(248,250,252,.5)',lineHeight:1.7}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div ref={addRef} className="lp-reveal" style={{padding:'0 64px',marginBottom:0}}>
        <div className="lp-pi" style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.07)',borderRadius:20,overflow:'hidden',borderTop:'1px solid rgba(255,255,255,.07)',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
          {[{n:'21+',l:'مريض مسجّل'},{n:'6',l:'أدوار مختلفة'},{n:'100%',l:'آمن ومحمي'},{n:'∞',l:'قابل للتوسع'}].map(({n,l})=>(
            <div className="pk" key={l} style={{background:'#04040a',padding:'48px 32px',textAlign:'center'}}>
              <div style={{fontSize:56,fontWeight:900,letterSpacing:-2,background:'linear-gradient(135deg,#7c3aed,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{n}</div>
              <div style={{fontSize:14,color:'rgba(248,250,252,.5)',marginTop:8,fontWeight:500}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROLES ── */}
      <section className="lp-sec" style={{padding:'140px 64px',maxWidth:1200,margin:'0 auto'}}>
        <div ref={addRef} className="lp-reveal">
          <div style={{fontSize:11,fontWeight:700,letterSpacing:3,color:'#a78bfa',textTransform:'uppercase',marginBottom:16}}>الأدوار</div>
          <h2 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:900,lineHeight:1.1,letterSpacing:-1.5,marginBottom:48}}>
            نظام مصمم<br/><span className="lp-gt">لكل الفريق</span>
          </h2>
          <div className="lp-rg" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {[
              {i:'👑',t:'المدير — ADMIN',d:'تحكم كامل في كل شيء. المرضى، الفريق، التقارير المالية، والإعدادات.',bg:'rgba(124,58,237,.15)'},
              {i:'🦷',t:'الطبيب',d:'يرى مواعيده ومرضاه فقط. ملفات طبية كاملة وخطط علاج منظّمة.',bg:'rgba(16,185,129,.15)'},
              {i:'📋',t:'الاستقبال',d:'حجز مواعيد، استقبال مرضى جدد، ومتابعة الجدول اليومي بسهولة تامة.',bg:'rgba(59,130,246,.15)'},
              {i:'💰',t:'المحاسب',d:'فواتير، دفعات، مصروفات، وتقارير مالية شاملة. بدون الوصول للملفات الطبية.',bg:'rgba(251,191,36,.15)'},
            ].map(({i,t,d,bg})=>(
              <div key={t} style={{padding:28,borderRadius:18,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'flex-start',gap:18,transition:'all .3s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(124,58,237,.4)';(e.currentTarget as HTMLElement).style.background='rgba(124,58,237,.05)';(e.currentTarget as HTMLElement).style.transform='translateX(-4px)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,.07)';(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.03)';(e.currentTarget as HTMLElement).style.transform=''}}>
                <div style={{width:52,height:52,borderRadius:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,background:bg}}>{i}</div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,marginBottom:8}}>{t}</div>
                  <div style={{fontSize:13,color:'rgba(248,250,252,.5)',lineHeight:1.6}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={addRef} className="lp-reveal" style={{padding:'160px 64px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:800,height:800,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.12),transparent 60%)',pointerEvents:'none'}} />
        {[420,640,860].map(s=>(
          <div key={s} style={{position:'absolute',top:'50%',left:'50%',width:s,height:s,borderRadius:'50%',border:'1px solid rgba(124,58,237,.12)',animation:`lp-rp 3s ease-in-out infinite`,animationDelay:`${(s-420)/220}s`,pointerEvents:'none',transform:'translate(-50%,-50%)'}} />
        ))}
        <h2 className="lp-cta-h" style={{position:'relative',zIndex:1,fontSize:'clamp(44px,9vw,108px)',fontWeight:900,lineHeight:1,letterSpacing:-3,marginBottom:32}}>
          <span className="lp-gt">جرّب</span><br/>الديمو<br/><span className="lp-ot">الآن</span>
        </h2>
        <p style={{position:'relative',zIndex:1,fontSize:18,color:'rgba(248,250,252,.5)',marginBottom:52}}>ادخل وجرّب كل المميزات — بدون أي التزام</p>
        <div style={{position:'relative',zIndex:1}}>
          <button onClick={go} style={{padding:'22px 56px',borderRadius:100,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',color:'#fff',fontFamily:"'Cairo',sans-serif",fontSize:20,fontWeight:800,border:'none',cursor:'pointer',boxShadow:'0 0 40px rgba(124,58,237,.4)',transition:'all .3s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 0 70px rgba(124,58,237,.7)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 0 40px rgba(124,58,237,.4)'}}>
            🚀 ابدأ الآن مجاناً
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{padding:'40px 64px',borderTop:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#7c3aed,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#fff'}}>MZ</div>
          <span style={{fontSize:16,fontWeight:900,letterSpacing:1}}>MANGZONE</span>
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.2)'}}>نظام إدارة عيادات — صُنع بـ ❤️ في مصر</div>
      </footer>
    </div>
  );
}
