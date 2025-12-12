import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  className?: string;
}

export function EmptyState({ icon, title, message, className = '' }: EmptyStateProps) {
  return (
    <div className={`p-12 text-center ${className}`} style={{ color: 'var(--text-secondary)' }}>
      {icon && <div className="mx-auto mb-4 opacity-50">{icon}</div>}
      <p className="text-lg font-medium">{title}</p>
      {message && <p className="text-sm mt-1">{message}</p>}
    </div>
  );
}
