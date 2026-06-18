import React from 'react';
import { AdminServiceFieldData } from '../types';
import { Lock, HelpCircle } from 'lucide-react';

interface ServiceFieldManagerProps {
  serviceId: string;
  fields: AdminServiceFieldData[];
}

export const ServiceFieldManager: React.FC<ServiceFieldManagerProps> = ({ fields }) => {
  const sortedFields = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  // Helper to format validation rules into a human-readable text
  const formatValidationRules = (rules: any) => {
    if (!rules || typeof rules !== 'object' || Object.keys(rules).length === 0) {
      return <span className="text-gray-400">None</span>;
    }
    const parts: string[] = [];
    if (rules.minLength !== undefined && rules.maxLength !== undefined && rules.minLength === rules.maxLength) {
      parts.push(`Length: ${rules.minLength} digits`);
    } else {
      if (rules.minLength !== undefined) parts.push(`Min: ${rules.minLength}`);
      if (rules.maxLength !== undefined) parts.push(`Max: ${rules.maxLength}`);
    }
    if (rules.pattern) {
      parts.push(`Pattern: /${rules.pattern}/`);
    }
    return <span className="text-gray-600 font-mono text-[10px]">{parts.join(' | ')}</span>;
  };

  return (
    <div className="space-y-6 bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">Dynamic Questionnaire Fields</h3>
          <p className="text-xs text-gray-500 mt-1">Fields partners must fill when placing an order for this service.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider self-start">
          <Lock size={12} className="text-amber-600" />
          <span>Phase 2 Read-Only</span>
        </div>
      </div>

      {/* Lock Notice Banner */}
      <div className="p-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">System Managed Parameters</span>
          <p className="mt-0.5 text-slate-500">
            Form field configurations are driven entirely by system seed data in Phase 2 to ensure database and schema consistency. Editing will be enabled for Super Admins in Phase 3.
          </p>
        </div>
      </div>

      {/* Fields List */}
      {sortedFields.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-400">
          No custom questionnaires configured. This service will request no data fields at checkout.
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-100 rounded-2xl">
          <table className="min-w-full divide-y divide-gray-100 text-left text-[11px]">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 w-16">Position</th>
                <th className="px-5 py-3">Label (Question)</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Required</th>
                <th className="px-5 py-3">Validation Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {sortedFields.map((field) => (
                <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-gray-400">{field.displayOrder}</td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="font-bold text-gray-800 text-xs">{field.label}</span>
                      {field.placeholder && (
                        <p className="text-[10px] text-gray-400 mt-0.5 font-normal">Hint: {field.placeholder}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-500">{field.fieldKey}</td>
                  <td className="px-5 py-3">
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold rounded text-[9px] uppercase">
                      {field.fieldType}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {field.isRequired ? (
                      <span className="text-red-500 font-bold">YES</span>
                    ) : (
                      <span className="text-gray-400 font-medium">OPTIONAL</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {formatValidationRules(field.validationRules)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ServiceFieldManager;
