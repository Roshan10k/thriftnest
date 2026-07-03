import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-thrift-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full px-3 py-2.5 bg-thrift-surface border border-thrift-border rounded-input text-thrift-text placeholder:text-thrift-text-secondary/50 transition-all duration-200 ${
              error ? 'border-thrift-error focus:border-thrift-error focus:ring-thrift-error/20' : ''
            } ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${
              (icon && iconPosition === 'right') || rightIcon ? 'pr-10' : ''
            } ${className}`}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-thrift-text-secondary">
              {icon}
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-thrift-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-thrift-text-secondary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
