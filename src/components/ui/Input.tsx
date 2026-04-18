import React from 'react';
import { cn } from '../../lib/utils';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {
  suffix?: string;
}

export function Input({ label, hint, error, suffix, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className={cn('block space-y-1', className)}>
      {label && <span className="text-xs font-medium text-ink-muted">{label}</span>}
      <div className={cn(
        'flex items-center bg-surface-muted rounded-[var(--radius-field)] border transition-colors focus-within:border-brand-500 focus-within:bg-surface',
        error ? 'border-bad-500' : 'border-transparent'
      )}>
        <input
          id={inputId}
          className="flex-1 bg-transparent border-none px-3.5 py-3 text-sm text-ink placeholder:text-ink-soft focus:outline-none"
          {...props}
        />
        {suffix && <span className="pr-3 text-xs text-ink-soft">{suffix}</span>}
      </div>
      {(error || hint) && (
        <span className={cn('text-[11px]', error ? 'text-bad-500' : 'text-ink-soft')}>
          {error || hint}
        </span>
      )}
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

export function Select({ label, hint, error, className, id, children, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <label htmlFor={selectId} className={cn('block space-y-1', className)}>
      {label && <span className="text-xs font-medium text-ink-muted">{label}</span>}
      <select
        id={selectId}
        className={cn(
          'w-full bg-surface-muted border rounded-[var(--radius-field)] px-3.5 py-3 text-sm text-ink focus:outline-none focus:border-brand-500 focus:bg-surface transition-colors',
          error ? 'border-bad-500' : 'border-transparent'
        )}
        {...props}
      >
        {children}
      </select>
      {(error || hint) && (
        <span className={cn('text-[11px]', error ? 'text-bad-500' : 'text-ink-soft')}>
          {error || hint}
        </span>
      )}
    </label>
  );
}
