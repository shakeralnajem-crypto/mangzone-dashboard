import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  ReceiptText,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  UserCog,
  ChevronDown,
  Megaphone,
  Sun,
  Moon,
  Calculator,
  Share2,
  PhoneCall,
  Stethoscope,
} from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { authApi } from '@/features/auth/api/auth.api';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface NavItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { key: 'nav.dashboard',    icon: LayoutDashboard, to: '/dashboard',    roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT'] },
  { key: 'nav.appointments', icon: CalendarDays,    to: '/appointments', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { key: 'nav.patients',     icon: Users,           to: '/patients',     roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { key: 'nav.leads',        icon: Megaphone,       to: '/leads',        roles: ['ADMIN', 'RECEPTIONIST'] },
  { key: 'nav.treatments',   icon: ClipboardList,   to: '/treatments',   roles: ['ADMIN', 'DOCTOR'] },
  { key: 'nav.billing',      icon: ReceiptText,     to: '/billing',      roles: ['ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
  { key: 'nav.followup',     icon: PhoneCall,       to: '/followup',     roles: ['ADMIN', 'RECEPTIONIST'] },
  { key: 'nav.reports',      icon: BarChart3,       to: '/reports',      roles: ['ADMIN', 'ACCOUNTANT'] },
  { key: 'nav.accounting',   icon: Calculator,      to: '/accounting',   roles: ['ADMIN', 'ACCOUNTANT'] },
  { key: 'nav.content',      icon: Share2,          to: '/content',      roles: ['ADMIN'] },
  { key: 'nav.services',     icon: Stethoscope,     to: '/services',     roles: ['ADMIN'] },
  { key: 'nav.staff',        icon: UserCog,         to: '/staff',        roles: ['ADMIN'] },
  { key: 'nav.settings',     icon: Settings,        to: '/settings',     roles: ['ADMIN'] },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, clearAuth } = useAuthStore();
  const isRtl = i18n.language === 'ar';

  const allowedNav = navItems.filter(
    (item) => profile?.role && item.roles.includes(profile.role)
  );

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    navigate('/login', { replace: true });
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'MZ';

  return (
    <aside className="flex h-full w-64 flex-col bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-700">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
        <BrandLogo size="sm" />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {allowedNav.map(({ key, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isRtl ? 'flex-row-reverse text-right' : '',
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-fuchsia-50 dark:from-indigo-900/30 dark:to-fuchsia-900/20 text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <span>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-start min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.role && t(`role.${profile.role}`)}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuLabel>{t('common.profile')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useThemeStore();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    document.body.className = isRtl ? 'font-arabic' : 'font-sans';
  }, [i18n.language, isRtl]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`flex h-screen w-full bg-slate-50 dark:bg-slate-950 ${isRtl ? 'font-arabic' : 'font-sans'}`}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className={cn('absolute inset-y-0 flex w-64', isRtl ? 'end-0' : 'start-0')}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 lg:px-6 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden">
            <BrandLogo size="sm" />
          </div>

          {/* Spacer (desktop) */}
          <div className="hidden lg:flex flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              {i18n.language === 'en' ? 'عربي' : 'English'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
