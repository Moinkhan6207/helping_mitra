import React from 'react';
import { AdminServiceDocumentData } from '../types';
import { Lock, FileUp } from 'lucide-react';

interface ServiceDocumentManagerProps {
  serviceId: string;
  documents: AdminServiceDocumentData[];
}

const FILE_TYPE_OPTIONS = [
  { label: 'PDF (.pdf)', value: 'application/pdf' },
  { label: 'PNG (.png)', value: 'image/png' },
  { label: 'JPEG / JPG (.jpg, .jpeg)', value: 'image/jpeg' },
];

export const ServiceDocumentManager: React.FC<ServiceDocumentManagerProps> = ({ documents }) => {
  const sortedDocs = [...documents].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-6 bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">Required Documents Upload Checklist</h3>
          <p className="text-xs text-gray-500 mt-1">Configure documents partners must scan and upload to complete order placement.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider self-start">
          <Lock size={12} className="text-amber-600" />
          <span>Phase 2 Read-Only</span>
        </div>
      </div>

      {/* Lock Notice Banner */}
      <div className="p-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <FileUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">System Managed Parameters</span>
          <p className="mt-0.5 text-slate-500">
            Document requirement checklists are driven entirely by system seed data in Phase 2 to ensure database and schema consistency. Editing will be enabled for Super Admins in Phase 3.
          </p>
        </div>
      </div>

      {/* Documents List Grid */}
      {sortedDocs.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500 italic">
          No document required.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="min-w-full divide-y divide-gray-100 text-left text-[11px]">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 w-16">Position</th>
                <th className="px-5 py-3">Document Name</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Allowed Formats</th>
                <th className="px-5 py-3">Mandatory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {sortedDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-gray-400">{doc.displayOrder}</td>
                  <td className="px-5 py-3 font-bold text-gray-800 text-xs">{doc.documentName}</td>
                  <td className="px-5 py-3 font-mono text-gray-500">{doc.documentKey}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.allowedFileTypes.map((type) => {
                        const opt = FILE_TYPE_OPTIONS.find((o) => o.value === type);
                        return (
                          <span key={type} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold rounded text-[9px] uppercase">
                            {opt ? opt.label.split(' ')[0] : type}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {doc.isRequired ? (
                      <span className="text-red-500 font-bold">YES</span>
                    ) : (
                      <span className="text-gray-400 font-medium">OPTIONAL</span>
                    )}
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

export default ServiceDocumentManager;
