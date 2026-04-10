export const BRAND = {
  name: 'MANGZONE',
  logo: '/logo.png',
  description: 'Premium Dental Clinic Management System',
  theme: {
    // Matches the logo gradient: indigo → purple → fuchsia
    gradientFrom: '#818cf8',
    gradientVia: '#a855f7',
    gradientTo: '#e879f9',
    primaryColor: '#7c3aed',
    accentColor: '#a855f7',
  },
  supportedLanguages: [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
  ],
  defaultLanguage: 'en',
} as const;
