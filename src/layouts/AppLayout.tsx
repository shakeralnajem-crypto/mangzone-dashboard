import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList, ReceiptText,
  Settings, LogOut, Menu, X, BarChart3, UserCog, Megaphone,
  Sun, Moon, Calculator, Share2, PhoneCall, Stethoscope, Plus,
  MoreHorizontal, Undo2, Redo2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authApi } from '@/features/auth/api/auth.api';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/translations';
import { useHistoryStore } from '@/store/historyStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/types';

interface NavItem {
  label_en: string;
  label_ar: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label_en: 'Dashboard',      label_ar: 'لوحة التحكم',      icon: LayoutDashboard, to: '/dashboard',    roles: ['ADMIN','DOCTOR','RECEPTIONIST','ACCOUNTANT'] },
  { label_en: 'Appointments',   label_ar: 'المواعيد',          icon: CalendarDays,    to: '/appointments', roles: ['ADMIN','DOCTOR','RECEPTIONIST'] },
  { label_en: 'Patients',       label_ar: 'المرضى',            icon: Users,           to: '/patients',     roles: ['ADMIN','DOCTOR','RECEPTIONIST'] },
  { label_en: 'Leads',          label_ar: 'العملاء المحتملون', icon: Megaphone,       to: '/leads',        roles: ['ADMIN','RECEPTIONIST'] },
  { label_en: 'Treatments',     label_ar: 'خطط العلاج',        icon: ClipboardList,   to: '/treatments',   roles: ['ADMIN','DOCTOR'] },
  { label_en: 'Billing',        label_ar: 'الفواتير',          icon: ReceiptText,     to: '/billing',      roles: ['ADMIN','ACCOUNTANT'] },
  { label_en: 'Follow-up',      label_ar: 'المتابعة',          icon: PhoneCall,       to: '/followup',     roles: ['ADMIN','RECEPTIONIST'] },
  { label_en: 'Reports',        label_ar: 'التقارير',          icon: BarChart3,       to: '/reports',      roles: ['ADMIN','ACCOUNTANT'] },
  { label_en: 'Accounting',     label_ar: 'المحاسبة',          icon: Calculator,      to: '/accounting',   roles: ['ADMIN','ACCOUNTANT'] },
  { label_en: 'Services',       label_ar: 'الخدمات',           icon: Stethoscope,     to: '/services',     roles: ['ADMIN'] },
  { label_en: 'Team',           label_ar: 'الفريق',            icon: UserCog,         to: '/staff',        roles: ['ADMIN'] },
  { label_en: 'Content',        label_ar: 'المحتوى',           icon: Share2,          to: '/content',      roles: ['ADMIN'] },
  { label_en: 'Settings',       label_ar: 'الإعدادات',         icon: Settings,        to: '/settings',     roles: ['ADMIN'] },
];

const navGroups = [
  { label_en: 'MAIN',       label_ar: 'الرئيسية',  paths: ['/dashboard','/appointments','/patients','/leads'] },
  { label_en: 'MANAGEMENT', label_ar: 'الإدارة',   paths: ['/treatments','/billing','/followup','/reports','/accounting'] },
  { label_en: 'SETTINGS',   label_ar: 'الإعدادات', paths: ['/services','/staff','/content','/settings'] },
];

const pageMeta: Record<string, { en: string; ar: string; sub_en: string; sub_ar: string }> = {
  '/dashboard':    { en: 'Dashboard',       ar: 'لوحة التحكم',        sub_en: 'Clinic overview & stats',          sub_ar: 'نظرة عامة على العيادة' },
  '/appointments': { en: 'Appointments',    ar: 'المواعيد',            sub_en: 'Manage patient appointments',       sub_ar: 'إدارة مواعيد المرضى' },
  '/patients':     { en: 'Patients',        ar: 'المرضى',              sub_en: 'Patient records & files',           sub_ar: 'سجلات وملفات المرضى' },
  '/leads':        { en: 'Leads',           ar: 'العملاء المحتملون',   sub_en: 'Track new enquiries',               sub_ar: 'متابعة الاستفسارات الجديدة' },
  '/treatments':   { en: 'Treatments',      ar: 'خطط العلاج',          sub_en: 'Monitor treatment progress',        sub_ar: 'متابعة مسار العلاج' },
  '/billing':      { en: 'Billing',         ar: 'الفواتير',            sub_en: 'Invoices & payments',               sub_ar: 'إدارة الفواتير والمدفوعات' },
  '/followup':     { en: 'Follow-up',       ar: 'المتابعة',            sub_en: 'Post-visit patient follow-up',      sub_ar: 'متابعة المرضى بعد الزيارة' },
  '/reports':      { en: 'Reports',         ar: 'التقارير',            sub_en: 'Clinic performance analytics',      sub_ar: 'تحليل أداء العيادة' },
  '/accounting':   { en: 'Accounting',      ar: 'المحاسبة',            sub_en: 'Expenses & revenue',                sub_ar: 'المصروفات والإيرادات' },
  '/content':      { en: 'Content',         ar: 'المحتوى',             sub_en: 'Social media management',           sub_ar: 'إدارة منصات التواصل الاجتماعي' },
  '/services':     { en: 'Services',        ar: 'الخدمات',             sub_en: 'Clinic service catalogue',          sub_ar: 'قائمة خدمات العيادة' },
  '/staff':        { en: 'Team',            ar: 'الفريق',              sub_en: 'Doctors & staff members',           sub_ar: 'الأطباء والموظفون' },
  '/settings':     { en: 'Settings',        ar: 'الإعدادات',           sub_en: 'Account & system settings',        sub_ar: 'إعدادات الحساب والنظام' },
};

