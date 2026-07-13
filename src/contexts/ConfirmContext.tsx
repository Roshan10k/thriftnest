import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { Modal } from '../components/modals/Modal';
import { Button } from '../components/ui/Button';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When true, the dialog asks for the user's password before confirming. */
  requirePassword?: boolean;
}

export interface ConfirmResult {
  confirmed: boolean;
  password: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [password, setPassword] = useState('');
  const resolverRef = useRef<((result: ConfirmResult) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setPassword('');
    setOptions(opts);
    return new Promise<ConfirmResult>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result: ConfirmResult) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
    setPassword('');
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={options !== null}
        onClose={() => close({ confirmed: false, password: '' })}
        title={options?.title ?? ''}
        size="sm"
      >
        {options?.message && (
          <p className="text-sm text-thrift-text-secondary mb-4">{options.message}</p>
        )}
        {options?.requirePassword && (
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 mb-4 border border-thrift-border rounded-input text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && password) close({ confirmed: true, password });
            }}
          />
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => close({ confirmed: false, password: '' })}>
            {options?.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            variant={options?.danger ? 'danger' : 'primary'}
            disabled={options?.requirePassword ? !password : false}
            onClick={() => close({ confirmed: true, password })}
          >
            {options?.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}
