import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRtl = i18n.language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Step 1: Sign in with Supabase Auth
      const authData = await authApi.login({ email, password });
      if (!authData?.user) throw new Error('User not found');
      const user = authData.user;

      // Step 2: Fetch profile directly — no waiting on external listeners
      const profile = await authApi.getProfile(user.id);

      // Step 3: Write to store then navigate
      setAuth(user, profile);
      const destination = from === '/' ? '/dashboard' : from;
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      // Clear any partial session if profile fetch fails
      await authApi.logout().catch(() => {});

      const message = err instanceof Error ? err.message : '';
      if (
        message.includes('Invalid login credentials') ||
        message.includes('invalid_grant')
      ) {
        setError(t('auth.error.invalid_credentials'));
      } else if (
        message.includes('PROFILE_MISSING')
      ) {
        setError('Profile not found. Ask your administrator to set up your account.');
      } else {
        setError(t('auth.error.generic'));
      }
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <div className={`flex min-h-screen ${isRtl ? 'font-arabic' : 'font-sans'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left panel — brand showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient background matching logo colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-500" />
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <BrandLogo size="lg" variant="white" />
          </div>
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              {isRtl
                ? 'إدارة عيادتك بذكاء واحترافية'
                : 'Manage your clinic with intelligence & precision'}
            </h1>
            <p className="text-lg text-white/75 leading-relaxed">
              {isRtl
                ? 'نظام متكامل لإدارة المرضى، المواعيد، خطط العلاج، والفواتير في مكان واحد.'
                : 'A complete system for patients, appointments, treatment plans, and billing — all in one place.'}
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(isRtl
                ? ['إدارة المرضى', 'جدولة المواعيد', 'خطط العلاج', 'الفواتير', 'التقارير']
                : ['Patient Management', 'Appointment Scheduling', 'Treatment Plans', 'Billing', 'Reports']
              ).map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} MANGZONE. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 lg:px-12 xl:px-20">
        {/* Language toggle */}
        <div className="absolute top-5 end-5">
          <button
            onClick={toggleLanguage}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            {i18n.language === 'en' ? 'عربي' : 'English'}
          </button>
        </div>

        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo size="md" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcome')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('auth.subtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="ps-9"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <button
                  type="button"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  {t('auth.forgot_password')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ps-9 pe-9"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-fuchsia-500 hover:from-indigo-600 hover:via-purple-700 hover:to-fuchsia-600 text-white border-0 font-semibold h-11 shadow-md shadow-purple-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('auth.signing_in') : t('auth.login')}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            MANGZONE © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
