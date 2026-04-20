import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type LandingLanguage = 'ar' | 'en';

const FEATURES = {
  ar: [
    { n: '01', t: 'تتبّع المرضى', d: 'ملف طبي كامل — تاريخ الزيارات، العلاجات، الفواتير، والتنبيهات الطبية.' },
    { n: '02', t: 'إدارة المواعيد', d: 'جدول يومي واضح، حجز سريع، ومتابعة حالة كل موعد لحظة بلحظة.' },
    { n: '03', t: 'تقارير مالية', d: 'إيرادات، مصروفات، فواتير معلقة، وتحليل شهري كامل ودقيق.' },
    { n: '04', t: 'مساعد ذكي AI', d: 'اسأل بالعربي عن أي شيء في العيادة. مدعوم بـ Gemini AI — يرد فوراً.' },
    { n: '05', t: 'صلاحيات آمنة', d: 'ADMIN، طبيب، استقبال، محاسب — كل دور له صلاحياته الخاصة.' },
    { n: '06', t: 'من أي جهاز', d: 'جوال، تابلت، أو كمبيوتر. في المتصفح بدون تثبيت. في أي مكان.' },
  ],
  en: [
    { n: '01', t: 'Patient Tracking', d: 'Complete medical records — visit history, treatments, invoices, and medical alerts.' },
    { n: '02', t: 'Appointment Management', d: 'A clear daily schedule, quick booking, and live tracking for every appointment.' },
    { n: '03', t: 'Financial Reports', d: 'Revenue, expenses, outstanding invoices, and accurate monthly analysis.' },
    { n: '04', t: 'Smart AI Assistant', d: 'Ask in Arabic or English about anything in the clinic. Powered by Gemini AI with instant answers.' },
    { n: '05', t: 'Secure Permissions', d: 'ADMIN, doctor, reception, accountant — every role gets exactly the access it needs.' },
    { n: '06', t: 'From Any Device', d: 'Phone, tablet, or computer. Browser-based, with no installs, from anywhere.' },
  ],
} as const;

const STEPS = {
  ar: [
    { n: '01', t: 'أنشئ حسابك', d: 'سجّل الدخول وأضف بيانات العيادة في دقيقتين. لا تثبيت، لا إعداد معقد.' },
    { n: '02', t: 'أضف فريقك', d: 'أضف أطباءك، موظفي الاستقبال، والمحاسبين. كل واحد له صلاحياته.' },
    { n: '03', t: 'ابدأ الإدارة', d: 'سجّل المرضى، احجز المواعيد، وتابع الفواتير — كل شيء من مكان واحد.' },
  ],
  en: [
    { n: '01', t: 'Create your account', d: 'Sign in and add your clinic details in two minutes. No installation, no complex setup.' },
    { n: '02', t: 'Add your team', d: 'Add your doctors, reception staff, and accountants. Each person gets their own permissions.' },
    { n: '03', t: 'Start managing', d: 'Register patients, book appointments, and track billing — all from one place.' },
  ],
} as const;

const TESTIMONIALS = {
  ar: [
    { name: 'د. أحمد العمري', role: 'طبيب أسنان — القاهرة', text: 'النظام غيّر طريقة إدارة عيادتي بالكامل. الآن أتابع كل شيء من هاتفي.', stars: 5 },
    { name: 'د. سارة محمد', role: 'طبيبة — الإسكندرية', text: 'التقارير المالية وفّرت علي ساعات من العمل اليدوي كل أسبوع. ممتاز جداً.', stars: 5 },
    { name: 'أ. خالد الرشيد', role: 'مدير عيادة — الرياض', text: 'سهل الاستخدام ويعمل بسلاسة على الجوال والكمبيوتر. الدعم سريع وممتاز.', stars: 5 },
  ],
  en: [
    { name: 'Dr. Ahmed Al-Omari', role: 'Dentist — Cairo', text: 'The system completely changed how I manage my clinic. Now I can track everything from my phone.', stars: 5 },
    { name: 'Dr. Sara Mohamed', role: 'Dentist — Alexandria', text: 'The financial reports save me hours of manual work every week. Truly excellent.', stars: 5 },
    { name: 'Khaled Al-Rashid', role: 'Clinic Manager — Riyadh', text: 'Easy to use and smooth on both mobile and desktop. Support is fast and excellent.', stars: 5 },
  ],
} as const;

const FAQS = {
  ar: [
    {
      q: '1) هل يمكن تخصيص النظام ليتناسب مع طريقة عمل عيادتي؟',
      a: 'نعم، يتم تهيئة النظام ليتوافق مع احتياجات عيادتك وطبيعة عملك. لا نطلب منك تغيير أسلوبك، بل نقوم بضبط النظام ليخدم طريقتك الحالية ويطوّرها، مما يضمن سهولة الاستخدام وتحسناً فعلياً في الأداء.',
    },
    {
      q: '2) هل يمكن إضافة ميزات جديدة حسب احتياجاتي مستقبلاً؟',
      a: 'نعم، النظام مرن وقابل للتطوير المستمر. في حال احتجت أي ميزة إضافية أو تعديل خاص، يمكن تطويرها ودمجها داخل النظام بما يتناسب مع احتياجاتك، ليبقى النظام مواكباً لنمو عيادتك وتطورها.',
    },
    {
      q: '3) ماذا لو لم أتمكن من إتقان استخدام النظام من البداية؟',
      a: 'هذا أمر طبيعي، لذلك لا يقتصر دورنا على تسليم النظام فقط، بل نتابع معك ومع فريقك خطوة بخطوة حتى يتم إتقان استخدام النظام بشكل كامل وسلس.',
    },
    {
      q: '4) هل يتوفر دعم في حال حدوث أي مشكلة؟',
      a: 'نعم، نوفر دعماً مستمراً لضمان استمرارية عملك دون أي تعطيل. في حال واجهتك أي مشكلة أو استفسار، يتم التعامل معها بسرعة واحترافية حتى يتم حلها بشكل نهائي.',
    },
    {
      q: '5) هل تنتهي الخدمة بعد تشغيل النظام؟',
      a: 'لا، لا تنتهي علاقتنا عند تشغيل النظام. نستمر في المتابعة والدعم إلى أن يكون النظام مضبوطاً بالكامل وفق احتياجاتك، ويحقق لك النتائج المرجوة في إدارة عملك.',
    },
  ],
  en: [
    {
      q: '1) Can the system be tailored to match how my clinic works?',
      a: 'Yes. The system is configured around your clinic’s needs and workflow. We do not ask you to change how you work — we adapt the system to support and improve your current process, so it is easier to use and more effective from day one.',
    },
    {
      q: '2) Can new features be added later based on my future needs?',
      a: 'Yes. The system is flexible and built to grow with you. If you need any new feature or a special adjustment, it can be developed and integrated to match your workflow, so the system keeps up with your clinic as it evolves.',
    },
    {
      q: '3) What if I do not master the system from the beginning?',
      a: 'That is completely normal. Our role does not stop at delivering the system — we stay with you and your team step by step until everyone is using it confidently and smoothly.',
    },
    {
      q: '4) Is support available if any issue happens?',
      a: 'Yes. We provide ongoing support to keep your work running without interruption. If you face any issue or question, we handle it quickly and professionally until it is resolved properly.',
    },
    {
      q: '5) Does the service end once the system is launched?',
      a: 'No. Our relationship does not end once the system goes live. We continue to follow up and support you until the system is fully tailored to your needs and delivering the results you expect.',
    },
  ],
} as const;

