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

      // Step 2: Fetch profile — must succeed before we commit auth state
      const profile = await authApi.getProfile(user.id);

      // Step 3: Commit to store then navigate
      setAuth(user, profile);
      const destination = from === '/' ? '/dashboard' : from;
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      console.error('[auth] Login failed:', err);

      // Extract message from any thrown value (Error, AuthApiError, plain object)
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : String(err);

      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('ERR_INTERNET_DISCONNECTED') ||
        message.includes('ERR_NAME_NOT_RESOLVED') ||
        !navigator.onLine
      ) {
        setError(
          isRtl
            ? 'لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.'
            : 'No internet connection. Please check your network and try again.'
        );
      } else if (
        message.includes('Invalid login credentials') ||
        message.includes('invalid_grant')
      ) {
        setError(t('auth.error.invalid_credentials'));
      } else if (message.includes('PROFILE_MISSING')) {
        setError(
          'Profile not found. Ask your administrator to set up your account.'
        );
      } else if (message.includes('PROFILE_INACTIVE')) {
        setError(
          'Your account has been deactivated. Contact your administrator.'
        );
      } else if (message.includes('PROFILE_FETCH_ERROR')) {
        setError(
          'Could not load your profile. Please try again or contact support.'
        );
      } else {
        setError(t('auth.error.generic'));
      }

      setIsSubmitting(false);

      // Clear any partial Supabase session silently — after setting the error so
      // the SIGNED_OUT event does not interfere with the error state.
      authApi.logout().catch(() => {});
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <div
      className={`flex min-h-screen ${isRtl ? 'font-arabic' : 'font-sans'}`}
      dir="ltr"
    >
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
        <div className="relative z-10 flex flex-col items-center justify-center gap-10 p-12 text-white w-full">
          {/* Logo animated */}
          <div style={{ position: 'relative', width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`
              @keyframes blobMorph{0%,100%{border-radius:60% 40% 55% 45%/50% 60% 40% 50%}25%{border-radius:40% 60% 45% 55%/60% 40% 60% 40%}50%{border-radius:55% 45% 65% 35%/40% 55% 45% 60%}75%{border-radius:45% 55% 38% 62%/55% 45% 55% 45%}}
              @keyframes blobRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
              @keyframes blobGlow{0%,100%{opacity:.6}50%{opacity:1}}
              @keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
            `}</style>
            {/* Rotating gradient ring */}
            <div style={{ position:'absolute', inset:-24, borderRadius:'50%', background:'conic-gradient(from 0deg,rgba(255,255,255,0.6),rgba(167,139,250,0.4),rgba(255,255,255,0.1),rgba(192,132,252,0.5),rgba(255,255,255,0.6))', animation:'blobRotate 6s linear infinite', filter:'blur(2px)' }} />
            {/* Outer blob */}
            <div style={{ position:'absolute', inset:4, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', animation:'blobMorph 7s ease-in-out infinite, blobGlow 3.5s ease-in-out infinite', border:'1px solid rgba(255,255,255,0.5)' }} />
            {/* Inner blob with logo */}
            <div style={{ position:'relative', zIndex:2, width:220, height:220, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', animation:'blobMorph 7s ease-in-out infinite reverse, logoFloat 4s ease-in-out infinite', boxShadow:'0 12px 48px rgba(109,40,217,0.3)', padding:28 }}>
              <BrandLogo size="xl" variant="white" />
            </div>
          </div>
          <div className="space-y-6 max-w-md text-center">
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
                ? [
                    'إدارة المرضى',
                    'جدولة المواعيد',
                    'خطط العلاج',
                    'الفواتير',
                    'التقارير',
                  ]
                : [
                    'Patient Management',
                    'Appointment Scheduling',
                    'Treatment Plans',
                    'Billing',
                    'Reports',
                  ]
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
              © {new Date().getFullYear()} MANGZONE.{' '}
              {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
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
            <BrandLogo size="xl" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {t('auth.welcome')}
            </h2>
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
                  data-testid="login-email"
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
                  data-testid="login-password"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
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
              data-testid="login-submit"
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
