import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary: 'bg-surface-muted text-ink hover:bg-line active:bg-line disabled:opacity-50',
  ghost: 'bg-transparent text-ink hover:bg-surface-muted',
  danger: 'bg-bad-500 text-white hover:bg-bad-700',
  accent: 'bg-accent-500 text-white shadow-sm hover:bg-accent-600',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-[12px]',
  md: 'h-11 px-4 text-sm rounded-[14px]',
  lg: 'h-14 px-5 text-base rounded-[16px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
