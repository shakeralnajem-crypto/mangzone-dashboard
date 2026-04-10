import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: 'h-7 w-7', text: 'text-base' },
  md: { img: 'h-9 w-9', text: 'text-lg' },
  lg: { img: 'h-12 w-12', text: 'text-2xl' },
};

export function BrandLogo({
  size = 'md',
  variant = 'default',
  showText = true,
  className,
}: BrandLogoProps) {
  const { img, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="MANGZONE logo"
        className={cn(img, 'object-contain flex-shrink-0')}
        draggable={false}
      />
      {showText && (
        <span
          className={cn(
            text,
            'font-bold tracking-tight select-none',
            variant === 'white' ? 'text-white' : 'text-slate-900'
          )}
        >
          MANGZONE
        </span>
      )}
    </div>
  );
}