const NAV_ITEMS = {
  ar: [
    { id: 'features', label: 'المميزات' },
    { id: 'how', label: 'كيف يعمل' },
    { id: 'nums', label: 'الأرقام' },
    { id: 'testimonials', label: 'آراء العملاء' },
    { id: 'roles', label: 'الأدوار' },
    { id: 'faq', label: 'الأسئلة الشائعة' },
    { id: 'request-form', label: 'طلب نظامك' },
  ],
  en: [
    { id: 'features', label: 'Features' },
    { id: 'how', label: 'How it works' },
    { id: 'nums', label: 'Numbers' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'roles', label: 'Roles' },
    { id: 'faq', label: 'FAQ' },
    { id: 'request-form', label: 'Request your system' },
  ],
} as const;

const ROLES = {
  ar: [
    { i: '👑', t: 'المدير — ADMIN', d: 'تحكم كامل في كل شيء. المرضى، الفريق، التقارير المالية، والإعدادات.', bg: 'rgba(108,77,196,.1)' },
    { i: '🦷', t: 'الطبيب', d: 'يرى مواعيده ومرضاه فقط. ملفات طبية كاملة وخطط علاج منظّمة.', bg: 'rgba(14,165,114,.1)' },
    { i: '📋', t: 'الاستقبال', d: 'حجز مواعيد، استقبال مرضى جدد، ومتابعة الجدول اليومي بسهولة.', bg: 'rgba(0,87,255,.1)' },
    { i: '💰', t: 'المحاسب', d: 'فواتير، دفعات، مصروفات، وتقارير مالية شاملة بدون الملفات الطبية.', bg: 'rgba(245,158,11,.1)' },
  ],
  en: [
    { i: '👑', t: 'Administrator — ADMIN', d: 'Full control over everything: patients, team, financial reports, and settings.', bg: 'rgba(108,77,196,.1)' },
    { i: '🦷', t: 'Doctor', d: 'Sees only assigned appointments and patients, with organized medical records and treatment plans.', bg: 'rgba(14,165,114,.1)' },
    { i: '📋', t: 'Reception', d: 'Books appointments, registers new patients, and keeps the daily schedule moving smoothly.', bg: 'rgba(0,87,255,.1)' },
    { i: '💰', t: 'Accountant', d: 'Manages invoices, payments, expenses, and financial reports without access to medical files.', bg: 'rgba(245,158,11,.1)' },
  ],
} as const;

const MARQUEE_TAGS = {
  ar: [
    { ic: '🏥', t: 'إدارة المرضى' }, { ic: '📅', t: 'جدولة المواعيد' },
    { ic: '💰', t: 'الفواتير والدفعات' }, { ic: '📊', t: 'التقارير المالية' },
    { ic: '🤖', t: 'مساعد AI عربي' }, { ic: '🔐', t: 'أمان تام' },
    { ic: '👥', t: 'إدارة الفريق' }, { ic: '📱', t: 'يعمل على الهاتف' },
    { ic: '⚡', t: 'سريع وموثوق' }, { ic: '🦷', t: 'مخصص للعيادات' },
  ],
  en: [
    { ic: '🏥', t: 'Patient management' }, { ic: '📅', t: 'Appointment scheduling' },
    { ic: '💰', t: 'Billing & payments' }, { ic: '📊', t: 'Financial reports' },
    { ic: '🤖', t: 'Arabic AI assistant' }, { ic: '🔐', t: 'Full security' },
    { ic: '👥', t: 'Team management' }, { ic: '📱', t: 'Works on mobile' },
    { ic: '⚡', t: 'Fast & reliable' }, { ic: '🦷', t: 'Built for clinics' },
  ],
} as const;

