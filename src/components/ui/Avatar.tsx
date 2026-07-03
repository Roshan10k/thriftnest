import { type ReactNode } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away';
  className?: string;
  children?: ReactNode;
}

export function Avatar({
  src,
  alt = '',
  size = 'md',
  status,
  className = '',
  children,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-thrift-success',
    offline: 'bg-thrift-text-secondary',
    away: 'bg-thrift-warning',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizes[size]} rounded-full object-cover border-2 border-thrift-border`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-thrift-border flex items-center justify-center`}
        >
          {children || <User className="w-1/2 h-1/2 text-thrift-text-secondary" />}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} rounded-full border-2 border-thrift-surface`}
        />
      )}
    </div>
  );
}
