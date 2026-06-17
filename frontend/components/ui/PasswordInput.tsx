import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  theme?: 'light' | 'dark';
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, containerClassName = '', className = '', theme = 'dark', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShow = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <div className={`relative flex flex-col w-full ${containerClassName}`}>
        <Input
          ref={ref}
          label={label}
          error={error}
          helperText={helperText}
          type={showPassword ? 'text' : 'password'}
          className={`pr-11 ${className}`}
          theme={theme}
          {...props}
        />
        <button
          type="button"
          onClick={toggleShow}
          tabIndex={-1}
          className={`absolute right-3.5 ${label ? 'top-[33px]' : 'top-[13px]'} text-slate-400 focus:outline-none transition-colors duration-150 ${
            theme === 'light' ? 'hover:text-slate-600' : 'hover:text-slate-200'
          }`}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
