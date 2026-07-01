'use client';

import React, { useEffect, useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { 
  User, Contact, MapPin, Building, CreditCard, FileText, 
  Trash2, UploadCloud, Eye, RefreshCw, HelpCircle, CheckCircle2 
} from 'lucide-react';
import { lookupAoCode, aoCitiesDataset } from '../../utils/aoCodeHelper';

// ─── FORM SECTION CONTAINER ──────────────────────────────────────────────────
interface FormSectionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

export function FormSection({ id, title, description, icon, children, isActive = true }: FormSectionProps) {
  return (
    <div 
      id={id} 
      className={`scroll-mt-20 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-300 ${
        isActive ? 'ring-2 ring-blue-500/10 border-blue-200' : 'opacity-80'
      }`}
    >
      <div className="flex items-start gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

// ─── TEXT FIELD ──────────────────────────────────────────────────────────────
interface TextFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  colSpan?: string;
  disabled?: boolean;
  maxLength?: number;
  pattern?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TextField({
  label,
  name,
  register,
  error,
  placeholder,
  required = false,
  type = 'text',
  colSpan = 'md:col-span-1',
  disabled = false,
  maxLength,
  onChange
}: TextFieldProps) {
  const registerProps = register(name);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    registerProps.onChange(e);
    if (onChange) onChange(e);
  };

  return (
    <div className={`space-y-1.5 ${colSpan}`}>
      <label htmlFor={`field-${name}`} className="text-xs font-bold text-slate-700 tracking-wide block">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      <input
        type={type}
        id={`field-${name}`}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        disabled={disabled}
        maxLength={maxLength}
        {...registerProps}
        onChange={handleInputChange}
        className={`w-full bg-slate-50/50 border ${
          error ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
        } rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none focus:bg-white`}
      />
      {error && (
        <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── SELECT FIELD ────────────────────────────────────────────────────────────
interface SelectFieldProps {
  label: string;
  name: string;
  options: string[] | Array<{ label: string; value: string }>;
  register: UseFormRegister<any>;
  error?: string;
  placeholder?: string;
  required?: boolean;
  colSpan?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function SelectField({
  label,
  name,
  options,
  register,
  error,
  placeholder,
  required = false,
  colSpan = 'md:col-span-1',
  disabled = false,
  onChange
}: SelectFieldProps) {
  const registerProps = register(name);
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    registerProps.onChange(e);
    if (onChange) onChange(e);
  };

  return (
    <div className={`space-y-1.5 ${colSpan}`}>
      <label htmlFor={`field-${name}`} className="text-xs font-bold text-slate-700 tracking-wide block">
        {label} {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      <div className="relative">
        <select
          id={`field-${name}`}
          disabled={disabled}
          {...registerProps}
          onChange={handleSelectChange}
          className={`w-full bg-slate-50/50 border appearance-none ${
            error ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100/50'
          } rounded-2xl px-4 py-3.5 pr-10 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 outline-none cursor-pointer focus:bg-white`}
          defaultValue=""
        >
          <option value="" disabled className="text-slate-400">
            {placeholder ?? `Select ${label}`}
          </option>
          {options.map((opt, idx) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLbl = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={idx} value={optVal} className="text-slate-700 font-medium">
                {optLbl}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 font-bold tracking-wide flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}

// ─── ADDRESS SECTION ─────────────────────────────────────────────────────────
interface AddressSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  states: string[];
}

export function AddressSection({ register, errors, states }: AddressSectionProps) {
  return (
    <>
      <SelectField
        label="Address for Communication"
        name="communicationAddress"
        options={['Residence', 'Office']}
        register={register}
        error={errors.communicationAddress?.message as string}
        required
        colSpan="md:col-span-1"
      />
      <TextField
        label="Flat / Room / Door / Block No."
        name="flatDoorBlock"
        register={register}
        error={errors.flatDoorBlock?.message as string}
        required
        placeholder="Flat or Room Number"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Building / Village Name"
        name="buildingVillage"
        register={register}
        error={errors.buildingVillage?.message as string}
        required
        placeholder="Building or Village Name"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Road / Street / Lane / Post Office"
        name="roadStreetLane"
        register={register}
        error={errors.roadStreetLane?.message as string}
        required
        placeholder="Road, Street or Post Office"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Area / Locality / Taluka"
        name="areaLocality"
        register={register}
        error={errors.areaLocality?.message as string}
        required
        placeholder="Area or Sub-division"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Town / City / District"
        name="townCityDistrict"
        register={register}
        error={errors.townCityDistrict?.message as string}
        required
        placeholder="Town, City or District name"
        colSpan="md:col-span-1"
      />
      <SelectField
        label="State / Union Territory"
        name="state"
        options={states}
        register={register}
        error={errors.state?.message as string}
        required
        colSpan="md:col-span-1"
      />
      <TextField
        label="PIN Code"
        name="pinCode"
        register={register}
        error={errors.pinCode?.message as string}
        required
        maxLength={6}
        placeholder="6-digit PIN Code"
        colSpan="md:col-span-1"
      />
      <SelectField
        label="Country"
        name="country"
        options={['India']}
        register={register}
        error={errors.country?.message as string}
        required
        colSpan="md:col-span-1"
      />
    </>
  );
}

// ─── AO CODE SECTION ─────────────────────────────────────────────────────────
interface AOSectionProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  states: string[];
}

export function AOSection({ register, errors, setValue, watch, states }: AOSectionProps) {
  const selectedState = watch('aoState');
  const selectedCity = watch('aoCity');
  
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState && aoCitiesDataset[selectedState]) {
      setCities(Object.keys(aoCitiesDataset[selectedState]));
    } else {
      setCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedState && selectedCity) {
      const aoInfo = lookupAoCode(selectedState, selectedCity);
      if (aoInfo) {
        setValue('areaCode', aoInfo.areaCode, { shouldValidate: true });
        setValue('aoType', aoInfo.aoType, { shouldValidate: true });
        setValue('rangeCode', aoInfo.rangeCode, { shouldValidate: true });
        setValue('aoNumber', aoInfo.aoNumber, { shouldValidate: true });
        setValue('aoDesc', aoInfo.description, { shouldValidate: true });
      }
    }
  }, [selectedState, selectedCity, setValue]);

  return (
    <>
      <SelectField
        label="AO State"
        name="aoState"
        options={states}
        register={register}
        error={errors.aoState?.message as string}
        required
        colSpan="md:col-span-1"
      />
      <TextField
        label="AO City"
        name="aoCity"
        register={register}
        error={errors.aoCity?.message as string}
        required
        placeholder="Enter AO City"
        colSpan="md:col-span-1"
      />
      <TextField
        label="AO Description"
        name="aoDesc"
        register={register}
        error={errors.aoDesc?.message as string}
        placeholder="Auto-populated description"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Area Code"
        name="areaCode"
        register={register}
        error={errors.areaCode?.message as string}
        required
        placeholder="e.g. BPL"
        colSpan="md:col-span-1"
      />
      <TextField
        label="AO Type"
        name="aoType"
        register={register}
        error={errors.aoType?.message as string}
        required
        placeholder="e.g. W"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Range Code"
        name="rangeCode"
        register={register}
        error={errors.rangeCode?.message as string}
        required
        placeholder="e.g. 51"
        colSpan="md:col-span-1"
      />
      <TextField
        label="AO Number"
        name="aoNumber"
        register={register}
        error={errors.aoNumber?.message as string}
        required
        placeholder="e.g. 1"
        colSpan="md:col-span-1"
      />
      <TextField
        label="Additional Description"
        name="aoAddDesc"
        register={register}
        error={errors.aoAddDesc?.message as string}
        placeholder="e.g. WARD 1"
        colSpan="md:col-span-2"
      />
    </>
  );
}

// ─── PROOF SELECTOR ──────────────────────────────────────────────────────────
interface ProofSelectorProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  isCorrection: boolean;
}

export function ProofSelector({ register, errors, isCorrection }: ProofSelectorProps) {
  const identityOptions = [
    'Aadhaar Card',
    'Voter ID Card',
    'Passport',
    'Driving Licence'
  ];

  const addressOptions = [
    'Aadhaar Card',
    'Voter ID Card',
    'Passport',
    'Driving Licence',
    'Utility Bill'
  ];

  const dobOptions = [
    'Aadhaar Card',
    'Birth Certificate',
    'Matriculation Certificate',
    'Passport'
  ];

  return (
    <>
      <SelectField
        label="Proof of Identity"
        name="proofOfIdentity"
        options={identityOptions}
        register={register}
        error={errors.proofOfIdentity?.message as string}
        required
        colSpan="md:col-span-1"
      />
      <SelectField
        label="Proof of Address"
        name="proofOfAddress"
        options={addressOptions}
        register={register}
        error={errors.proofOfAddress?.message as string}
        required
        colSpan="md:col-span-1"
      />
      <SelectField
        label="Proof of DOB"
        name="proofOfDob"
        options={dobOptions}
        register={register}
        error={errors.proofOfDob?.message as string}
        required
        colSpan="md:col-span-1"
      />
    </>
  );
}

// ─── DOCUMENT UPLOADER ───────────────────────────────────────────────────────
interface DocumentUploaderProps {
  documentKey: string;
  label: string;
  isRequired: boolean;
  uploadState: {
    status: any;
    progress: number;
    metadata: any;
    error: string | null;
    previewUrl: string | null;
  };
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function DocumentUploader({
  documentKey,
  label,
  isRequired,
  uploadState,
  onUpload,
  onRemove
}: DocumentUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = () => {
    if (uploadState.status === 'success') return 'border-emerald-200 bg-emerald-50/20';
    if (uploadState.status === 'error') return 'border-rose-200 bg-rose-50/20';
    if (uploadState.status === 'uploading') return 'border-blue-200 bg-blue-50/10';
    return 'border-slate-200 bg-slate-50/30 hover:bg-slate-50/80';
  };

  return (
    <div className="space-y-1.5 md:col-span-1">
      <span className="text-xs font-bold text-slate-700 tracking-wide block">
        {label} {isRequired && <span className="text-red-500 font-bold">*</span>}
      </span>
      
      <div className={`relative border border-dashed rounded-2xl p-4 transition-all duration-200 flex flex-col items-center text-center justify-center min-h-[140px] ${getStatusColor()}`}>
        {/* Hidden Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />

        {uploadState.status === 'success' && uploadState.metadata ? (
          <div className="w-full space-y-3">
            {/* File Info */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-100 text-left">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-700 truncate">{uploadState.metadata.fileName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{(uploadState.metadata.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center gap-1.5">
                {uploadState.previewUrl && (
                  <a 
                    href={uploadState.previewUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                  </a>
                )}
                <button 
                  type="button" 
                  onClick={onRemove}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-black uppercase tracking-wider">
              <CheckCircle2 size={12} />
              <span>Upload Complete</span>
            </div>
          </div>
        ) : uploadState.status === 'uploading' ? (
          <div className="w-full space-y-3">
            <div className="flex flex-col items-center">
              <RefreshCw size={24} className="animate-spin text-blue-500 mb-2" />
              <span className="text-xs font-bold text-slate-600">Uploading File...</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-1.5 transition-all duration-300" 
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{uploadState.progress}% loaded</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={triggerUpload}
            className="flex flex-col items-center group cursor-pointer focus:outline-none w-full h-full py-4 justify-center"
          >
            <div className="p-3 bg-slate-100 text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-50 rounded-2xl transition-all duration-200 mb-2">
              <UploadCloud size={20} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Choose File or Drag here</span>
            <span className="text-[9px] text-slate-400 font-medium mt-1">PDF, JPG, JPEG, PNG (Max 2MB)</span>
          </button>
        )}

        {uploadState.status === 'error' && (
          <div className="mt-3 text-left">
            <p className="text-[10px] text-red-500 font-bold leading-normal">
              ⚠️ {uploadState.error || 'Upload failed. Please try again.'}
            </p>
            <button 
              type="button" 
              onClick={triggerUpload} 
              className="mt-1 text-[10px] font-black text-blue-600 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
