import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  theme?: 'light' | 'dark';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', containerClassName = '', theme = 'dark', id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className={`flex flex-col w-full gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`text-xs font-semibold uppercase tracking-wider ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full px-4 py-3 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              theme === 'light'
                ? `bg-white hover:bg-slate-50 text-slate-900 placeholder-slate-400 ${
                    error
                      ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-300 focus:ring-primary-blue/20 focus:border-primary-blue'
                  }`
                : `bg-slate-900/60 hover:bg-slate-900 text-slate-100 placeholder-slate-500 ${
                    error
                      ? 'border-red-500/80 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-800 focus:ring-primary-blue/20 focus:border-primary-blue'
                  }`
            }
            ${className}
          `}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-500/90 font-medium">{error}</span>
        ) : helperText ? (
          <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
