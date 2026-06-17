import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverGlow = false,
  glass = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-300';
  const glowStyles = hoverGlow 
    ? 'hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-300/50 hover:translate-y-[-2px]' 
    : '';
  const glassStyles = glass ? 'backdrop-blur-md bg-white/80' : '';

  return (
    <div
      className={`${baseStyles} ${glowStyles} ${glassStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
