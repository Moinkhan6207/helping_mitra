'use client';

import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  serviceName: string;
  amount: number;
  disabled?: boolean;
}

/**
 * ConsentCheckbox — Legal consent declaration.
 * User must explicitly check this before submitting any service application.
 * Consent text is captured and stored in the order record.
 */
export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  serviceName,
  amount,
  disabled = false,
}: ConsentCheckboxProps) {
  const consentText = `I, the undersigned, hereby declare that all information and documents provided for the "${serviceName}" application are true, accurate, and complete to the best of my knowledge. I authorize Helping Mitra to process my application and deduct ₹${amount.toFixed(2)} from my wallet. I understand that submitting false information may result in rejection of my application.`;

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        checked
          ? 'border-emerald-300 bg-emerald-50/60'
          : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
      }`}
    >
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer"
      >
        {/* Custom Checkbox */}
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              checked
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-slate-300 bg-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange(!checked)}
          >
            {checked && <CheckCircle size={13} className="text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield size={13} className={checked ? 'text-emerald-600' : 'text-slate-400'} />
            <span className={`text-xs font-bold ${checked ? 'text-emerald-700' : 'text-slate-600'}`}>
              Declaration & Consent
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{consentText}</p>
        </div>
      </label>
    </div>
  );
}

// Export consent text generator so order submit hook can retrieve it
export function buildConsentText(serviceName: string, amount: number): string {
  return `I, the undersigned, hereby declare that all information and documents provided for the "${serviceName}" application are true, accurate, and complete to the best of my knowledge. I authorize Helping Mitra to process my application and deduct ₹${amount.toFixed(2)} from my wallet. I understand that submitting false information may result in rejection of my application.`;
}
