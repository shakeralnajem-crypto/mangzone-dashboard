import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { height: 36 },
  md: { height: 48 },
  lg: { height: 140 },
  xl: { height: 180 },
};

export function BrandLogo({
  size = 'md',
  className,
}: BrandLogoProps) {
  const { height } = sizes[size];

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src="/logo.svg"
        alt="MANGZONE"
        style={{ height, width: 'auto', objectFit: 'contain' }}
        draggable={false}
      />
    </div>
  );
}
