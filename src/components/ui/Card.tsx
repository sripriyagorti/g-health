import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className, padding = 'md', onClick, ...props }: CardProps) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-7' : 'p-5';
  return (
    <div
      className={cn(
        'bg-surface rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)]',
        pad,
        onClick && 'cursor-pointer active:scale-[0.99] transition-transform',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
