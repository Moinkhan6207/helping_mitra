import React from 'react';

interface StatusToggleProps {
  status: 'ACTIVE' | 'INACTIVE';
  onChange: (newStatus: 'ACTIVE' | 'INACTIVE') => void;
  disabled?: boolean;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ status, onChange, disabled = false }) => {
  const isActive = status === 'ACTIVE';

  const handleToggle = () => {
    if (disabled) return;
    onChange(isActive ? 'INACTIVE' : 'ACTIVE');
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}
      `}
    >
      <span className="sr-only">Toggle status</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out
          ${isActive ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};

export default StatusToggle;
