import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      loading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-btn focus:outline-none focus:ring-2 focus:ring-thrift-primary/20 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-thrift-primary text-white hover:bg-thrift-primary/90 active:bg-thrift-primary/80 hover:-translate-y-0.5 hover:shadow-lift',
      secondary:
        'bg-thrift-secondary text-white hover:bg-thrift-secondary/90 active:bg-thrift-secondary/80 hover:-translate-y-0.5 hover:shadow-lift',
      outline:
        'border-2 border-thrift-primary text-thrift-primary bg-transparent hover:bg-thrift-primary/5 active:bg-thrift-primary/10',
      ghost:
        'text-thrift-text-secondary hover:bg-thrift-border/50 active:bg-thrift-border',
      danger:
        'bg-thrift-error text-white hover:bg-thrift-error/90 active:bg-thrift-error/80 hover:-translate-y-0.5 hover:shadow-lift',
    };

    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-base px-4 py-2 gap-2',
      lg: 'text-lg px-6 py-3 gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C6.477 0 0 6.477 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
