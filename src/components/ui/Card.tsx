import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-3xl p-6 shadow-sm border border-slate-100",
        className
      )} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
