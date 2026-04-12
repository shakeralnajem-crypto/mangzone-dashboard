import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Auth
      'auth.login': 'Sign In',
      'auth.email': 'Email address',
      'auth.password': 'Password',
      'auth.signing_in': 'Signing in...',
      'auth.forgot_password': 'Forgot password?',
      'auth.error.invalid_credentials': 'Invalid email or password.',
      'auth.error.generic': 'An error occurred. Please try again.',
      'auth.welcome': 'Welcome back',
      'auth.subtitle': 'Sign in to your MANGZONE account',

      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.patients': 'Patients',
      'nav.appointments': 'Appointments',
      'nav.leads': 'Leads / CRM',
      'nav.treatments': 'Treatments',
      'nav.billing': 'Billing',
      'nav.settings': 'Settings',
      'nav.staff': 'Staff',
      'nav.reports': 'Reports',
      'nav.services': 'Services',
      'nav.followup': 'Follow-ups',
      'nav.accounting': 'Accounting',
      'nav.content': 'Content Planner',

      // Common
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.actions': 'Actions',
      'common.confirm': 'Confirm',
      'common.back': 'Back',
      'common.logout': 'Sign out',
      'common.profile': 'Profile',

      // Roles
      'role.ADMIN': 'Administrator',
      'role.DOCTOR': 'Doctor',
      'role.RECEPTIONIST': 'Receptionist',
      'role.ACCOUNTANT': 'Accountant',
    },
  },
  ar: {
    translation: {
      // Auth
      'auth.login': 'تسجيل الدخول',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.signing_in': 'جاري تسجيل الدخول...',
      'auth.forgot_password': 'نسيت كلمة المرور؟',
      'auth.error.invalid_credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'auth.error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      'auth.welcome': 'أهلاً بعودتك',
      'auth.subtitle': 'سجّل الدخول إلى حساب MANGZONE',

      // Navigation
      'nav.dashboard': 'لوحة التحكم',
      'nav.patients': 'المرضى',
      'nav.appointments': 'المواعيد',
      'nav.leads': 'العملاء المحتملون',
      'nav.treatments': 'خطط العلاج',
      'nav.billing': 'الفواتير',
      'nav.settings': 'الإعدادات',
      'nav.staff': 'الموظفون',
      'nav.reports': 'التقارير',
      'nav.services': 'الخدمات',
      'nav.followup': 'المتابعة',
      'nav.accounting': 'المحاسبة',
      'nav.content': 'مخطط المحتوى',

      // Common
      'common.loading': 'جاري التحميل...',
      'common.save': 'حفظ',
      'common.cancel': 'إلغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.create': 'إنشاء',
      'common.search': 'بحث',
      'common.filter': 'تصفية',
      'common.actions': 'إجراءات',
      'common.confirm': 'تأكيد',
      'common.back': 'رجوع',
      'common.logout': 'تسجيل الخروج',
      'common.profile': 'الملف الشخصي',

      // Roles
      'role.ADMIN': 'مدير النظام',
      'role.DOCTOR': 'طبيب',
      'role.RECEPTIONIST': 'موظف استقبال',
      'role.ACCOUNTANT': 'محاسب',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