const LANDING_TEXT = {
  ar: {
    documentTitle: 'MANGZONE — نظام إدارة العيادات',
    headerCta: 'ابدأ الآن',
    themeDark: 'تفعيل الوضع الداكن',
    themeLight: 'تفعيل الوضع الفاتح',
    badge: 'نظام إدارة عيادات متكامل',
    hero: {
      line1: 'إدارة',
      accent1: 'عيادتك',
      line2: 'بذكاء',
      accent2: 'حقيقي',
      subLine1: 'مواعيد · مرضى · فواتير · تقارير · فريق',
      subLine2: 'كل شيء في مكان واحد. صُمِّم للعيادات المصرية.',
      primaryCta: 'جرّب مجاناً الآن',
      secondaryCta: 'اكتشف المميزات',
    },
    sections: {
      featuresEye: 'المميزات',
      featuresTitle: 'كل شيء تحتاجه',
      featuresAccent: 'في نظام واحد',
      howEye: 'كيف يعمل',
      howTitle: 'ابدأ في',
      howAccent: '3 خطوات فقط',
      testimonialsEye: 'آراء العملاء',
      testimonialsTitle: 'ماذا يقول',
      testimonialsAccent: 'مستخدمونا',
      rolesEye: 'الأدوار',
      rolesTitle: 'نظام مصمم',
      rolesAccent: 'لكل الفريق',
      faqEye: 'الأسئلة الشائعة',
      faqTitle: 'أسئلة',
      faqAccent: 'تهمك',
    },
    stats: ['مريض مسجّل', 'أدوار مختلفة', 'آمن ومحمي', 'قابل للتوسع'],
    cta: {
      line1: 'جاهز تبدأ',
      line2: 'معنا الآن؟',
      sub: 'ادخل وجرّب كل المميزات — بدون أي التزام',
      button: 'ابدأ مجاناً الآن',
      note: '✓ لا يحتاج بطاقة  •  ✓ جاهز فوراً  •  ✓ دعم كامل',
    },
    form: {
      title: 'ابدأ بكل سهولة',
      descLine1: 'نرتب لك نظاماً يناسب طريقة عملك، بدون تعقيد.',
      descLine2: 'من اليوم الأول، كل شيء واضح وسهل الاستخدام.',
      fullNameLabel: 'الاسم الكامل *',
      fullNamePlaceholder: 'اكتب اسمك الكامل',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: 'اكتب رقم هاتفك',
      clinicLabel: 'اسم العيادة',
      clinicPlaceholder: 'اسم العيادة أو المركز',
      teamLabel: 'حجم الفريق',
      teamPlaceholder: 'اختر حجم الفريق',
      teamOptions: [
        { value: 'solo', label: 'أنا فقط' },
        { value: 'small', label: '2 - 5 أفراد' },
        { value: 'medium', label: '6 - 10 أفراد' },
        { value: 'large', label: 'أكثر من 10 أفراد' },
      ],
      notesLabel: 'ملاحظات (اختياري)',
      notesPlaceholder: 'أي تفاصيل إضافية تحب نعرفها قبل البدء',
      submit: 'ابدأ الآن',
      trust: 'نصمّم النظام بما يناسب عملك، ويمكن تطوير أي ميزة تحتاجها.',
    },
    footer: 'نظام إدارة عيادات — صُنع بـ ❤️ في مصر',
  },
  en: {
    documentTitle: 'MANGZONE — Dental Clinic Management',
    headerCta: 'Start now',
    themeDark: 'Switch to dark mode',
    themeLight: 'Switch to light mode',
    badge: 'Complete clinic management system',
    hero: {
      line1: 'Manage',
      accent1: 'your clinic',
      line2: 'with',
      accent2: 'real intelligence',
      subLine1: 'Appointments · Patients · Billing · Reports · Team',
      subLine2: 'Everything in one place. Built for modern Egyptian clinics.',
      primaryCta: 'Start free now',
      secondaryCta: 'Explore features',
    },
    sections: {
      featuresEye: 'Features',
      featuresTitle: 'Everything you need',
      featuresAccent: 'in one system',
      howEye: 'How it works',
      howTitle: 'Get started in',
      howAccent: 'just 3 steps',
      testimonialsEye: 'Testimonials',
      testimonialsTitle: 'What our',
      testimonialsAccent: 'customers say',
      rolesEye: 'Roles',
      rolesTitle: 'A system built',
      rolesAccent: 'for every team member',
      faqEye: 'FAQ',
      faqTitle: 'Questions that',
      faqAccent: 'matter',
    },
    stats: ['Registered patients', 'Different roles', 'Secure & protected', 'Built to scale'],
    cta: {
      line1: 'Ready to get started',
      line2: 'with us now?',
      sub: 'Explore every feature — with no commitment',
      button: 'Start for free now',
      note: '✓ No card needed  •  ✓ Ready instantly  •  ✓ Full support',
    },
    form: {
      title: 'Get started with ease',
      descLine1: 'We set up a system that fits the way your clinic already works, without complexity.',
      descLine2: 'From day one, everything feels clear, organized, and easy to use.',
      fullNameLabel: 'Full name *',
      fullNamePlaceholder: 'Enter your full name',
      phoneLabel: 'Phone number',
      phonePlaceholder: 'Enter your phone number',
      clinicLabel: 'Clinic name',
      clinicPlaceholder: 'Clinic or center name',
      teamLabel: 'Team size',
      teamPlaceholder: 'Choose your team size',
      teamOptions: [
        { value: 'solo', label: 'Just me' },
        { value: 'small', label: '2 - 5 people' },
        { value: 'medium', label: '6 - 10 people' },
        { value: 'large', label: 'More than 10 people' },
      ],
      notesLabel: 'Notes (optional)',
      notesPlaceholder: 'Any extra details you want us to know before we begin',
      submit: 'Start now',
      trust: 'We shape the system around your workflow, and any feature you need can be developed.',
    },
    footer: 'Clinic management system — made with ❤️ in Egypt',
  },
} as const;

type LandingFormState = {
  fullName: string;
  phone: string;
  clinicName: string;
  teamSize: string;
  notes: string;
};

