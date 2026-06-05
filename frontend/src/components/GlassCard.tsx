import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`rounded-2xl p-6 glass-card ${className}`}>
      {children}
    </div>
  );
}