function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { profile, clearAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const allowedNav = navItems.filter(item => profile?.role && item.roles.includes(profile.role));

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'MZ';

  return (
    <aside style={{ width: 190, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--brd)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'}
          alt="MANGZONE"
          style={{ width: '100%', height: 'auto', maxHeight: 120, objectFit: 'contain', display: 'block' }}
          draggable={false}
        />
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--txt3)', padding: 4, borderRadius: 8, border: '1px solid var(--brd)', background: 'transparent', cursor: 'pointer', display: 'flex' }} className="lg:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {navGroups.map(group => {
          const items = allowedNav.filter(item => group.paths.includes(item.to));
          if (!items.length) return null;
          return (
            <div key={group.label_en} style={{ marginBottom: 8 }}>
              <div className="sidebar-group-label">{isAr ? group.label_ar : group.label_en}</div>
              {items.map(({ label_en, label_ar, icon: Icon, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span>{isAr ? label_ar : label_en}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User card */}
      <div style={{ padding: 14, borderTop: '1px solid var(--brd)' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--p-ultra)', border: '1px solid var(--brd)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p-soft)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p-ultra)'; }}
            >
              <div className="ds-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{profile?.role}</div>
              </div>
              <MoreHorizontal size={15} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            {profile?.role === 'ADMIN' && (
              <>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" /> {t.settings}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="h-4 w-4 mr-2" /> {isAr ? 'تسجيل الخروج' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useThemeStore();
  const isAr = i18n.language === 'ar';

  const meta = pageMeta[location.pathname] ?? { en: 'MANGZONE', ar: 'MANGZONE', sub_en: '', sub_ar: '' };
  const t = useT(isAr);
  const { past, future, undo, redo, isProcessing } = useHistoryStore();
  const { canAction } = usePermissions();
  const canUndo = past.length > 0 && !isProcessing;
  const canRedo = future.length > 0 && !isProcessing;

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isAr]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        await useHistoryStore.getState().undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        await useHistoryStore.getState().redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ height: '100%' }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex' }} className="lg:hidden">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'relative', display: 'flex', height: '100%' }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 64, flexShrink: 0,
          background: theme === 'dark' ? 'rgba(19,13,36,0.78)' : 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid var(--brd)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 12,
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Mobile menu */}
          <button className="lg:hidden ds-icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt)', lineHeight: 1.2 }}>
              {isAr ? meta.ar : meta.en}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 1 }}>
              {isAr ? meta.sub_ar : meta.sub_en}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language */}
            <button
              onClick={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
              className="ds-btn ds-btn-ghost"
              style={{ padding: '7px 13px', fontSize: 12 }}
            >
              {isAr ? 'EN' : 'عربي'}
            </button>

            {/* Undo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              title={`Undo${past.length > 0 ? ` (${past.length})` : ''} — Ctrl+Z`}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid var(--brd)',
                background: canUndo ? 'var(--p-soft)' : 'var(--p-ultra)',
                color: canUndo ? 'var(--p2)' : 'var(--txt3)',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', opacity: canUndo ? 1 : 0.45,
                position: 'relative', flexShrink: 0,
              }}
            >
              <Undo2 size={16} />
              {past.length > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  background: 'var(--p2)', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  borderRadius: 20, padding: '1px 4px',
                  minWidth: 14, textAlign: 'center', lineHeight: '14px',
                }}>
                  {past.length}
                </span>
              )}
            </button>

            {/* Redo */}
            <button
              onClick={redo}
              disabled={!canRedo}
              title={`Redo${future.length > 0 ? ` (${future.length})` : ''} — Ctrl+Shift+Z`}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: '1px solid var(--brd)',
                background: 'var(--p-ultra)',
                color: canRedo ? 'var(--txt2)' : 'var(--txt3)',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', opacity: canRedo ? 1 : 0.45, flexShrink: 0,
              }}
            >
              <Redo2 size={16} />
            </button>

            {/* Theme */}
            <button className="ds-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Primary action — hidden for roles without appointments access */}
            {canAction('create:appointment') && (
              <button className="ds-btn ds-btn-primary" onClick={() => navigate('/appointments')}>
                <Plus size={15} strokeWidth={2.5} />
                {t.newAppointment}
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
