'use client';

import React, { useRef } from 'react';
import { FileText, X, Printer, CheckCircle2 } from 'lucide-react';

interface GovtForm49APreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // form fields values
  isCorrection: boolean;
  uploads: Record<string, any>; // uploaded documents URLs or storagePaths
  onSubmit: () => void;
  isSubmitting: boolean;
  previewUrl?: string;
}

export default function GovtForm49APreview({
  isOpen,
  onClose,
  data,
  isCorrection,
  uploads,
  onSubmit,
  isSubmitting,
  previewUrl
}: GovtForm49APreviewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (previewUrl) {
      const printWindow = window.open(previewUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
      return;
    }
    const printContent = printAreaRef.current?.innerHTML;
    
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>NSDL Form 49A Preview</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                body { font-family: monospace; padding: 20px; }
                .box-grid { display: grid; grid-template-columns: repeat(30, 20px); gap: 1px; }
                .box-cell { width: 20px; height: 20px; border: 1px solid #000; text-align: center; font-size: 11px; line-height: 18px; text-transform: uppercase; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Helper to split a string into individual character box grids
  const renderCharBoxes = (text: string = '', length: number = 30) => {
    const cleanText = (text || '').toUpperCase().slice(0, length);
    const cells = [];
    for (let i = 0; i < length; i++) {
      cells.push(cleanText[i] || '');
    }
    return (
      <div className="flex flex-wrap gap-[1px]">
        {cells.map((char, idx) => (
          <div key={idx} className="w-[18px] h-[18px] border border-slate-400 bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-800 font-mono">
            {char}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header toolbar */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white select-none">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-400" size={20} />
            <div>
              <h2 className="text-sm font-extrabold tracking-wide uppercase">
                {isCorrection ? 'NSDL PAN Correction Form Preview' : 'NSDL Form 49A Government Form'}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please review entered details before government portal dispatch.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} />
              <span>Print Draft</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Paper Container (Scrollable) */}
        {previewUrl ? (
          <div className="flex-1 p-4 bg-slate-800 flex items-center justify-center min-h-[500px]">
            <iframe 
              src={previewUrl} 
              className="w-full h-full min-h-[65vh] rounded-2xl border-none shadow-lg bg-slate-900"
              title="NSDL Application Form Preview"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-100/50">
            <div 
              ref={printAreaRef}
              className="w-full max-w-3xl mx-auto bg-white border border-slate-300 shadow-lg p-8 space-y-6 text-left select-text relative"
              style={{ minHeight: '1000px' }}
            >
              {/* Watermark/Mock Background */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[90px] font-black text-slate-100/30 uppercase tracking-widest select-none pointer-events-none -rotate-45">
                HELPING MITRA
              </div>

              {/* Official Header */}
              <div className="border-2 border-slate-900 p-4 text-center space-y-1">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">
                  {isCorrection 
                    ? 'Request for New PAN Card Or/And Changes or Correction in PAN Data' 
                    : 'Form No. 49A'}
                </h1>
                <p className="text-[9px] text-slate-600 font-bold uppercase">
                  {isCorrection 
                    ? 'Under Section 139A of the Income Tax Act, 1961' 
                    : 'Application for Allotment of Permanent Account Number (Only for Indian Citizens)'}
                </p>
              </div>

              {/* Assessing Officer (AO Code) Grid */}
              <div className="border border-slate-900 p-3 bg-slate-50/50">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block mb-2">Assessing Officer (AO Code)</span>
                <div className="grid grid-cols-4 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-700 block">Area Code</span>
                    <div className="w-fit">{renderCharBoxes(data.areaCode, 4)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-700 block">AO Type</span>
                    <div className="w-fit">{renderCharBoxes(data.aoType, 3)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-700 block">Range Code</span>
                    <div className="w-fit">{renderCharBoxes(data.rangeCode, 4)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-700 block">AO Number</span>
                    <div className="w-fit">{renderCharBoxes(data.aoNumber, 3)}</div>
                  </div>
                </div>
              </div>

              {/* Photos & Signatures Box */}
              <div className="flex justify-between items-start gap-6 pt-4">
                {/* Left Photo & Across Signature Box */}
                <div className="border border-slate-300 w-[140px] h-[160px] flex flex-col items-center justify-center text-center p-2 relative bg-slate-50/20">
                  {uploads.passportPhoto?.previewUrl ? (
                    <img src={uploads.passportPhoto.previewUrl} alt="Applicant" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">PASTE RECENT PHOTO HERE</span>
                  )}
                  {/* Diagonal Signature Line representing signature across photo */}
                  <div className="absolute inset-x-0 bottom-4 border-b border-dashed border-red-500/80 -rotate-12 bg-white/70 py-1 text-[9px] text-red-600 font-black text-center select-none shadow-sm">
                    Signature Across Photo
                  </div>
                </div>

                {/* Right Signature Box for actual thumb/sign */}
                <div className="border border-slate-300 w-[200px] h-[75px] self-end flex flex-col items-center justify-center p-1 relative bg-slate-50/20">
                  {uploads.signature?.previewUrl ? (
                    <img src={uploads.signature.previewUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-[9px] font-extrabold text-slate-400">SIGNATURE / THUMB IMPRESSION</span>
                  )}
                  <div className="absolute bottom-0 right-0 left-0 border-t border-slate-300 text-[8px] font-bold text-slate-500 text-center py-0.5 select-none bg-slate-50">
                    Signature / Left Thumb
                  </div>
                </div>

                {/* Right Photo Box */}
                <div className="border border-slate-300 w-[140px] h-[160px] flex flex-col items-center justify-center text-center p-2 bg-slate-50/20">
                  {uploads.passportPhoto?.previewUrl ? (
                    <img src={uploads.passportPhoto.previewUrl} alt="Applicant" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">PASTE RECENT PHOTO HERE</span>
                  )}
                </div>
              </div>

              {/* Core Form Data Sections */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                
                {/* PAN Number for Correction only */}
                {isCorrection && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase block">1. Permanent Account Number (PAN)</span>
                    {renderCharBoxes(data.panNumber, 10)}
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-800 uppercase block">
                    {isCorrection ? '2. Full Name of Applicant' : '1. Full Name (LastName, FirstName, MiddleName)'}
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Last Name / Surname</span>
                      {renderCharBoxes(data.lastName, 20)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">First Name</span>
                      {renderCharBoxes(data.firstName, 20)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Middle Name</span>
                      {renderCharBoxes(data.middleName, 20)}
                    </div>
                  </div>
                </div>

                {/* Name to Print */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-800 uppercase block">Name to be printed on PAN card</span>
                  {renderCharBoxes(data.cardNamePrint, 35)}
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase block">Date Of Birth / Incorporation</span>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold border border-slate-200 p-2 bg-slate-50 w-fit rounded-lg">
                      <span>📅</span>
                      <span>{data.dob}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase block">Gender</span>
                    <div className="flex items-center gap-4 text-xs font-extrabold mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={data.gender === 'Male'} disabled className="accent-slate-850" />
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={data.gender === 'Female'} disabled className="accent-slate-850" />
                        <span>Female</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={data.gender === 'Transgender'} disabled className="accent-slate-850" />
                        <span>Transgender</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Parents details */}
                <div className="border border-slate-200 p-4 space-y-3 bg-slate-50/20 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-800 uppercase block">Father's Name & Mother's Name</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Father Last Name</span>
                      {renderCharBoxes(data.fatherLastName, 15)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Father First Name</span>
                      {renderCharBoxes(data.fatherFirstName, 15)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Father Middle Name</span>
                      {renderCharBoxes(data.fatherMiddleName, 15)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Mother Last Name</span>
                      {renderCharBoxes(data.motherLastName, 15)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Mother First Name</span>
                      {renderCharBoxes(data.motherFirstName, 15)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold">Mother Middle Name</span>
                      {renderCharBoxes(data.motherMiddleName, 15)}
                    </div>
                  </div>
                </div>

                {/* Aadhaar details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase block">Aadhaar Number (12 Digit)</span>
                    {renderCharBoxes(data.aadhaarNumber, 12)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase block">Name as per Aadhaar</span>
                    {renderCharBoxes(data.aadhaarName, 25)}
                  </div>
                </div>

                {/* Address details */}
                <div className="border border-slate-200 p-4 space-y-2.5 bg-slate-50/20 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-800 uppercase block">Address for Communication</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div>Flat/Door/Block: <span className="font-mono text-slate-800 ml-1">{data.flatDoorBlock}</span></div>
                    <div>Building/Village: <span className="font-mono text-slate-800 ml-1">{data.buildingVillage}</span></div>
                    <div>Road/Street: <span className="font-mono text-slate-800 ml-1">{data.roadStreetLane}</span></div>
                    <div>Area/Locality: <span className="font-mono text-slate-800 ml-1">{data.areaLocality}</span></div>
                    <div>Town/City: <span className="font-mono text-slate-800 ml-1">{data.townCityDistrict}</span></div>
                    <div>State/UT: <span className="font-mono text-slate-800 ml-1">{data.state}</span></div>
                    <div>PIN Code: <span className="font-mono text-slate-800 ml-1">{data.pinCode}</span></div>
                    <div>Country: <span className="font-mono text-slate-800 ml-1">{data.country || 'India'}</span></div>
                  </div>
                </div>

                {/* Proof list */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px]">
                    <span className="font-black text-slate-500 uppercase tracking-wider block">ID Proof</span>
                    <span className="font-extrabold text-slate-850 mt-0.5 block">{data.proofOfIdentity}</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="font-black text-slate-500 uppercase tracking-wider block">Address Proof</span>
                    <span className="font-extrabold text-slate-850 mt-0.5 block">{data.proofOfAddress}</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="font-black text-slate-500 uppercase tracking-wider block">DOB Proof</span>
                    <span className="font-extrabold text-slate-850 mt-0.5 block">{data.proofOfDob}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer toolbar */}
        <div className="border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Ready for submission. Digital copy generated automatically.</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 border border-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs hover:bg-slate-100 transition-colors uppercase tracking-wider"
              disabled={isSubmitting}
            >
              Close & Edit
            </button>
            <button
              onClick={onSubmit}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-blue-500/20 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Submit Order</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
