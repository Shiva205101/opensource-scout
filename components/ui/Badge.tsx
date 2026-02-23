import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-surface-hover/60 text-text-main border-border',
    outline: 'bg-transparent border-border text-text-muted',
    success: 'bg-[rgba(var(--success-raw),0.12)] text-[rgb(var(--success-raw))] border-[rgba(var(--success-raw),0.28)]',
    warning: 'bg-[rgba(var(--warning-raw),0.12)] text-[rgb(var(--warning-raw))] border-[rgba(var(--warning-raw),0.28)]',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
