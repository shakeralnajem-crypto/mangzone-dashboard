import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MZLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" direction="ltr" style={{ direction: 'ltr' }}>
      {/* M — top-left, large serif italic, soft purple */}
      <text x="2" y="62" fontSize="66" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="400" fill="#7C6FD4" direction="ltr" unicodeBidi="plaintext">M</text>
      {/* / — teal diagonal line */}
      <line x1="50" y1="8" x2="62" y2="92" stroke="#0EA572" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Z — bottom-right, slightly smaller */}
      <text x="44" y="96" fontSize="58" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="400" fill="#7C6FD4" direction="ltr" unicodeBidi="plaintext">Z</text>
    </svg>
  );
}

const FEATURES = [
  { n: '01', t: 'تتبّع المرضى', d: 'ملف طبي كامل — تاريخ الزيارات، العلاجات، الفواتير، والتنبيهات الطبية.' },
  { n: '02', t: 'إدارة المواعيد', d: 'جدول يومي واضح، حجز سريع، ومتابعة حالة كل موعد لحظة بلحظة.' },
  { n: '03', t: 'تقارير مالية', d: 'إيرادات، مصروفات، فواتير معلقة، وتحليل شهري كامل ودقيق.' },
  { n: '04', t: 'مساعد ذكي AI', d: 'اسأل بالعربي عن أي شيء في العيادة. مدعوم بـ Gemini AI — يرد فوراً.' },
  { n: '05', t: 'صلاحيات آمنة', d: 'ADMIN، طبيب، استقبال، محاسب — كل دور له صلاحياته الخاصة.' },
  { n: '06', t: 'من أي جهاز', d: 'جوال، تابلت، أو كمبيوتر. في المتصفح بدون تثبيت. في أي مكان.' },
];

const STEPS = [
  { n: '01', t: 'أنشئ حسابك', d: 'سجّل الدخول وأضف بيانات العيادة في دقيقتين. لا تثبيت، لا إعداد معقد.' },
  { n: '02', t: 'أضف فريقك', d: 'أضف أطباءك، موظفي الاستقبال، والمحاسبين. كل واحد له صلاحياته.' },
  { n: '03', t: 'ابدأ الإدارة', d: 'سجّل المرضى، احجز المواعيد، وتابع الفواتير — كل شيء من مكان واحد.' },
];

const TESTIMONIALS = [
  { name: 'د. أحمد العمري', role: 'طبيب أسنان — القاهرة', text: 'النظام غيّر طريقة إدارة عيادتي بالكامل. الآن أتابع كل شيء من هاتفي.', stars: 5 },
  { name: 'د. سارة محمد', role: 'طبيبة — الإسكندرية', text: 'التقارير المالية وفّرت علي ساعات من العمل اليدوي كل أسبوع. ممتاز جداً.', stars: 5 },
  { name: 'أ. خالد الرشيد', role: 'مدير عيادة — الرياض', text: 'سهل الاستخدام ويعمل بسلاسة على الجوال والكمبيوتر. الدعم سريع وممتاز.', stars: 5 },
];

const FAQS = [
  { q: 'هل يعمل النظام بدون إنترنت؟', a: 'النظام يعمل عبر المتصفح ويحتاج اتصالاً بالإنترنت، لكن تصميمه سريع حتى مع اتصال بطيء.' },
  { q: 'هل بياناتنا آمنة؟', a: 'نعم. البيانات محمية بـ Supabase Row Level Security وتشفير كامل. كل مستخدم يرى فقط ما يخصه.' },
  { q: 'كم يستغرق الإعداد؟', a: 'الإعداد الأساسي يأخذ أقل من 5 دقائق. إضافة المرضى والفريق تتم بالاستيراد أو يدوياً.' },
  { q: 'هل يدعم اللغة العربية؟', a: 'نعم، النظام يدعم اللغة العربية بشكل كامل مع تصميم RTL احترافي.' },
];

const ROLES = [
  { i: '👑', t: 'المدير — ADMIN', d: 'تحكم كامل في كل شيء. المرضى، الفريق، التقارير المالية، والإعدادات.', bg: 'rgba(108,77,196,.1)' },
  { i: '🦷', t: 'الطبيب', d: 'يرى مواعيده ومرضاه فقط. ملفات طبية كاملة وخطط علاج منظّمة.', bg: 'rgba(14,165,114,.1)' },
  { i: '📋', t: 'الاستقبال', d: 'حجز مواعيد، استقبال مرضى جدد، ومتابعة الجدول اليومي بسهولة.', bg: 'rgba(0,87,255,.1)' },
  { i: '💰', t: 'المحاسب', d: 'فواتير، دفعات، مصروفات، وتقارير مالية شاملة بدون الملفات الطبية.', bg: 'rgba(245,158,11,.1)' },
];

