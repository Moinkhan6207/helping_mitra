import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
}) => {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border';
  
  const variants = {
    primary: 'bg-primary-blue/10 text-primary-blue border-primary-blue/20',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
    info: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