export function LandingPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navHeight, setNavHeight] = useState(152);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState<LandingFormState>({
    fullName: '',
    phone: '',
    clinicName: '',
    teamSize: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const language: LandingLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'ar').startsWith('ar') ? 'ar' : 'en';
  const isAr = language === 'ar';
  const content = LANDING_TEXT[language];
  const features = FEATURES[language];
  const steps = STEPS[language];
  const testimonials = TESTIMONIALS[language];
  const faqs = FAQS[language];
  const navItems = NAV_ITEMS[language];
  const roles = ROLES[language];
  const marqueeTags = [...MARQUEE_TAGS[language], ...MARQUEE_TAGS[language]];
  const languageToggleLabel = isAr ? 'EN' : 'AR';
  const languageToggleTitle = isAr ? 'Switch to English' : 'التبديل إلى العربية';

  const go = () => navigate('/login');
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const toggleLanguage = () => {
    void i18n.changeLanguage(isAr ? 'en' : 'ar');
  };
  const handleFieldChange = (field: keyof LandingFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };
  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, phone: event.target.value }));
  };
  const handleLeadSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    fetch('/api/lead-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .catch(() => null)
      .finally(() => {
        setSubmitting(false);
        setSubmitted(true);
        setFormData({ fullName: '', phone: '01', clinicName: '', teamSize: '', notes: '' });
      });
  };

  // Reveal animations
  useEffect(() => {
    document.title = content.documentTitle;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('lpv'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.lpr').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [content.documentTitle, isAr, language]);

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

  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      if (nav) setNavHeight(nav.getBoundingClientRect().bottom + 16);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Revenue bars
  useEffect(() => {
    const bel = barsRef.current;
    if (!bel) return;
    bel.innerHTML = '';
    const vals = [28, 42, 35, 60, 48, 75, 65, 80];
    const cols = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#0057ff'];
    vals.forEach((v, i) => {
      const b = document.createElement('div');
      b.style.cssText = `height:${v}%;background:${cols[i]};flex:1;border-radius:3px 3px 0 0;animation:lpGrowUp .8s ${i * 0.08}s ease both`;
      bel.appendChild(b);
    });
  }, []);

  useEffect(() => {
    setOpenFaq(null);
  }, [language]);

  // Nav shadow
  useEffect(() => {
    const handler = () => {
      const nav = document.getElementById('lpnav-shell');
      if (!nav) return;
      nav.style.boxShadow = window.scrollY > 10
        ? (dark
          ? '0 28px 56px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)'
          : '0 26px 54px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.82)')
        : '';
      nav.style.borderColor = window.scrollY > 10
        ? (dark ? 'rgba(91,156,246,.18)' : 'rgba(0,87,255,.12)')
        : '';
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [dark]);

  const th = dark ? 'dark' : 'light';
  const landingLogoSrc = dark ? '/logo-dark.svg' : '/logo.svg';

  return (
    <div dir="ltr" data-lp={th} data-lang={isAr ? 'ar' : 'en'} style={{ fontFamily: 'var(--font-arabic)', background: dark ? '#0d1117' : '#fff', color: dark ? '#f0f6fc' : '#060b1a', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Cairo:wght@300;400;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        [data-lp="light"]{--bg:#fff;--bg2:#f8fafc;--bg3:#f1f5f9;--txt:#060b1a;--txt2:#475569;--txt3:#94a3b8;--brd:#e2e8f0;--blue:#0057ff;--blue2:#003acc;--blue3:#e8efff;--card:#fff;--shadow:rgba(0,87,255,.08);--font-arabic:'Noto Naskh Arabic','Cairo',serif;--nav-shell-bg:rgba(255,255,255,.8);--nav-shell-border:rgba(15,23,42,.075);--nav-shell-shadow:0 18px 40px rgba(15,23,42,.075);--nav-menu-bg:linear-gradient(180deg,rgba(255,255,255,.72),rgba(248,250,252,.9));--nav-menu-border:rgba(148,163,184,.14);--nav-menu-shadow:0 12px 26px rgba(15,23,42,.04),inset 0 1px 0 rgba(255,255,255,.72);--nav-pill-bg:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.14));--nav-pill-border:rgba(255,255,255,.22);--nav-pill-hover:linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.92));--nav-pill-hover-border:rgba(0,87,255,.12);--nav-pill-shadow:0 10px 18px rgba(15,23,42,.05),inset 0 1px 0 rgba(255,255,255,.82);--nav-theme-bg:linear-gradient(180deg,rgba(255,255,255,.58),rgba(248,250,252,.9));--nav-theme-shadow:0 8px 18px rgba(15,23,42,.04),inset 0 1px 0 rgba(255,255,255,.56);--cta-shadow:0 18px 32px rgba(0,87,255,.18),inset 0 1px 0 rgba(255,255,255,.24);--cta-shadow-hover:0 22px 38px rgba(0,87,255,.22),inset 0 1px 0 rgba(255,255,255,.26);--nav-edge:rgba(255,255,255,.84)}
        [data-lp="dark"]{--bg:#0d1117;--bg2:#161b22;--bg3:#21262d;--txt:#f0f6fc;--txt2:#8b949e;--txt3:#6e7681;--brd:#30363d;--blue:#5b9cf6;--blue2:#4080e8;--blue3:#1a2d50;--card:#161b22;--shadow:rgba(0,0,0,.4);--font-arabic:'Noto Naskh Arabic','Cairo',serif;--nav-shell-bg:rgba(13,17,23,.78);--nav-shell-border:rgba(148,163,184,.13);--nav-shell-shadow:0 18px 42px rgba(0,0,0,.26);--nav-menu-bg:linear-gradient(180deg,rgba(22,27,34,.78),rgba(18,24,31,.92));--nav-menu-border:rgba(148,163,184,.1);--nav-menu-shadow:0 12px 26px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.03);--nav-pill-bg:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012));--nav-pill-border:rgba(148,163,184,.09);--nav-pill-hover:linear-gradient(180deg,rgba(31,40,51,.96),rgba(24,32,41,.96));--nav-pill-hover-border:rgba(91,156,246,.16);--nav-pill-shadow:0 10px 18px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.04);--nav-theme-bg:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));--nav-theme-shadow:0 8px 18px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.04);--cta-shadow:0 16px 30px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.16);--cta-shadow-hover:0 20px 36px rgba(0,0,0,.26),inset 0 1px 0 rgba(255,255,255,.18);--nav-edge:rgba(255,255,255,.045)}

        /* NAV */
        .lpnav{position:fixed;top:18px;inset-inline:0;z-index:200;padding-inline:24px;pointer-events:none}
        .lpnav-shell{pointer-events:auto;max-width:1280px;min-height:88px;margin:0 auto;padding:14px 18px;border-radius:30px;border:1px solid var(--nav-shell-border);background:var(--nav-shell-bg);backdrop-filter:blur(22px) saturate(160%);box-shadow:var(--nav-shell-shadow),inset 0 1px 0 var(--nav-edge);display:grid;grid-template-columns:minmax(200px,1fr) auto minmax(200px,1fr);grid-template-areas:"actions menu brand";align-items:center;gap:20px;direction:ltr;transition:box-shadow .26s cubic-bezier(.16,1,.3,1),border-color .26s cubic-bezier(.16,1,.3,1),background-color .26s cubic-bezier(.16,1,.3,1)}
        .lplogo{grid-area:brand;justify-self:end;display:inline-flex;align-items:center;min-width:0;cursor:pointer;text-decoration:none;overflow:visible;padding:8px 12px;border-radius:20px;border:1px solid transparent;direction:rtl;transition:transform .24s cubic-bezier(.16,1,.3,1),background-color .24s cubic-bezier(.16,1,.3,1),border-color .24s cubic-bezier(.16,1,.3,1)}
        .lplogo:hover{transform:translateY(-1px);background:color-mix(in srgb,var(--bg2) 84%,transparent);border-color:color-mix(in srgb,var(--blue) 14%,var(--nav-shell-border))}
        .lp-logo-img{display:block;width:100%;height:auto;max-width:100%;object-fit:contain;background:none;box-shadow:none;filter:none}
        .lpnav-brand{width:clamp(150px,15vw,182px);max-width:44vw;flex-shrink:1}
        .lpnav-menu{grid-area:menu;justify-self:center;display:flex;justify-content:center;min-width:0;transform:translateX(20px)}
        .lpnav-links{display:flex;align-items:center;justify-content:center;gap:10px;padding:5px 10px;border-radius:999px;background:var(--nav-menu-bg);border:1px solid var(--nav-menu-border);box-shadow:var(--nav-menu-shadow)}
        .lpnl{min-height:34px;padding:0 11px;border-radius:999px;border:1px solid var(--nav-pill-border);background:var(--nav-pill-bg);color:var(--txt2);cursor:pointer;font-family:var(--font-arabic);font-size:11px;font-weight:600;line-height:1;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.02);transition:transform .24s cubic-bezier(.16,1,.3,1),background .24s cubic-bezier(.16,1,.3,1),color .24s cubic-bezier(.16,1,.3,1),border-color .24s cubic-bezier(.16,1,.3,1),box-shadow .24s cubic-bezier(.16,1,.3,1)}
        .lpnl:hover{color:var(--txt);background:var(--nav-pill-hover);border-color:var(--nav-pill-hover-border);box-shadow:var(--nav-pill-shadow);transform:translateY(-1.5px)}
        [data-lang="ar"] .lpnl{font-size:21px;min-height:44px;padding:0 16px}
        .lpnav-right{grid-area:actions;justify-self:start;display:flex;align-items:center;gap:10px;direction:rtl}
        .lp-nav-mini{height:46px;border-radius:999px;border:1px solid color-mix(in srgb,var(--nav-shell-border) 82%,transparent);background:var(--nav-theme-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--nav-theme-shadow);transition:transform .24s cubic-bezier(.16,1,.3,1),background .24s cubic-bezier(.16,1,.3,1),border-color .24s cubic-bezier(.16,1,.3,1),box-shadow .24s cubic-bezier(.16,1,.3,1)}
        .lp-nav-mini:hover{transform:translateY(-1.5px);border-color:color-mix(in srgb,var(--blue) 24%,var(--nav-shell-border));background:color-mix(in srgb,var(--blue3) 68%,var(--bg2));box-shadow:var(--nav-pill-shadow)}
        .lp-theme-btn{width:46px;font-size:17px}
        .lp-lang-btn{padding:0 16px;min-width:58px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--txt2);direction:ltr}
        .lpncta{min-height:50px;padding:0 26px;border-radius:999px;background:linear-gradient(180deg,color-mix(in srgb,var(--blue) 86%,white 10%),var(--blue2));color:#fff;font-family:var(--font-arabic);font-size:14px;font-weight:700;border:1px solid color-mix(in srgb,var(--blue) 58%,transparent);cursor:pointer;box-shadow:var(--cta-shadow);transition:transform .26s cubic-bezier(.16,1,.3,1),box-shadow .26s cubic-bezier(.16,1,.3,1),filter .26s cubic-bezier(.16,1,.3,1)}
        .lpncta:hover{transform:translateY(-1.5px);box-shadow:var(--cta-shadow-hover);filter:saturate(1.04) brightness(1.01)}

        /* HERO */
        .lp-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:130px 40px 60px;position:relative;overflow:hidden;background:var(--bg)}
        .lp-grid{position:absolute;inset:0;background-image:linear-gradient(var(--brd) 1px,transparent 1px),linear-gradient(90deg,var(--brd) 1px,transparent 1px);background-size:52px 52px;opacity:.5;mask-image:radial-gradient(ellipse 75% 65% at 50% 40%,black,transparent);pointer-events:none}
        [data-lp="dark"] .lp-grid{display:none}
        .lp-hero-logo{position:relative;z-index:3;width:min(100%,420px);max-width:calc(100vw - 40px);margin:0 auto 24px;animation:lpFade .6s ease both;overflow:visible}
        .lp-badge{position:relative;z-index:3;display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:100px;background:var(--blue3);border:1px solid color-mix(in srgb,var(--blue) 30%,transparent);font-size:13px;font-weight:700;color:var(--blue);margin-bottom:28px;animation:lpFade .6s .1s ease both}
        .lp-bd{width:7px;height:7px;border-radius:50%;background:var(--blue);flex-shrink:0;animation:lpBdPulse 1.8s ease-in-out infinite}
        @keyframes lpBdPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--blue) 40%,transparent)}70%{box-shadow:0 0 0 8px transparent}}
        .lp-h1{position:relative;z-index:3;font-size:clamp(44px,7vw,92px);font-weight:700;line-height:1.12;letter-spacing:0;margin-bottom:22px;animation:lpFade .6s .2s ease both}
        .lp-blue{color:var(--blue)}
        .lp-sub{position:relative;z-index:3;font-size:clamp(15px,1.7vw,19px);color:var(--txt2);line-height:1.8;max-width:540px;margin:0 auto 44px;animation:lpFade .6s .3s ease both}
        .lp-hbtns{position:relative;z-index:3;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:72px;animation:lpFade .6s .4s ease both}
        .lp-bp{padding:16px 42px;border-radius:100px;background:var(--blue);color:#fff;font-family:var(--font-arabic);font-size:16px;font-weight:700;border:none;cursor:pointer;box-shadow:0 6px 20px var(--shadow);transition:all .25s}
        .lp-bp:hover{background:var(--blue2);transform:translateY(-3px);box-shadow:0 10px 30px var(--shadow)}
        .lp-bs{padding:16px 42px;border-radius:100px;background:transparent;color:var(--txt);font-family:var(--font-arabic);font-size:16px;font-weight:700;border:1.5px solid var(--brd);cursor:pointer;transition:all .25s}
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
        .lp-mtag{display:flex;align-items:center;gap:10px;padding:9px 22px;border-radius:100px;background:var(--card);border:1px solid var(--brd);font-size:14px;font-weight:700;color:var(--txt2);white-space:nowrap;font-family:var(--font-arabic)}
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
        .lp-faq-q{width:100%;display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:none;border:none;cursor:pointer;font-family:var(--font-arabic);font-size:15px;font-weight:700;color:var(--txt);text-align:start}
        .lp-faq-arrow{font-size:18px;transition:transform .25s;color:var(--blue);flex-shrink:0}
        .lp-faq-item.open .lp-faq-arrow{transform:rotate(45deg)}
        .lp-faq-a{padding:0 24px 20px;font-size:14px;color:var(--txt2);line-height:1.75}

        /* CTA */
        .lp-cta-wrap{padding:0 72px 6px}
        .lp-cta-inner{max-width:1200px;margin:0 auto;border-radius:28px;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--blue),var(--blue2));padding:100px 72px 222px;text-align:center}
        .lp-cta-dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1px);background-size:24px 24px;pointer-events:none}
        .lp-cta-h{font-size:clamp(38px,6vw,80px);font-weight:700;line-height:1.12;letter-spacing:0;margin-bottom:16px;color:#fff;position:relative;z-index:1}
        .lp-cta-sub{font-size:17px;color:rgba(255,255,255,.75);margin-bottom:44px;position:relative;z-index:1}
        .lp-cta-btn{position:relative;z-index:1;display:inline-block;padding:20px 56px;border-radius:100px;background:#fff;color:var(--blue);font-family:var(--font-arabic);font-size:18px;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 28px rgba(0,0,0,.2);transition:all .3s}
        .lp-cta-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 14px 40px rgba(0,0,0,.3)}
        .lp-cta-note{margin-top:18px;font-size:13px;color:rgba(255,255,255,.55);position:relative;z-index:1}

        /* ONBOARDING FORM */
        #request-form{scroll-margin-top:100px}
        .lp-onboard-wrap{padding:0 72px 116px;margin-top:-178px;position:relative;z-index:2}
        .lp-onboard-inner{max-width:780px;margin:0 auto}
        .lp-onboard-head{text-align:center;max-width:680px;margin:0 auto 38px}
        .lp-onboard-title{font-size:clamp(42px,5.6vw,58px);font-weight:700;line-height:1.12;color:var(--txt);margin-bottom:18px}
        .lp-onboard-desc{margin:0 auto;font-size:19px;color:color-mix(in srgb,var(--txt2) 88%,var(--txt) 12%);line-height:1.95;max-width:620px}
        .lp-form-card{background:var(--card);border:1px solid color-mix(in srgb,var(--brd) 92%,transparent);border-radius:32px;padding:50px 46px 40px;box-shadow:0 28px 60px color-mix(in srgb,var(--shadow) 32%,transparent)}
        .lp-form-grid{display:grid;gap:16px}
        .lp-form-field{display:grid;gap:8px;text-align:start}
        .lp-form-label{font-size:14px;font-weight:600;color:var(--txt)}
        .lp-form-input,.lp-form-select,.lp-form-textarea{width:100%;border-radius:16px;border:1px solid color-mix(in srgb,var(--brd) 88%,transparent);background:color-mix(in srgb,var(--bg2) 88%,white 12%);padding:14px 16px;font-family:var(--font-arabic);font-size:15px;color:var(--txt);outline:none;transition:border-color .22s ease,box-shadow .22s ease,background-color .22s ease}
        .lp-form-input::placeholder,.lp-form-textarea::placeholder{color:var(--txt3)}
        .lp-form-input:focus,.lp-form-select:focus,.lp-form-textarea:focus{border-color:color-mix(in srgb,var(--blue) 28%,var(--brd));box-shadow:0 0 0 4px color-mix(in srgb,var(--blue) 10%,transparent);background:color-mix(in srgb,var(--bg) 92%,white 8%)}
        .lp-form-select{appearance:none}
        .lp-form-textarea{min-height:116px;resize:vertical}
        .lp-form-phone{direction:ltr;text-align:left}
        .lp-form-submit{width:100%;min-height:54px;border:none;border-radius:18px;background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;font-family:var(--font-arabic);font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 14px 28px color-mix(in srgb,var(--blue) 16%,transparent);transition:transform .24s ease,box-shadow .24s ease,background .24s ease}
        .lp-form-submit:hover{transform:translateY(-1.5px);background:linear-gradient(135deg,var(--blue2),color-mix(in srgb,var(--blue2) 88%,black 12%));box-shadow:0 18px 34px color-mix(in srgb,var(--blue) 18%,transparent)}
        .lp-form-trust{margin:14px 0 0;font-size:13px;line-height:1.8;color:var(--txt3);text-align:center}

        /* FOOTER */
        .lp-footer{padding:36px 72px;border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;background:var(--bg2)}
        .lp-footer-logo{width:clamp(120px,14vw,168px);max-width:58vw}
        .lp-fc2{font-size:13px;color:var(--txt3)}

        /* REVEAL */
        .lpr{opacity:0;transform:translateY(32px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
        .lpv{opacity:1!important;transform:none!important}

        /* HAMBURGER */
        .lp-hamburger{display:none;width:44px;height:44px;border-radius:999px;border:1px solid color-mix(in srgb,var(--nav-shell-border) 82%,transparent);background:var(--nav-theme-bg);cursor:pointer;align-items:center;justify-content:center;box-shadow:var(--nav-theme-shadow);transition:transform .24s cubic-bezier(.16,1,.3,1),background .24s,border-color .24s;flex-direction:column;gap:5px;padding:0}
        .lp-hamburger:hover{transform:translateY(-1.5px);background:color-mix(in srgb,var(--blue3) 68%,var(--bg2));border-color:color-mix(in srgb,var(--blue) 24%,var(--nav-shell-border))}
        .lp-hamburger span{display:block;width:18px;height:2px;background:var(--txt2);border-radius:2px;transition:transform .3s,opacity .3s}
        .lp-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .lp-hamburger.open span:nth-child(2){opacity:0}
        .lp-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        /* MOBILE MENU OVERLAY */
        .lp-mobile-menu{display:none;position:fixed;inset:0;z-index:199;padding-top:152px;padding-inline:16px;padding-bottom:32px;background:var(--bg);overflow-y:auto;transform:translateY(-100%);opacity:0;transition:transform .38s cubic-bezier(.16,1,.3,1),opacity .28s;pointer-events:none;display:flex;flex-direction:column}
        .lp-mobile-menu.open{transform:translateY(0);opacity:1;pointer-events:auto}
        .lp-mm-links{display:flex;flex-direction:column;gap:6px;flex:1}
        .lp-mm-link{width:100%;min-height:54px;padding:0 22px;border-radius:16px;border:1px solid var(--brd);background:var(--card);color:var(--txt);cursor:pointer;font-family:var(--font-arabic);font-size:16px;font-weight:600;text-align:start;transition:background .2s,border-color .2s,color .2s;display:flex;align-items:center}
        .lp-mm-link:active{background:var(--blue3);border-color:color-mix(in srgb,var(--blue) 30%,transparent);color:var(--blue)}
        .lp-mm-divider{height:1px;background:var(--brd);margin:auto 0 8px}
        .lp-mm-footer{display:flex;gap:8px}
        .lp-mm-footer-btn{flex:1;min-height:46px;border-radius:14px;border:1px solid var(--brd);background:var(--card);color:var(--txt2);cursor:pointer;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;transition:background .2s,border-color .2s,color .2s}
        .lp-mm-footer-btn:active{background:var(--blue3);border-color:color-mix(in srgb,var(--blue) 30%,transparent);color:var(--blue)}

        @media(max-width:900px){
          .lp-hamburger{display:flex}
          .lp-mobile-menu{display:block}
          .lpnav{top:12px;padding-inline:12px}
          .lpnav-shell{min-height:68px;padding:10px 14px;grid-template-columns:auto 1fr auto;grid-template-areas:"hamburger brand cta";gap:10px;align-items:center}
          .lpnav-menu{display:none}
          .lpnav-right{display:contents}
          .lp-nav-mini{display:none}
          .lp-hamburger{display:flex;grid-area:hamburger;justify-self:start;order:1}
          .lpnav-brand{grid-area:brand;justify-self:center;width:clamp(130px,34vw,165px);max-width:50vw;order:2;transform:translateX(20px)}
          .lpncta{grid-area:cta;justify-self:end;min-height:36px;padding:0 12px;font-size:12px;order:3}
          .lp-hero{padding:100px 20px 40px}
          .lp-hero-logo{width:min(100%,320px);max-width:calc(100vw - 32px)}
          .lp-sec,.lp-how-inner,.lp-faq-inner,.lp-nums-wrap,.lp-cta-wrap{padding-inline:20px}
          .lp-fg{grid-template-columns:1fr}
          .lp-nums-inner,.lp-rg,.lp-tg{grid-template-columns:1fr}
          .lp-steps{grid-template-columns:1fr}.lp-steps::before{display:none}
          .lp-mbody{grid-template-columns:1fr}.lp-msb{display:none}
          .lp-kpis{grid-template-columns:1fr 1fr}
          .lp-footer{padding:24px 20px;flex-direction:column;gap:10px;text-align:center}
          .lp-footer-logo{max-width:62vw}
          .lp-cta-wrap{padding-bottom:10px}
          .lp-cta-inner{padding:60px 24px 122px}
          .lp-onboard-wrap{padding:0 20px 96px;margin-top:-72px}
          .lp-onboard-inner{max-width:100%}
          .lp-onboard-head{margin-bottom:26px}
          .lp-onboard-title{font-size:clamp(34px,9vw,42px)}
          .lp-onboard-desc{font-size:16px;line-height:1.9}
          .lp-form-card{padding:34px 24px 28px}

          /* Larger text on mobile for readability */
          .lp-sec-eye{font-size:13px}
          .lp-sec-h{letter-spacing:-0.5px;margin-bottom:36px}
          .lp-fc{padding:28px 24px}
          .lp-fc-t{font-size:18px}
          .lp-fc-d{font-size:15px;line-height:1.8}
          .lp-step{padding:26px 22px}
          .lp-step-t{font-size:17px}
          .lp-step-d{font-size:15px;line-height:1.8}
          .lp-ni-n{font-size:48px}
          .lp-ni-l{font-size:15px}
          .lp-ni{padding:36px 16px}
          .lp-tc{padding:26px 22px}
          .lp-tc-text{font-size:15px;line-height:1.85}
          .lp-tc-name{font-size:15px}
          .lp-tc-role{font-size:13px}
          .lp-rc{padding:24px 20px}
          .lp-rt{font-size:17px}
          .lp-rd{font-size:15px;line-height:1.75}
          .lp-faq-q{font-size:16px;padding:18px 20px}
          .lp-faq-a{font-size:15px;line-height:1.8;padding:0 20px 18px}
          .lp-mtag{font-size:15px;padding:10px 20px}
          .lp-cta-sub{font-size:16px}
          .lp-cta-note{font-size:14px}
          .lp-mm-link{font-size:17px;min-height:58px}
        }
      `}</style>

      {/* NAV */}
      <nav id="lpnav" className="lpnav" ref={navRef}>
        <div id="lpnav-shell" className="lpnav-shell">
          <div className="lplogo lpnav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img className="lp-logo-img" src={landingLogoSrc} alt="MANGZONE" draggable={false} />
          </div>
          <div className="lpnav-menu" style={{ direction: 'rtl' }}>
            <div className="lpnav-links">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  className="lpnl"
                  onClick={() => (id === 'request-form'
                    ? document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })
                    : scrollTo(id))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="lpnav-right">
            <button className="lpncta" onClick={go}>{content.headerCta}</button>
            <button className="lp-nav-mini lp-lang-btn" type="button" onClick={toggleLanguage} title={languageToggleTitle}>
              {languageToggleLabel}
            </button>
            <button className="lp-nav-mini lp-theme-btn" onClick={() => setDark((d) => !d)} title={dark ? content.themeLight : content.themeDark}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              className={`lp-hamburger${mobileMenuOpen ? ' open' : ''}`}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div className={`lp-mobile-menu${mobileMenuOpen ? ' open' : ''}`} dir="ltr" style={{ paddingTop: navHeight }}>
        <div className="lp-mm-links">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              className="lp-mm-link"
              onClick={() => {
                setMobileMenuOpen(false);
                setTimeout(() => id === 'request-form'
                  ? document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })
                  : scrollTo(id), 100);
              }}
            >
              {label}
            </button>
          ))}
          <div className="lp-mm-divider" />
          <div className="lp-mm-footer">
            <button className="lp-mm-footer-btn" onClick={toggleLanguage}>
              🌐 {languageToggleLabel}
            </button>
            <button className="lp-mm-footer-btn" onClick={() => setDark((d) => !d)}>
              {dark ? '☀️' : '🌙'} {dark ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-grid" />

        {/* Big Logo */}
        <div className="lp-hero-logo">
          <img className="lp-logo-img" src={landingLogoSrc} alt="MANGZONE" draggable={false} />
        </div>

        <div className="lp-badge">
          <div className="lp-bd" />
          {content.badge}
        </div>

        <h1 className="lp-h1">
          {content.hero.line1} <span className="lp-blue">{content.hero.accent1}</span><br />
          {content.hero.line2} <span className="lp-blue">{content.hero.accent2}</span>
        </h1>

        <p className="lp-sub">
          {content.hero.subLine1}<br />
          {content.hero.subLine2}
        </p>

        <div className="lp-hbtns">
          <button className="lp-bp" onClick={go}>{content.hero.primaryCta}</button>
          <button className="lp-bs" onClick={() => scrollTo('features')}>{content.hero.secondaryCta}</button>
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
        <div className="lp-marquee-track">
          {marqueeTags.map(({ ic, t }, index) => (
            <div key={`${t}-${index}`} className="lp-mtag">
              <span style={{ fontSize: 17 }}>{ic}</span>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="lp-sec lpr" id="features">
        <div className="lp-sec-eye">{content.sections.featuresEye}</div>
        <h2 className="lp-sec-h" style={{ lineHeight: 1.35 }}>{content.sections.featuresTitle}<br /><span className="lp-blue">{content.sections.featuresAccent}</span></h2>
        <div className="lp-fg">
          {features.map(({ n, t, d }) => (
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
          <div className="lp-sec-eye">{content.sections.howEye}</div>
          <h2 className="lp-sec-h" style={{ marginBottom: 48 }}>{content.sections.howTitle} <span className="lp-blue">{content.sections.howAccent}</span></h2>
          <div className="lp-steps">
            {steps.map(({ n, t, d }) => (
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
          <div className="lp-ni"><div className="lp-ni-n" id="n1">0+</div><div className="lp-ni-l">{content.stats[0]}</div></div>
          <div className="lp-ni"><div className="lp-ni-n" id="n2">0</div><div className="lp-ni-l">{content.stats[1]}</div></div>
          <div className="lp-ni"><div className="lp-ni-n" id="n3">0%</div><div className="lp-ni-l">{content.stats[2]}</div></div>
          <div className="lp-ni"><div className="lp-ni-n">∞</div><div className="lp-ni-l">{content.stats[3]}</div></div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section className="lp-sec lpr" id="testimonials">
        <div className="lp-sec-eye">{content.sections.testimonialsEye}</div>
        <h2 className="lp-sec-h">{content.sections.testimonialsTitle} <span className="lp-blue">{content.sections.testimonialsAccent}</span></h2>
        <div className="lp-tg">
          {testimonials.map(({ name, role, text, stars }) => (
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
        <div className="lp-sec-eye">{content.sections.rolesEye}</div>
        <h2 className="lp-sec-h">{content.sections.rolesTitle} <span className="lp-blue">{content.sections.rolesAccent}</span></h2>
        <div className="lp-rg">
          {roles.map(({ i, t, d, bg }) => (
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
          <div className="lp-sec-eye">{content.sections.faqEye}</div>
          <h2 className="lp-sec-h" style={{ marginBottom: 40 }}>{content.sections.faqTitle} <span className="lp-blue">{content.sections.faqAccent}</span></h2>
          {faqs.map(({ q, a }, i) => (
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
          <h2 className="lp-cta-h">{content.cta.line1}<br />{content.cta.line2}</h2>
          <p className="lp-cta-sub">{content.cta.sub}</p>
          <button className="lp-cta-btn" onClick={go}>{content.cta.button}</button>
          <p className="lp-cta-note">{content.cta.note}</p>
        </div>
      </div>

      <section id="request-form" className="lp-onboard-wrap">
        <div className="lp-onboard-inner">
          <div className="lp-form-card">
            <div className="lp-onboard-head">
              <h2 className="lp-onboard-title">{content.form.title}</h2>
              <p className="lp-onboard-desc">
                {content.form.descLine1}
                <br />
                {content.form.descLine2}
              </p>
            </div>

            <form className="lp-form-grid" onSubmit={handleLeadSubmit}>
              <label className="lp-form-field">
                <span className="lp-form-label">{content.form.fullNameLabel}</span>
                <input
                  className="lp-form-input"
                  type="text"
                  value={formData.fullName}
                  onChange={handleFieldChange('fullName')}
                  placeholder={content.form.fullNamePlaceholder}
                  required
                />
              </label>

              <label className="lp-form-field">
                <span className="lp-form-label">{content.form.phoneLabel}</span>
                <input
                  className="lp-form-input lp-form-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder={content.form.phonePlaceholder ?? ''}
                />
              </label>

              <label className="lp-form-field">
                <span className="lp-form-label">{content.form.clinicLabel}</span>
                <input
                  className="lp-form-input"
                  type="text"
                  value={formData.clinicName}
                  onChange={handleFieldChange('clinicName')}
                  placeholder={content.form.clinicPlaceholder}
                />
              </label>

              <label className="lp-form-field">
                <span className="lp-form-label">{content.form.teamLabel}</span>
                <select
                  className="lp-form-select"
                  value={formData.teamSize}
                  onChange={handleFieldChange('teamSize')}
                >
                  <option value="">{content.form.teamPlaceholder}</option>
                  {content.form.teamOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="lp-form-field">
                <span className="lp-form-label">{content.form.notesLabel}</span>
                <textarea
                  className="lp-form-textarea"
                  value={formData.notes}
                  onChange={handleFieldChange('notes')}
                  placeholder={content.form.notesPlaceholder}
                />
              </label>

              <button className="lp-form-submit" type="submit" disabled={submitting}>
                {submitted ? (isAr ? '✓ تم الإرسال بنجاح!' : '✓ Sent successfully!') : submitting ? (isAr ? 'جاري الإرسال...' : 'Sending...') : content.form.submit}
              </button>
            </form>

            <p className="lp-form-trust">{content.form.trust}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lplogo lp-footer-logo">
          <img className="lp-logo-img" src={landingLogoSrc} alt="MANGZONE" draggable={false} />
        </div>
        <div className="lp-fc2">{content.footer} · © {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