const MARQUEE_TAGS = [
  { ic: '🏥', t: 'إدارة المرضى' }, { ic: '📅', t: 'جدولة المواعيد' },
  { ic: '💰', t: 'الفواتير والدفعات' }, { ic: '📊', t: 'التقارير المالية' },
  { ic: '🤖', t: 'مساعد AI عربي' }, { ic: '🔐', t: 'أمان تام' },
  { ic: '👥', t: 'إدارة الفريق' }, { ic: '📱', t: 'يعمل على الهاتف' },
  { ic: '⚡', t: 'سريع وموثوق' }, { ic: '🦷', t: 'مخصص للعيادات' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  const go = () => navigate('/login');
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // Reveal animations
  useEffect(() => {
    document.title = 'MANGZONE — نظام إدارة العيادات';
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('lpv'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lpr').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // KPI counters
  useEffect(() => {
    function cnt(id: string, to: number, sfx = '', dur = 1200) {
      const el = document.getElementById(id);
      if (!el) return;
      const s = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - s) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to) + sfx;
        if (p < 1) requestAnimationFrame(tick);
      };
      tick();
    }
    const t = setTimeout(() => { cnt('k1', 21); cnt('k2', 6); cnt('k3', 1500); cnt('k4', 3); cnt('rv', 1500); }, 300);
    return () => clearTimeout(t);
  }, []);

  // Stats counters on scroll
  useEffect(() => {
    function cnt(id: string, to: number, sfx = '') {
      const el = document.getElementById(id);
      if (!el) return;
      const s = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - s) / 1600, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to) + sfx;
        if (p < 1) requestAnimationFrame(tick);
      };
      tick();
    }
    let done = false;
    const el = document.getElementById('nums');
    if (!el) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && !done) { done = true; cnt('n1', 21, '+'); cnt('n2', 6); cnt('n3', 100, '%'); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Revenue bars
  useEffect(() => {
    const bel = barsRef.current;
    if (!bel) return;
    const vals = [28, 42, 35, 60, 48, 75, 65, 80];
    const cols = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#0057ff'];
    vals.forEach((v, i) => {
      const b = document.createElement('div');
      b.style.cssText = `height:${v}%;background:${cols[i]};flex:1;border-radius:3px 3px 0 0;animation:lpGrowUp .8s ${i * 0.08}s ease both`;
      bel.appendChild(b);
    });
  }, []);

  // Marquee
  useEffect(() => {
    const track = marqueeRef.current;
    if (!track || track.childElementCount > 0) return;
    [...MARQUEE_TAGS, ...MARQUEE_TAGS].forEach(({ ic, t }) => {
      const el = document.createElement('div');
      el.className = 'lp-mtag';
      el.innerHTML = `<span style="font-size:17px">${ic}</span>${t}`;
      track.appendChild(el);
    });
  }, []);

  // Nav shadow
  useEffect(() => {
    const handler = () => {
      const nav = document.getElementById('lpnav');
      if (nav) nav.style.boxShadow = window.scrollY > 10 ? (dark ? '0 4px 20px rgba(0,0,0,.4)' : '0 4px 20px rgba(0,87,255,.06)') : 'none';
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [dark]);

  const th = dark ? 'dark' : 'light';

  return (
    <div dir="rtl" data-lp={th} style={{ fontFamily: "'Cairo',sans-serif", background: dark ? '#0d1117' : '#fff', color: dark ? '#f0f6fc' : '#060b1a', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        [data-lp="light"]{--bg:#fff;--bg2:#f8fafc;--bg3:#f1f5f9;--txt:#060b1a;--txt2:#475569;--txt3:#94a3b8;--brd:#e2e8f0;--blue:#0057ff;--blue2:#003acc;--blue3:#e8efff;--card:#fff;--shadow:rgba(0,87,255,.08)}
        [data-lp="dark"]{--bg:#0d1117;--bg2:#161b22;--bg3:#21262d;--txt:#f0f6fc;--txt2:#8b949e;--txt3:#6e7681;--brd:#30363d;--blue:#5b9cf6;--blue2:#4080e8;--blue3:#1a2d50;--card:#161b22;--shadow:rgba(0,0,0,.4)}

        /* NAV */
        .lpnav{position:fixed;top:0;inset-inline:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:14px 72px;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(20px);border-bottom:1px solid var(--brd);transition:box-shadow .3s}
        .lplogo{display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none}
        .lplogo-text{font-size:18px;font-weight:900;letter-spacing:.5px;color:var(--txt)}
        .lpnav-links{display:flex;gap:32px}
        .lpnl{font-size:14px;font-weight:600;color:var(--txt2);background:none;border:none;cursor:pointer;font-family:'Cairo',sans-serif;transition:color .2s;padding:0}
        .lpnl:hover{color:var(--blue)}
        .lpnav-right{display:flex;align-items:center;gap:12px}
        .lp-theme-btn{width:36px;height:36px;border-radius:50%;border:1.5px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .lp-theme-btn:hover{border-color:var(--blue);background:var(--blue3)}
        .lpncta{padding:10px 26px;border-radius:100px;background:var(--blue);color:#fff;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 14px var(--shadow)}
        .lpncta:hover{background:var(--blue2);transform:translateY(-2px)}

        /* HERO */
        .lp-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:130px 40px 60px;position:relative;overflow:hidden;background:var(--bg)}
        .lp-grid{position:absolute;inset:0;background-image:linear-gradient(var(--brd) 1px,transparent 1px),linear-gradient(90deg,var(--brd) 1px,transparent 1px);background-size:52px 52px;opacity:.5;mask-image:radial-gradient(ellipse 75% 65% at 50% 40%,black,transparent);pointer-events:none}
        .lp-hero-logo{position:relative;z-index:3;margin-bottom:24px;animation:lpFade .6s ease both}
        .lp-badge{position:relative;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:100px;background:var(--blue3);border:1px solid color-mix(in srgb,var(--blue) 30%,transparent);font-size:13px;font-weight:700;color:var(--blue);margin-bottom:28px;animation:lpFade .6s .1s ease both}
        .lp-bd{width:7px;height:7px;border-radius:50%;background:var(--blue);flex-shrink:0;animation:lpBdPulse 1.8s ease-in-out infinite}
        @keyframes lpBdPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--blue) 40%,transparent)}70%{box-shadow:0 0 0 8px transparent}}
        .lp-h1{position:relative;z-index:3;font-size:clamp(44px,7vw,92px);font-weight:900;line-height:1.04;letter-spacing:-2.5px;margin-bottom:22px;animation:lpFade .6s .2s ease both}
        .lp-blue{color:var(--blue)}
        .lp-stroke{-webkit-text-stroke:2.5px var(--blue);color:transparent}
        .lp-sub{position:relative;z-index:3;font-size:clamp(15px,1.7vw,19px);color:var(--txt2);line-height:1.8;max-width:540px;margin:0 auto 44px;animation:lpFade .6s .3s ease both}
        .lp-hbtns{position:relative;z-index:3;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:72px;animation:lpFade .6s .4s ease both}
        .lp-bp{padding:16px 42px;border-radius:100px;background:var(--blue);color:#fff;font-family:'Cairo',sans-serif;font-size:16px;font-weight:800;border:none;cursor:pointer;box-shadow:0 6px 20px var(--shadow);transition:all .25s}
        .lp-bp:hover{background:var(--blue2);transform:translateY(-3px);box-shadow:0 10px 30px var(--shadow)}
        .lp-bs{padding:16px 42px;border-radius:100px;background:transparent;color:var(--txt);font-family:'Cairo',sans-serif;font-size:16px;font-weight:700;border:1.5px solid var(--brd);cursor:pointer;transition:all .25s}
        .lp-bs:hover{border-color:var(--blue);color:var(--blue);background:var(--blue3);transform:translateY(-3px)}
        @keyframes lpFade{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        /* MOCKUP */
        .lp-mockup{position:relative;z-index:3;width:100%;max-width:1000px;animation:lpFade .8s .5s ease both}
        .lp-mframe{background:var(--card);border:1px solid var(--brd);border-radius:20px;box-shadow:0 40px 100px var(--shadow);overflow:hidden}
        .lp-mbar{background:var(--bg2);padding:13px 18px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--brd)}
        .lp-md{width:10px;height:10px;border-radius:50%}
        .lp-murl{flex:1;text-align:center;font-size:11px;color:var(--txt3);direction:ltr}
        .lp-mbody{display:grid;grid-template-columns:180px 1fr;min-height:380px}
        .lp-msb{background:var(--bg2);border-inline-start:1px solid var(--brd);padding:16px 12px;display:flex;flex-direction:column;gap:2px}
        .lp-msb-logo{display:flex;align-items:center;gap:8px;padding:6px;margin-bottom:10px}
        .lp-msb-li{width:24px;height:24px;border-radius:6px;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;flex-shrink:0}
        .lp-msb-lt{font-size:11px;font-weight:900;color:var(--txt)}
        .lp-msb-lbl{font-size:9px;font-weight:700;color:var(--txt3);letter-spacing:1px;text-transform:uppercase;padding:7px 6px 3px}
        .lp-msb-item{display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:8px;font-size:10px;font-weight:600;color:var(--txt2)}
        .lp-msb-item.on{background:var(--blue3);color:var(--blue)}
        .lp-msb-ic{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.5;flex-shrink:0}
        .lp-mmain{padding:20px;overflow:hidden;background:var(--bg)}
        .lp-mmain-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
        .lp-mmain-title{font-size:13px;font-weight:900;color:var(--txt)}
        .lp-mmain-date{font-size:10px;color:var(--txt3)}
        .lp-mmain-btn{padding:6px 13px;border-radius:100px;background:var(--blue);color:#fff;font-size:10px;font-weight:700;border:none;cursor:pointer}
        .lp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}
        .lp-kpi{background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:13px;overflow:hidden;position:relative}
        .lp-kpi-l{font-size:9px;font-weight:600;color:var(--txt3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px}
        .lp-kpi-v{font-size:20px;font-weight:900;line-height:1}
        .lp-kpi-s{font-size:9px;color:var(--txt3);margin-top:2px}
        .lp-kpi-bar{position:absolute;bottom:0;left:0;height:2px;background:currentColor;animation:lpKpiBar 1.5s ease both}
        @keyframes lpKpiBar{from{width:0}to{width:var(--w)}}
        .lp-msched{background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:13px}
        .lp-ms-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .lp-ms-title{font-size:11px;font-weight:800;color:var(--txt)}
        .lp-ms-badge{font-size:9px;font-weight:700;background:var(--blue3);color:var(--blue);padding:3px 8px;border-radius:100px}
        .lp-ms-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--brd)}
        .lp-ms-row:last-child{border:none;padding-bottom:0}
        .lp-ms-t{font-size:9px;color:var(--txt3);width:34px;flex-shrink:0;direction:ltr}
        .lp-ms-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;flex-shrink:0}
        .lp-ms-n{font-size:10px;font-weight:700;color:var(--txt)}
        .lp-ms-s{font-size:9px;color:var(--txt3)}
        .lp-ms-st{font-size:9px;font-weight:700;padding:3px 8px;border-radius:100px;white-space:nowrap}
        .lp-rev-row{display:grid;grid-template-columns:1fr 76px;gap:10px;margin-top:10px}
        .lp-rev-bars{display:flex;align-items:flex-end;gap:3px;height:44px}
        .lp-rev-val{font-size:15px;font-weight:900;color:#10b981}
        .lp-rev-lbl{font-size:9px;color:var(--txt3);margin-top:2px}
        @keyframes lpGrowUp{from{height:0}to{}}

        /* MARQUEE */
        .lp-marquee-wrap{overflow:hidden;padding:28px 0;border-top:1px solid var(--brd);border-bottom:1px solid var(--brd);background:var(--bg2)}
        .lp-marquee-track{display:flex;gap:36px;animation:lpMarquee 22s linear infinite;width:max-content}
        .lp-marquee-track:hover{animation-play-state:paused}
        .lp-mtag{display:flex;align-items:center;gap:10px;padding:9px 22px;border-radius:100px;background:var(--card);border:1px solid var(--brd);font-size:14px;font-weight:700;color:var(--txt2);white-space:nowrap;font-family:'Cairo',sans-serif}
        @keyframes lpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

        /* SECTIONS COMMON */
        .lp-sec{padding:110px 72px;max-width:1200px;margin:0 auto}
        .lp-sec-eye{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:2px;margin-bottom:16px}
        .lp-sec-eye::before{content:'';width:26px;height:2.5px;background:var(--blue);border-radius:2px;flex-shrink:0}
        .lp-sec-h{font-size:clamp(28px,4vw,50px);font-weight:900;line-height:1.1;letter-spacing:-1.5px;margin-bottom:64px}

        /* FEATURES */
        .lp-fg{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--brd);border:1px solid var(--brd);border-radius:22px;overflow:hidden}
        .lp-fc{background:var(--card);padding:40px;transition:background .3s;cursor:default;position:relative;overflow:hidden}
        .lp-fc-line{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--blue),#60a5fa);transform:scaleX(0);transform-origin:right;transition:transform .35s}
        .lp-fc:hover .lp-fc-line{transform:scaleX(1);transform-origin:left}
        .lp-fc:hover{background:var(--bg2)}
        .lp-fc-n{font-size:56px;font-weight:900;line-height:1;margin-bottom:20px;color:color-mix(in srgb,var(--blue) 12%,transparent)}
        .lp-fc-t{font-size:18px;font-weight:800;margin-bottom:10px;color:var(--txt)}
        .lp-fc-d{font-size:13px;color:var(--txt2);line-height:1.75}

        /* HOW IT WORKS */
        .lp-how-wrap{background:var(--bg2);border-top:1px solid var(--brd);border-bottom:1px solid var(--brd);padding:110px 0}
        .lp-how-inner{max-width:1200px;margin:0 auto;padding:0 72px}
        .lp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;position:relative}
        .lp-steps::before{content:'';position:absolute;top:28px;inset-inline:12%;height:1.5px;background:linear-gradient(90deg,var(--blue),color-mix(in srgb,var(--blue) 20%,transparent));z-index:0;pointer-events:none}
        .lp-step{background:var(--card);border:1px solid var(--brd);border-radius:20px;padding:36px;position:relative;z-index:1;transition:all .3s}
        .lp-step:hover{border-color:color-mix(in srgb,var(--blue) 40%,transparent);box-shadow:0 12px 40px var(--shadow);transform:translateY(-4px)}
        .lp-step-n{width:48px;height:48px;border-radius:50%;background:var(--blue3);color:var(--blue);font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:20px;border:2px solid color-mix(in srgb,var(--blue) 25%,transparent)}
        .lp-step-t{font-size:17px;font-weight:800;margin-bottom:10px;color:var(--txt)}
        .lp-step-d{font-size:13px;color:var(--txt2);line-height:1.7}

        /* STATS */
        .lp-nums-wrap{position:relative;padding:110px 72px;overflow:hidden}
        .lp-nums-bg{position:absolute;inset:0;background:linear-gradient(135deg,var(--blue),var(--blue2))}
        .lp-nums-dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:26px 26px}
        .lp-nums-inner{max-width:1200px;margin:0 auto;position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(255,255,255,.15);border-radius:24px;overflow:hidden}
        .lp-ni{padding:56px 28px;text-align:center}
        .lp-ni:not(:last-child){border-inline-end:1px solid rgba(255,255,255,.12)}
        .lp-ni-n{font-size:60px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1;margin-bottom:8px}
        .lp-ni-l{font-size:14px;color:rgba(255,255,255,.65);font-weight:600}

        /* TESTIMONIALS */
        .lp-tg{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .lp-tc{background:var(--card);border:1px solid var(--brd);border-radius:20px;padding:32px;transition:all .3s}
        .lp-tc:hover{border-color:color-mix(in srgb,var(--blue) 35%,transparent);box-shadow:0 12px 40px var(--shadow);transform:translateY(-4px)}
        .lp-tc-stars{color:#f59e0b;font-size:14px;margin-bottom:14px;letter-spacing:2px}
        .lp-tc-text{font-size:14px;color:var(--txt2);line-height:1.8;margin-bottom:20px;font-style:italic}
        .lp-tc-author{display:flex;align-items:center;gap:12px}
        .lp-tc-av{width:42px;height:42px;border-radius:50%;background:var(--blue3);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0}
        .lp-tc-name{font-size:14px;font-weight:800;color:var(--txt)}
        .lp-tc-role{font-size:12px;color:var(--txt3)}

        /* ROLES */
        .lp-rg{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .lp-rc{padding:30px;border-radius:18px;border:1.5px solid var(--brd);background:var(--card);display:flex;align-items:flex-start;gap:18px;transition:all .3s;position:relative;overflow:hidden}
        .lp-rc::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--blue3),transparent);opacity:0;transition:opacity .3s}
        .lp-rc:hover::before{opacity:1}
        .lp-rc:hover{border-color:color-mix(in srgb,var(--blue) 30%,transparent);box-shadow:0 12px 40px var(--shadow);transform:translateY(-3px)}
        .lp-ri{width:54px;height:54px;border-radius:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;position:relative;z-index:1}
        .lp-rt{font-size:16px;font-weight:800;margin-bottom:8px;color:var(--txt);position:relative;z-index:1}
        .lp-rd{font-size:13px;color:var(--txt2);line-height:1.65;position:relative;z-index:1}

        /* FAQ */
        .lp-faq-wrap{background:var(--bg2);border-top:1px solid var(--brd);border-bottom:1px solid var(--brd);padding:110px 0}
        .lp-faq-inner{max-width:800px;margin:0 auto;padding:0 72px}
        .lp-faq-item{border:1px solid var(--brd);border-radius:14px;background:var(--card);margin-bottom:12px;overflow:hidden;transition:border-color .2s}
        .lp-faq-item.open{border-color:color-mix(in srgb,var(--blue) 35%,transparent)}
        .lp-faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:none;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-size:15px;font-weight:700;color:var(--txt);text-align:right}
        .lp-faq-arrow{font-size:18px;transition:transform .25s;color:var(--blue);flex-shrink:0}
        .lp-faq-item.open .lp-faq-arrow{transform:rotate(45deg)}
        .lp-faq-a{padding:0 24px 20px;font-size:14px;color:var(--txt2);line-height:1.75}

        /* CTA */
        .lp-cta-wrap{padding:0 72px 110px}
        .lp-cta-inner{max-width:1200px;margin:0 auto;border-radius:24px;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--blue),var(--blue2));padding:100px 72px;text-align:center}
        .lp-cta-dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:24px 24px;pointer-events:none}
        .lp-cta-h{font-size:clamp(38px,6vw,80px);font-weight:900;line-height:1.06;letter-spacing:-2.5px;margin-bottom:16px;color:#fff;position:relative;z-index:1}
        .lp-cta-sub{font-size:17px;color:rgba(255,255,255,.75);margin-bottom:44px;position:relative;z-index:1}
        .lp-cta-btn{position:relative;z-index:1;display:inline-block;padding:20px 56px;border-radius:100px;background:#fff;color:var(--blue);font-family:'Cairo',sans-serif;font-size:18px;font-weight:800;border:none;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.2);transition:all .3s}
        .lp-cta-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 40px rgba(0,0,0,.3)}
        .lp-cta-note{margin-top:18px;font-size:13px;color:rgba(255,255,255,.55);position:relative;z-index:1}

        /* FOOTER */
        .lp-footer{padding:36px 72px;border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;background:var(--bg2)}
        .lp-fc2{font-size:13px;color:var(--txt3)}

        /* REVEAL */
        .lpr{opacity:0;transform:translateY(32px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
        .lpv{opacity:1!important;transform:none!important}

        @media(max-width:900px){
          .lpnav{padding:13px 18px}.lpnav-links{display:none}
          .lp-hero{padding:100px 20px 40px}
          .lp-sec,.lp-how-inner,.lp-faq-inner,.lp-nums-wrap,.lp-cta-wrap{padding-inline:20px}
          .lp-fg{grid-template-columns:1fr}
          .lp-nums-inner,.lp-rg,.lp-tg{grid-template-columns:1fr}
          .lp-steps{grid-template-columns:1fr}.lp-steps::before{display:none}
          .lp-mbody{grid-template-columns:1fr}.lp-msb{display:none}
          .lp-kpis{grid-template-columns:1fr 1fr}
          .lp-footer{padding:24px 20px;flex-direction:column;gap:10px;text-align:center}
          .lp-cta-inner{padding:60px 24px}
        }
      `}</style>

      {/* NAV */}
      <nav id="lpnav" className="lpnav">
        <div className="lplogo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <MZLogo size={42} />
          <span className="lplogo-text">MANGZONE</span>
        </div>
        <div className="lpnav-links">
          <button className="lpnl" onClick={() => scrollTo('features')}>المميزات</button>
          <button className="lpnl" onClick={() => scrollTo('how')}>كيف يعمل</button>
          <button className="lpnl" onClick={() => scrollTo('nums')}>الأرقام</button>
          <button className="lpnl" onClick={() => scrollTo('testimonials')}>آراء العملاء</button>
          <button className="lpnl" onClick={() => scrollTo('roles')}>الأدوار</button>
          <button className="lpnl" onClick={() => scrollTo('faq')}>الأسئلة الشائعة</button>
        </div>
        <div className="lpnav-right">
          <button className="lp-theme-btn" onClick={() => setDark((d) => !d)} title="تبديل الوضع">
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="lpncta" onClick={go}>ابدأ الآن ←</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-grid" />

        {/* Big Logo */}
        <div className="lp-hero-logo">
          <MZLogo size={110} />
        </div>

        <div className="lp-badge">
          <div className="lp-bd" />
          نظام إدارة عيادات متكامل
        </div>

        <h1 className="lp-h1">
          إدارة <span className="lp-blue">عيادتك</span><br />
          بذكاء <span className="lp-stroke">حقيقي</span>
        </h1>

        <p className="lp-sub">
          مواعيد · مرضى · فواتير · تقارير · فريق<br />
          كل شيء في مكان واحد. صُمِّم للعيادات المصرية.
        </p>

        <div className="lp-hbtns">
          <button className="lp-bp" onClick={go}>🚀 جرّب مجاناً الآن</button>
          <button className="lp-bs" onClick={() => scrollTo('features')}>اكتشف المميزات</button>
        </div>

        {/* Dashboard Mockup */}
        <div className="lp-mockup">
          <div className="lp-mframe">
            <div className="lp-mbar">
              <div className="lp-md" style={{ background: '#ff5f57' }} />
              <div className="lp-md" style={{ background: '#febc2e' }} />
              <div className="lp-md" style={{ background: '#28c840' }} />
              <div className="lp-murl">mangzone.netlify.app/dashboard</div>
            </div>
            <div className="lp-mbody">
              <div className="lp-msb">
                <div className="lp-msb-logo">
                  <div className="lp-msb-li">MZ</div>
                  <span className="lp-msb-lt">MANGZONE</span>
                </div>
                <div className="lp-msb-lbl">MAIN</div>
                <div className="lp-msb-item on"><div className="lp-msb-ic" /> Dashboard</div>
                <div className="lp-msb-item"><div className="lp-msb-ic" /> Appointments</div>
                <div className="lp-msb-item"><div className="lp-msb-ic" /> Patients</div>
                <div className="lp-msb-item"><div className="lp-msb-ic" /> Leads</div>
                <div className="lp-msb-lbl">MANAGEMENT</div>
                <div className="lp-msb-item"><div className="lp-msb-ic" /> Billing</div>
                <div className="lp-msb-item"><div className="lp-msb-ic" /> Reports</div>
              </div>
              <div className="lp-mmain">
                <div className="lp-mmain-top">
                  <div>
                    <div className="lp-mmain-title">Welcome back, Shaker 👋</div>
                    <div className="lp-mmain-date">Saturday, April 19, 2026</div>
                  </div>
                  <button className="lp-mmain-btn">+ New Appointment</button>
                </div>
                <div className="lp-kpis">
                  <div className="lp-kpi"><div className="lp-kpi-l">Total Patients</div><div className="lp-kpi-v" style={{ color: '#0057ff' }} id="k1">0</div><div className="lp-kpi-s">Registered</div><div className="lp-kpi-bar" style={{ color: '#0057ff', ['--w' as string]: '75%' }} /></div>
                  <div className="lp-kpi"><div className="lp-kpi-l">Today's Appts</div><div className="lp-kpi-v" style={{ color: '#10b981' }} id="k2">0</div><div className="lp-kpi-s">Scheduled</div><div className="lp-kpi-bar" style={{ color: '#10b981', ['--w' as string]: '55%' }} /></div>
                  <div className="lp-kpi"><div className="lp-kpi-l">Revenue</div><div className="lp-kpi-v" style={{ color: '#f59e0b' }} id="k3">0</div><div className="lp-kpi-s">EGP / month</div><div className="lp-kpi-bar" style={{ color: '#f59e0b', ['--w' as string]: '88%' }} /></div>
                  <div className="lp-kpi"><div className="lp-kpi-l">Unpaid</div><div className="lp-kpi-v" style={{ color: '#ef4444' }} id="k4">0</div><div className="lp-kpi-s">Invoices</div><div className="lp-kpi-bar" style={{ color: '#ef4444', ['--w' as string]: '30%' }} /></div>
                </div>
                <div className="lp-msched">
                  <div className="lp-ms-head"><span className="lp-ms-title">Today's Schedule</span><span className="lp-ms-badge">6 appointments</span></div>
                  <div className="lp-ms-row"><div className="lp-ms-t">13:00</div><div className="lp-ms-av" style={{ background: '#e8efff', color: '#0057ff' }}>AM</div><div style={{ flex: 1 }}><div className="lp-ms-n">Ahmed Mohammed</div><div className="lp-ms-s">Teeth Cleaning</div></div><div className="lp-ms-st" style={{ background: '#e8efff', color: '#0057ff' }}>Arrived ✓</div></div>
                  <div className="lp-ms-row"><div className="lp-ms-t">15:30</div><div className="lp-ms-av" style={{ background: '#fffbeb', color: '#f59e0b' }}>KA</div><div style={{ flex: 1 }}><div className="lp-ms-n">Khaled Abdullah</div><div className="lp-ms-s">Zirconia Crown</div></div><div className="lp-ms-st" style={{ background: '#fffbeb', color: '#d97706' }}>Scheduled</div></div>
                  <div className="lp-ms-row"><div className="lp-ms-t">18:00</div><div className="lp-ms-av" style={{ background: '#fdf4ff', color: '#a855f7' }}>ST</div><div style={{ flex: 1 }}><div className="lp-ms-n">Sara Tarek</div><div className="lp-ms-s">Dental Checkup</div></div><div className="lp-ms-st" style={{ background: '#fffbeb', color: '#d97706' }}>Scheduled</div></div>
                  <div className="lp-rev-row">
                    <div className="lp-rev-bars" ref={barsRef} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                      <div className="lp-rev-val" id="rv">0</div>
                      <div className="lp-rev-lbl">EGP this month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee-track" ref={marqueeRef} />
      </div>

      {/* FEATURES */}
      <section className="lp-sec lpr" id="features">
        <div className="lp-sec-eye">المميزات</div>
        <h2 className="lp-sec-h">كل شيء تحتاجه<br /><span className="lp-blue">في نظام واحد</span></h2>
        <div className="lp-fg">
          {FEATURES.map(({ n, t, d }) => (
            <div key={n} className="lp-fc">
              <div className="lp-fc-line" />
              <div className="lp-fc-n">{n}</div>
              <div className="lp-fc-t">{t}</div>
              <div className="lp-fc-d">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="lp-how-wrap lpr" id="how">
        <div className="lp-how-inner">
          <div className="lp-sec-eye">كيف يعمل</div>
          <h2 className="lp-sec-h" style={{ marginBottom: 48 }}>ابدأ في <span className="lp-blue">3 خطوات فقط</span></h2>
          <div className="lp-steps">
            {STEPS.map(({ n, t, d }) => (
              <div key={n} className="lp-step">
                <div className="lp-step-n">{n}</div>
                <div className="lp-step-t">{t}</div>
                <div className="lp-step-d">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="lp-nums-wrap lpr" id="nums">
        <div className="lp-nums-bg" />
        <div className="lp-nums-dots" />
        <div className="lp-nums-inner">
          <div className="lp-ni"><div className="lp-ni-n" id="n1">0+</div><div className="lp-ni-l">مريض مسجّل</div></div>
          <div className="lp-ni"><div className="lp-ni-n" id="n2">0</div><div className="lp-ni-l">أدوار مختلفة</div></div>
          <div className="lp-ni"><div className="lp-ni-n" id="n3">0%</div><div className="lp-ni-l">آمن ومحمي</div></div>
          <div className="lp-ni"><div className="lp-ni-n">∞</div><div className="lp-ni-l">قابل للتوسع</div></div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="lp-sec lpr" id="testimonials">
        <div className="lp-sec-eye">آراء العملاء</div>
        <h2 className="lp-sec-h">ماذا يقول <span className="lp-blue">مستخدمونا</span></h2>
        <div className="lp-tg">
          {TESTIMONIALS.map(({ name, role, text, stars }) => (
            <div key={name} className="lp-tc">
              <div className="lp-tc-stars">{'★'.repeat(stars)}</div>
              <p className="lp-tc-text">"{text}"</p>
              <div className="lp-tc-author">
                <div className="lp-tc-av">{name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
                <div>
                  <div className="lp-tc-name">{name}</div>
                  <div className="lp-tc-role">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="lp-sec lpr" id="roles" style={{ paddingTop: 0 }}>
        <div className="lp-sec-eye">الأدوار</div>
        <h2 className="lp-sec-h">نظام مصمم <span className="lp-blue">لكل الفريق</span></h2>
        <div className="lp-rg">
          {ROLES.map(({ i, t, d, bg }) => (
            <div key={t} className="lp-rc">
              <div className="lp-ri" style={{ background: bg }}>{i}</div>
              <div><div className="lp-rt">{t}</div><div className="lp-rd">{d}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <div className="lp-faq-wrap lpr" id="faq">
        <div className="lp-faq-inner">
          <div className="lp-sec-eye">الأسئلة الشائعة</div>
          <h2 className="lp-sec-h" style={{ marginBottom: 40 }}>أسئلة <span className="lp-blue">تهمك</span></h2>
          {FAQS.map(({ q, a }, i) => (
            <div key={i} className={`lp-faq-item${openFaq === i ? ' open' : ''}`}>
              <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {q}
                <span className="lp-faq-arrow">+</span>
              </button>
              {openFaq === i && <div className="lp-faq-a">{a}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="lp-cta-wrap lpr">
        <div className="lp-cta-inner">
          <div className="lp-cta-dots" />
          <h2 className="lp-cta-h">جاهز تبدأ<br />معنا الآن؟</h2>
          <p className="lp-cta-sub">ادخل وجرّب كل المميزات — بدون أي التزام</p>
          <button className="lp-cta-btn" onClick={go}>🚀 ابدأ مجاناً الآن</button>
          <p className="lp-cta-note">✓ لا يحتاج بطاقة &nbsp;&nbsp; ✓ جاهز فوراً &nbsp;&nbsp; ✓ دعم كامل</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lplogo">
          <MZLogo size={36} />
          <span className="lplogo-text" style={{ fontSize: 15 }}>MANGZONE</span>
        </div>
        <div className="lp-fc2">نظام إدارة عيادات — صُنع بـ ❤️ في مصر · © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
