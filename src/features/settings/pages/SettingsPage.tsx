import { Settings, Moon, Sun, Globe } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { useT } from '@/lib/translations';

export function SettingsPage() {
  const { theme, toggle } = useThemeStore();
  const { profile } = useAuthStore();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const t = useT(isAr);

  const toggleLanguage = () => {
    i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  const isDark = theme === 'dark';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, animation: 'fadeIn 0.3s ease' }}>

      {/* Account */}
      <div className="ds-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Settings size={15} style={{ color: 'var(--p2)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t.account}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="ds-label">{t.fullName}</label>
            <div style={{
              borderRadius: 10, border: '1px solid var(--brd)',
              background: 'var(--bg3)', padding: '9px 12px',
              fontSize: 13, color: 'var(--txt2)',
            }}>
              {profile?.full_name ?? '—'}
            </div>
          </div>
          <div>
            <label className="ds-label">{t.role}</label>
            <div style={{
              borderRadius: 10, border: '1px solid var(--brd)',
              background: 'var(--bg3)', padding: '9px 12px',
              fontSize: 13, color: 'var(--txt2)',
            }}>
              {profile?.role ?? '—'}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ds-label">{t.specialization}</label>
            <div style={{
              borderRadius: 10, border: '1px solid var(--brd)',
              background: 'var(--bg3)', padding: '9px 12px',
              fontSize: 13, color: 'var(--txt2)',
            }}>
              {profile?.specialization ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="ds-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Moon size={15} style={{ color: 'var(--p2)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t.appearance}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 2 }}>{t.darkMode}</p>
            <p style={{ fontSize: 12, color: 'var(--txt3)' }}>{t.darkModeDesc}</p>
          </div>
          <button
            onClick={toggle}
            style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center',
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: isDark ? 'var(--p2)' : 'var(--brd)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: isDark ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--brd)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 2 }}>{t.currentTheme}</p>
            <p style={{ fontSize: 12, color: 'var(--txt3)' }}>{t.currentThemeDesc}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--txt2)' }}>
            {isDark ? <Moon size={14} /> : <Sun size={14} />}
            {isDark ? t.dark : t.light}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="ds-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Globe size={15} style={{ color: 'var(--p2)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{t.language}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 2 }}>{t.interfaceLanguage}</p>
            <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
              {t.currently}: {isAr ? 'العربية' : 'English'}
            </p>
          </div>
          <button onClick={toggleLanguage} className="ds-btn ds-btn-ghost" style={{ fontSize: 13 }}>
            {isAr ? t.switchToEnglish : t.switchToArabic}
          </button>
        </div>
      </div>

    </div>
  );
}
