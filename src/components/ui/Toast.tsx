import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const interval = 50;
    const decrement = (interval / duration) * 100;
    let currentProgress = 100;

    const timer = setInterval(() => {
      currentProgress -= decrement;
      setProgress(currentProgress);

      if (currentProgress <= 0) {
        clearInterval(timer);
        removeToast(toast.id);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, toast.duration, removeToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-thrift-success" />,
    error: <XCircle className="w-5 h-5 text-thrift-error" />,
    warning: <AlertTriangle className="w-5 h-5 text-thrift-warning" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const borders = {
    success: 'border-l-thrift-success',
    error: 'border-l-thrift-error',
    warning: 'border-l-thrift-warning',
    info: 'border-l-blue-500',
  };

  return (
    <div
      className={`bg-thrift-surface border border-thrift-border border-l-4 ${borders[toast.type]} rounded-card shadow-lift p-4 flex items-start gap-3 fade-in`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-thrift-text">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-thrift-text-secondary hover:text-thrift-text transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 h-1 bg-thrift-success/20 w-full rounded-b-card overflow-hidden">
        <div
          className="h-full bg-thrift-success transition-all duration-50"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
