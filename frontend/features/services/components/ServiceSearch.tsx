import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface ServiceSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync prop changes (e.g. if cleared from outside)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Only call parent trigger if the value actually changed
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Search for services (e.g., PAN, Voter, Samagra)..."
        className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue text-sm shadow-sm transition-all duration-200"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
