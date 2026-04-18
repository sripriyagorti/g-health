import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-surface/90 backdrop-blur-md border-b border-line">
      <div className="px-5 md:px-8 pt-8 pb-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}
