import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ variant = 'neutral', children, size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-thrift-success/10 text-thrift-success border-thrift-success/20',
    warning: 'bg-thrift-warning/10 text-thrift-warning border-thrift-warning/20',
    error: 'bg-thrift-error/10 text-thrift-error border-thrift-error/20',
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    neutral: 'bg-thrift-border text-thrift-text-secondary border-thrift-border',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
