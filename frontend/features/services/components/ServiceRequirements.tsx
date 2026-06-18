import React from 'react';
import { FormInput, HelpCircle } from 'lucide-react';
import { ServiceFieldData } from '../types';

interface ServiceRequirementsProps {
  fields: ServiceFieldData[];
}

export const ServiceRequirements: React.FC<ServiceRequirementsProps> = ({ fields }) => {
  if (!fields || fields.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <FormInput className="h-5 w-5 mr-2 text-primary-blue" />
          Required Information
        </h2>
        <p className="text-sm text-slate-500 italic">No specific form fields are required for this service.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <FormInput className="h-5 w-5 mr-2 text-primary-blue" />
        Required Information
      </h2>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                {field.isRequired ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </div>
              {field.placeholder && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Hint:</span> {field.placeholder}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 sm:mt-0 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                Type: {field.fieldType}
              </span>
              {field.validationRules && Object.keys(field.validationRules).length > 0 && (
                <div className="relative group cursor-pointer">
                  <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 transition-colors" />
                  {/* Tooltip */}
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] rounded-lg p-2.5 shadow-lg z-10">
                    <span className="block font-bold mb-1 border-b border-slate-700 pb-0.5">Validation Rules</span>
                    {Object.entries(field.validationRules).map(([key, val]) => (
                      <span key={key} className="block">
                        • {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
