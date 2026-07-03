import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  characterCount?: boolean;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, characterCount, maxChars, className = '', id, value, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const currentLength = value?.toString().length || 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-thrift-text mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          className={`w-full px-3 py-2.5 bg-thrift-surface border border-thrift-border rounded-input text-thrift-text placeholder:text-thrift-text-secondary/50 transition-all duration-200 resize-none ${
            error ? 'border-thrift-error focus:border-thrift-error focus:ring-thrift-error/20' : ''
          } ${className}`}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          {error && <p className="text-sm text-thrift-error">{error}</p>}
          {hint && !error && <p className="text-sm text-thrift-text-secondary">{hint}</p>}
          {characterCount && maxChars && (
            <p className={`text-sm ml-auto ${currentLength > maxChars ? 'text-thrift-error' : 'text-thrift-text-secondary'}`}>
              {currentLength}/{maxChars}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
