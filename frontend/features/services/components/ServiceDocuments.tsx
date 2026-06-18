import React from 'react';
import { UploadCloud, FileType } from 'lucide-react';
import { ServiceDocumentData } from '../types';

interface ServiceDocumentsProps {
  documents: ServiceDocumentData[];
}

export const ServiceDocuments: React.FC<ServiceDocumentsProps> = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <UploadCloud className="h-5 w-5 mr-2 text-primary-blue" />
          Required Documents
        </h2>
        <p className="text-sm text-slate-500 italic">No document required.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <UploadCloud className="h-5 w-5 mr-2 text-primary-blue" />
        Required Documents
      </h2>
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{doc.documentName}</span>
                {doc.isRequired ? (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                    Required
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    Optional
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <FileType className="h-4 w-4 text-slate-400" />
              <div className="flex flex-wrap gap-1">
                {doc.allowedFileTypes.map((type) => (
                  <span
                    key={type}
                    className="text-[10px] font-extrabold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded uppercase"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
