import { type SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-thrift-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full px-3 py-2.5 bg-thrift-surface border border-thrift-border rounded-input text-thrift-text appearance-none cursor-pointer transition-all duration-200 ${
              error ? 'border-thrift-error focus:border-thrift-error focus:ring-thrift-error/20' : ''
            } ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-thrift-text-secondary pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-sm text-thrift-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-thrift-text-secondary">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
