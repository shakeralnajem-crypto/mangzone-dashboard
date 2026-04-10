import { useTranslation } from 'react-i18next';
import { HardHat } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
      <div className="bg-indigo-50 p-5 rounded-full mb-6">
        <HardHat className="h-12 w-12 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
      <p className="text-slate-500 max-w-md text-lg">
        {isRtl 
          ? 'هذه الصفحة قيد التطوير حالياً، يرجى التحقق منها لاحقاً.' 
          : 'This page is currently under development. Please check back later.'}
      </p>
    </div>
  );
}