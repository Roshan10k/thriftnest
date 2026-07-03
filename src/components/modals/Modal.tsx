import { Fragment, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Fragment>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`w-full ${sizes[size]} bg-thrift-surface rounded-card shadow-lift p-6 relative fade-in`}
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-thrift-text-secondary hover:text-thrift-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {title && (
              <h2 className="text-xl font-semibold text-thrift-text font-playfair mb-4">
                {title}
              </h2>
            )}
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );
}
