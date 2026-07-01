'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Loader2, AlertCircle, Wallet, FileText, 
  CheckCircle2, ArrowRight, ShieldCheck, Save, 
  HelpCircle, Undo, Layers, CheckSquare,
  User, Contact, MapPin, Building, CreditCard
} from 'lucide-react';
import { useUpload } from '@/features/uploads';
import { useWalletBalance, useInvalidateWalletBalance } from '@/features/wallet/useWalletBalance';
import { useAuthStore } from '@/features/auth/authStore';
import { useOrderSubmit } from '@/features/services/hooks/useOrderSubmit';
import { serviceApi } from '@/features/services/api/service.api';
import { 
  FormSection, TextField, SelectField, AddressSection, 
  AOSection, DocumentUploader, ProofSelector 
} from './pan-form/PanFormComponents';
import GovtForm49APreview from './pan-form/GovtForm49APreview';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

interface PanServiceApplyClientProps {
  serviceSlug: string;
  service: any;
  walletBalance: number;
  user: any;
}

export default function PanServiceApplyClient({
  serviceSlug,
  service,
  walletBalance,
  user
}: PanServiceApplyClientProps) {
  const router = useRouter();
  const invalidateWalletBalance = useInvalidateWalletBalance();

  const isCorrection = serviceSlug === 'pan-correction';
  const draftKey = `helping-mitra-pan-draft-${serviceSlug}`;

  const [activeSectionId, setActiveSectionId] = useState('section-personal-info');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isServerValidating, setIsServerValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validatedData, setValidatedData] = useState<any | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<any | null>(null);

  // ─── 1. BUILD CLIENT-SIDE VALIDATION SCHEMAS ────────────────────────────────
  const panFormSchema = useMemo(() => {
    const baseSchema = {
      applicantCategory: z.string().min(1, { message: 'Category of Applicant is required' }),
      lastName: z.string().min(1, { message: 'Last Name / Surname is required' }),
      firstName: z.string().optional().or(z.literal('')),
      middleName: z.string().optional().or(z.literal('')),
      panCardName: z.string().min(1, { message: 'Full Name as per Aadhaar is required' }),
      dob: z.string().min(1, { message: 'Date of Birth is required' }),
      gender: z.enum(['Male', 'Female', 'Transgender'], { message: 'Please select a gender' }),
      singleParent: z.enum(['Yes', 'No'], { message: 'Single parent check is required' }),
      cardNamePrint: z.string().min(1, { message: 'Name to print on PAN is required' }),
      fatherFirstName: z.string().optional().or(z.literal('')),
      fatherMiddleName: z.string().optional().or(z.literal('')),
      fatherLastName: z.string().optional().or(z.literal('')),
      motherFirstName: z.string().optional().or(z.literal('')),
      motherMiddleName: z.string().optional().or(z.literal('')),
      motherLastName: z.string().optional().or(z.literal('')),
      
      aadhaarNumber: z.string().regex(/^[0-9]{12}$/, { message: 'Aadhaar must be exactly 12 digits' }),
      aadhaarName: z.string().min(1, { message: 'Name as per Aadhaar is required' }),
      
      mobileNumber: z.string().regex(/^[0-9]{10}$/, { message: 'Mobile number must be exactly 10 digits' }),
      emailId: z.string().email({ message: 'Please enter a valid email address' }),
      
      communicationAddress: z.enum(['Residence', 'Office'], { message: 'Please select communication address' }),
      flatDoorBlock: z.string().min(1, { message: 'Flat/Door/Block is required' }),
      buildingVillage: z.string().min(1, { message: 'Building/Village Name is required' }),
      roadStreetLane: z.string().min(1, { message: 'Road/Street is required' }),
      areaLocality: z.string().min(1, { message: 'Area/Locality is required' }),
      townCityDistrict: z.string().min(1, { message: 'Town/City/District is required' }),
      state: z.string().min(1, { message: 'State is required' }),
      pinCode: z.string().regex(/^[0-9]{6}$/, { message: 'PIN Code must be exactly 6 digits' }),
      country: z.string().default('India'),
      
      aoState: z.string().min(1, { message: 'AO State is required' }),
      aoCity: z.string().min(1, { message: 'AO City is required' }),
      aoDesc: z.string().optional().or(z.literal('')),
      aoAddDesc: z.string().optional().or(z.literal('')),
      areaCode: z.string().min(1, { message: 'Area Code is required' }),
      aoType: z.string().min(1, { message: 'AO Type is required' }),
      rangeCode: z.string().min(1, { message: 'Range Code is required' }),
      aoNumber: z.string().min(1, { message: 'AO Number is required' }),
      
      residentialStatus: z.string().min(1, { message: 'Residential Status is required' }),
      sourceOfIncome: z.string().min(1, { message: 'Source of Income is required' }),
      
      proofOfIdentity: z.string().min(1, { message: 'Proof of Identity is required' }),
      proofOfAddress: z.string().min(1, { message: 'Proof of Address is required' }),
      proofOfDob: z.string().min(1, { message: 'Proof of DOB is required' })
    };

    if (isCorrection) {
      return z.object({
        ...baseSchema,
        panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN Number format (e.g. ABCDE1234F)' }),
        fieldsToUpdate: z.string().min(1, { message: 'Select at least one field to correct' }),
        existingPanDetails: z.string().optional().or(z.literal('')),
        correctionReason: z.string().optional().or(z.literal('')),
        documentSupport: z.string().optional().or(z.literal(''))
      });
    }

    return z.object(baseSchema);
  }, [isCorrection]);

  // ─── 2. REACT HOOK FORM INITIALIZATION ──────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
    reset
  } = useForm({
    resolver: zodResolver(panFormSchema),
    mode: 'onTouched',
    defaultValues: {
      applicantCategory: 'Individual',
      country: 'India',
      communicationAddress: 'Residence',
      residentialStatus: 'Resident',
      sourceOfIncome: 'No Income',
      state: 'Madhya Pradesh',
      aoState: 'Madhya Pradesh',
      singleParent: 'No',
      fieldsToUpdate: '',
      existingPanDetails: '',
      correctionReason: '',
      documentSupport: ''
    } as any
  });

  const formValues = watch();

  // ─── 3. AUTO SAVE & LOAD DRAFT ──────────────────────────────────────────────
  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Reset form values with saved draft
        reset(parsed);
        setIsDraftLoaded(true);
      } catch (err) {
        console.error('Failed to parse draft from localStorage:', err);
      }
    }
  }, [draftKey, reset]);

  // Save draft whenever form values change
  useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      localStorage.setItem(draftKey, JSON.stringify(formValues));
    }
  }, [formValues, draftKey]);

  const handleResetDraft = () => {
    localStorage.removeItem(draftKey);
    reset({
      applicantCategory: 'Individual',
      country: 'India',
      communicationAddress: 'Residence',
      residentialStatus: 'Resident',
      sourceOfIncome: 'No Income',
      state: 'Madhya Pradesh',
      aoState: 'Madhya Pradesh',
      singleParent: 'No',
      fieldsToUpdate: '',
      existingPanDetails: '',
      correctionReason: '',
      documentSupport: ''
    } as any);
    setIsDraftLoaded(false);
  };

  // ─── 4. CALCULATE COMPLETION PROGRESS ──────────────────────────────────────
  const completionPercentage = useMemo(() => {
    const fieldsToTrack = [
      'lastName', 'panCardName', 'dob', 'gender', 'singleParent', 'cardNamePrint',
      'aadhaarNumber', 'aadhaarName', 'mobileNumber', 'emailId',
      'communicationAddress', 'flatDoorBlock', 'buildingVillage', 'roadStreetLane',
      'areaLocality', 'townCityDistrict', 'state', 'pinCode',
      'aoState', 'aoCity', 'areaCode', 'aoType', 'rangeCode', 'aoNumber',
      'residentialStatus', 'sourceOfIncome', 'proofOfIdentity', 'proofOfAddress', 'proofOfDob'
    ];
    if (isCorrection) {
      fieldsToTrack.push('panNumber', 'fieldsToUpdate');
    }

    let completedCount = 0;
    fieldsToTrack.forEach(f => {
      const val = formValues[f];
      if (val && String(val).trim() !== '') {
        completedCount++;
      }
    });

    return Math.round((completedCount / fieldsToTrack.length) * 100);
  }, [formValues, isCorrection]);

  // ─── 5. UPLOAD HOOKS SETUP ──────────────────────────────────────────────────
  const documentRequirements = useMemo(() => {
    const baseDocs = [
      { documentKey: 'passportPhoto', label: 'Passport Size Photo', isRequired: true },
      { documentKey: 'signature', label: 'Signature', isRequired: true },
      { documentKey: 'thumbImpression', label: 'Thumb Impression', isRequired: false },
      { documentKey: 'aadhaarFront', label: 'Aadhaar Card Front', isRequired: true },
      { documentKey: 'aadhaarBack', label: 'Aadhaar Card Back', isRequired: true },
      { documentKey: 'birthProof', label: 'Birth Proof', isRequired: true },
      { documentKey: 'addressProof', label: 'Address Proof', isRequired: true },
      { documentKey: 'supportingDocuments', label: 'Supporting Documents', isRequired: false }
    ];

    if (isCorrection) {
      baseDocs.push({ documentKey: 'existingPanCard', label: 'Existing PAN Card Copy', isRequired: true });
    }
    return baseDocs;
  }, [isCorrection]);

  const docKeys = useMemo(() => documentRequirements.map(d => d.documentKey), [documentRequirements]);
  const requiredDocKeys = useMemo(() => documentRequirements.filter(d => d.isRequired).map(d => d.documentKey), [documentRequirements]);

  const {
    uploadStates,
    uploadFile,
    removeFile,
    getMetadataMap,
    allRequiredUploaded
  } = useUpload(docKeys, user?.id || '');

  const uploadedDocsMap = getMetadataMap();
  const areAllDocsUploaded = allRequiredUploaded(requiredDocKeys);
  const isBalanceSufficient = walletBalance >= service.mrp;

  // ─── 6. ORDER SUBMISSION MUTATION ───────────────────────────────────────────
  const {
    submit: submitOrder,
    isSubmitting: isSubmittingOrder,
    submitError,
    clearError: clearSubmitError
  } = useOrderSubmit({
    serviceId: service.id,
    serviceName: service.name,
    amount: service.mrp
  });

  // ─── 7. HANDLE CLIENT/SERVER FORM VALIDATION ────────────────────────────────
  const handleValidateForm = async (formData: any) => {
    setLocalError(null);
    clearSubmitError();
    setIsServerValidating(true);

    try {
      // 1. Prepare backend payload structure
      const payload: Record<string, any> = { ...formData };
      
      // Parse numbers where appropriate
      if (payload.pinCode) payload.pinCode = payload.pinCode.trim();
      
      // Merge upload metadata
      payload.uploads = uploadedDocsMap;
      payload.userId = user?.id;

      // 2. Validate on backend API
      const response = await serviceApi.validateForm(serviceSlug, payload);

      if (response && response.isValid === false) {
        const errorMsg = response.errors?.[0]?.message || 'Server validation failed.';
        setLocalError(errorMsg);
        setIsServerValidating(false);
        return;
      }

      // 3. Store valid data and show high-fidelity preview modal
      setValidatedData(formData);
      setGeneratedPdf(response.generatedPdf);
      setShowPreview(true);

    } catch (err: any) {
      console.error('Form validation failed:', err);
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors) && apiErrors.length > 0) {
        setLocalError(`Server validation: ${apiErrors[0].message}`);
      } else {
        setLocalError(err?.response?.data?.message || err.message || 'Validation failed. Please review values.');
      }
    } finally {
      setIsServerValidating(false);
    }
  };

  const handleValidationError = (formErrors: any) => {
    setLocalError('Please fill all required fields correctly. Check the highlighted inputs.');
    
    // Smooth scroll to the first invalid field
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      const errorElement = document.getElementById(`field-${firstErrorKey}`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus({ preventScroll: true });
      }
    }
  };

  // ─── 8. FINAL ORDER CREATION SUBMISSION ─────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!validatedData) return;
    setLocalError(null);

    // Enforce balance and document constraints
    if (!isBalanceSufficient) {
      setLocalError('Insufficient wallet balance. Please add money.');
      setShowPreview(false);
      return;
    }
    if (!areAllDocsUploaded) {
      setLocalError('Required documents are missing. Please upload Aadhaar cards and photos.');
      setShowPreview(false);
      return;
    }

    try {
      // Compile fieldValues matching backend schema
      const fieldValues = Object.entries(validatedData).map(([key, val]) => {
        return {
          fieldKey: key,
          fieldLabel: key, // Label resolved correctly on backend side
          value: String(val)
        };
      });

      // Compile documents payload
      const documentsPayload = Object.values(uploadedDocsMap)
        .filter(Boolean)
        .map((d: any) => {
          const docDef = documentRequirements.find(req => req.documentKey === d.documentKey);
          return {
            ...d,
            documentLabel: docDef?.label ?? d.documentKey
          };
        });

      const result = await submitOrder({
        fieldValues,
        documents: documentsPayload,
        consentGiven: true,
        generatedPdf: generatedPdf ? {
          fileName: generatedPdf.fileName,
          storagePath: generatedPdf.storagePath,
          fileSize: generatedPdf.fileSize,
          fileType: generatedPdf.fileType
        } : null
      } as any);

      // Clear draft on successful order
      localStorage.removeItem(draftKey);
      invalidateWalletBalance();
      router.push(`/dashboard/orders/success?orderId=${result.orderId}`);

    } catch (err: any) {
      console.error('Final order creation failed:', err);
      setLocalError(err?.response?.data?.message || err.message || 'Order submission failed.');
      setShowPreview(false);
    }
  };

  const sectionsList = [
    { id: 'section-personal-info', label: 'Personal Information' },
    { id: 'section-aadhaar-details', label: 'Aadhaar Details' },
    { id: 'section-contact-info', label: 'Contact Details' },
    { id: 'section-address-details', label: 'Address details' },
    { id: 'section-ao-code', label: 'AO Code Details' },
    { id: 'section-other-details', label: 'Other Details' },
    { id: 'section-proof-selection', label: 'Proof Selection' },
    { id: 'section-doc-upload', label: 'Document Upload' },
    { id: 'section-summary', label: 'Pricing & Summary' }
  ];

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);

  const displayError = localError || submitError;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left relative pb-20">
      
      {/* ─── STICKY HEADER & PROGRESS ────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 py-4 -mx-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{isCorrection ? 'PAN Card Correction / Update' : 'New PAN Card Application'}</span>
              <span className="text-[10px] font-black px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md uppercase tracking-wider">NSDL Portal</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Enterprise digital service with eKYC/eSign foundation</p>
          </div>
        </div>

        {/* Progress & Draft Action */}
        <div className="flex items-center gap-4">
          {/* Progress pill */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-4 py-2 rounded-2xl shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progress</span>
            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${completionPercentage}%` }} />
            </div>
            <span className="text-xs font-black text-blue-600">{completionPercentage}%</span>
          </div>

          {/* Local draft indicator */}
          {isDraftLoaded && (
            <button
              onClick={handleResetDraft}
              className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-100/60 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Undo size={14} />
              <span>Reset Draft</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── TWO COLUMN LAYOUT ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Sticky Section Selector Navigation (Left Sidebar) */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-3.5 hidden md:block">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers size={16} className="text-slate-400" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Application Sections</span>
            </div>
            
            <nav className="flex flex-col gap-1 text-left">
              {sectionsList.map((section) => {
                const isActive = activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Form Content Cards (Middle/Right columns) */}
        <form 
          id="pan-application-form" 
          onSubmit={handleSubmit(handleValidateForm, handleValidationError)}
          className="lg:col-span-3 space-y-8"
        >
          {/* SECTION 1: PERSONAL INFORMATION */}
          <FormSection
            id="section-personal-info"
            title="Personal Information"
            description="Enter candidate name, parent details, and name printed preference."
            icon={<User size={20} />}
            isActive={activeSectionId === 'section-personal-info'}
          >
            <SelectField
              label="Applicant Category"
              name="applicantCategory"
              options={['Individual']}
              register={register}
              error={errors.applicantCategory?.message as string}
              required
            />
            {isCorrection && (
              <TextField
                label="Existing PAN Number"
                name="panNumber"
                register={register}
                error={errors.panNumber?.message as string}
                required
                placeholder="Enter 10-char PAN (e.g. ABCDE1234F)"
                maxLength={10}
              />
            )}
            <TextField
              label="Last Name / Surname"
              name="lastName"
              register={register}
              error={errors.lastName?.message as string}
              required
              placeholder="LastName / Surname"
            />
            <TextField
              label="First Name"
              name="firstName"
              register={register}
              error={errors.firstName?.message as string}
              placeholder="First Name"
            />
            <TextField
              label="Middle Name"
              name="middleName"
              register={register}
              error={errors.middleName?.message as string}
              placeholder="Middle Name"
            />
            <TextField
              label="Full Name as per Aadhaar"
              name="panCardName"
              register={register}
              error={errors.panCardName?.message as string}
              required
              placeholder="Name as per Aadhaar"
              colSpan="md:col-span-2"
            />
            <TextField
              label="Date Of Birth / Incorporation"
              name="dob"
              type="date"
              register={register}
              error={errors.dob?.message as string}
              required
            />
            <SelectField
              label="Gender"
              name="gender"
              options={['Male', 'Female', 'Transgender']}
              register={register}
              error={errors.gender?.message as string}
              required
            />
            <SelectField
              label="Single Parent?"
              name="singleParent"
              options={['No', 'Yes']}
              register={register}
              error={errors.singleParent?.message as string}
              required
            />
            <TextField
              label="Name to be Printed on PAN Card"
              name="cardNamePrint"
              register={register}
              error={errors.cardNamePrint?.message as string}
              required
              placeholder="Print name on card"
              colSpan="md:col-span-2"
            />
            
            {/* Father Details */}
            <TextField
              label="Father First Name"
              name="fatherFirstName"
              register={register}
              error={errors.fatherFirstName?.message as string}
              placeholder="Father First Name"
            />
            <TextField
              label="Father Middle Name"
              name="fatherMiddleName"
              register={register}
              error={errors.fatherMiddleName?.message as string}
              placeholder="Father Middle Name"
            />
            <TextField
              label="Father Last Name"
              name="fatherLastName"
              register={register}
              error={errors.fatherLastName?.message as string}
              placeholder="Father Last Name"
            />

            {/* Mother Details */}
            <TextField
              label="Mother First Name"
              name="motherFirstName"
              register={register}
              error={errors.motherFirstName?.message as string}
              placeholder="Mother First Name"
            />
            <TextField
              label="Mother Middle Name"
              name="motherMiddleName"
              register={register}
              error={errors.motherMiddleName?.message as string}
              placeholder="Mother Middle Name"
            />
            <TextField
              label="Mother Last Name"
              name="motherLastName"
              register={register}
              error={errors.motherLastName?.message as string}
              placeholder="Mother Last Name"
            />

            {isCorrection && (
              <>
                <TextField
                  label="Correction Checkboxes (Fields to Update)"
                  name="fieldsToUpdate"
                  register={register}
                  error={errors.fieldsToUpdate?.message as string}
                  required
                  placeholder="e.g. Name, DOB, Photo, Address"
                  colSpan="md:col-span-3"
                />
                <TextField
                  label="Existing PAN Details"
                  name="existingPanDetails"
                  register={register}
                  error={errors.existingPanDetails?.message as string}
                  placeholder="Explain existing details"
                  colSpan="md:col-span-3"
                />
                <TextField
                  label="Correction Reason"
                  name="correctionReason"
                  register={register}
                  error={errors.correctionReason?.message as string}
                  placeholder="Reason for correction"
                  colSpan="md:col-span-3"
                />
                <TextField
                  label="Document Support Remarks"
                  name="documentSupport"
                  register={register}
                  error={errors.documentSupport?.message as string}
                  placeholder="e.g. Marriage cert, gazette copy"
                  colSpan="md:col-span-3"
                />
              </>
            )}
          </FormSection>

          {/* SECTION 2: AADHAAR DETAILS */}
          <FormSection
            id="section-aadhaar-details"
            title="Aadhaar Details"
            description="Capture candidate Aadhaar parameters. Verification API future ready."
            icon={<Contact size={20} />}
            isActive={activeSectionId === 'section-aadhaar-details'}
          >
            <TextField
              label="Aadhaar Number"
              name="aadhaarNumber"
              register={register}
              error={errors.aadhaarNumber?.message as string}
              required
              maxLength={12}
              placeholder="Enter 12 Digit Aadhaar Number"
            />
            <TextField
              label="Name as per Aadhaar"
              name="aadhaarName"
              register={register}
              error={errors.aadhaarName?.message as string}
              required
              placeholder="Name exactly as printed on Aadhaar"
              colSpan="md:col-span-2"
            />
          </FormSection>

          {/* SECTION 3: CONTACT INFORMATION */}
          <FormSection
            id="section-contact-info"
            title="Contact Details"
            description="Active email and phone number for dispatch and OTP."
            icon={<Contact size={20} />}
            isActive={activeSectionId === 'section-contact-info'}
          >
            <TextField
              label="Mobile Number"
              name="mobileNumber"
              register={register}
              error={errors.mobileNumber?.message as string}
              required
              maxLength={10}
              placeholder="10-digit Mobile Number"
            />
            <TextField
              label="Email Address"
              name="emailId"
              register={register}
              error={errors.emailId?.message as string}
              required
              placeholder="Email address for e-PAN delivery"
              colSpan="md:col-span-2"
            />
          </FormSection>

          {/* SECTION 4: ADDRESS DETAILS */}
          <FormSection
            id="section-address-details"
            title="Address for Communication"
            description="Postal dispatch destination details."
            icon={<MapPin size={20} />}
            isActive={activeSectionId === 'section-address-details'}
          >
            <AddressSection 
              register={register} 
              errors={errors} 
              states={INDIAN_STATES} 
            />
          </FormSection>

          {/* SECTION 5: AO CODE */}
          <FormSection
            id="section-ao-code"
            title="AO Code Details"
            description="Select State and City to auto-populate Assessing Officer (AO) codes."
            icon={<Building size={20} />}
            isActive={activeSectionId === 'section-ao-code'}
          >
            <AOSection
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              states={INDIAN_STATES}
            />
          </FormSection>

          {/* SECTION 6: OTHER DETAILS */}
          <FormSection
            id="section-other-details"
            title="Other Details"
            description="Residential classification and financial status details."
            icon={<Layers size={20} />}
            isActive={activeSectionId === 'section-other-details'}
          >
            <SelectField
              label="Residential Status"
              name="residentialStatus"
              options={['Resident', 'Non-Resident']}
              register={register}
              error={errors.residentialStatus?.message as string}
              required
            />
            <SelectField
              label="Source of Income"
              name="sourceOfIncome"
              options={['No Income', 'Salary', 'Income from Business or Profession', 'Income from House Property', 'Capital Gains', 'Income from Other sources']}
              register={register}
              error={errors.sourceOfIncome?.message as string}
              required
              colSpan="md:col-span-2"
            />
          </FormSection>

          {/* SECTION 7: DOCUMENT PROOF SELECTION */}
          <FormSection
            id="section-proof-selection"
            title="Document Proof Selection"
            description="Identify documents for proof verification."
            icon={<CreditCard size={20} />}
            isActive={activeSectionId === 'section-proof-selection'}
          >
            <ProofSelector 
              register={register} 
              errors={errors} 
              isCorrection={isCorrection} 
            />
          </FormSection>

          {/* SECTION 8: DOCUMENT UPLOAD */}
          <div 
            id="section-doc-upload" 
            className={`scroll-mt-20 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-300 ${
              activeSectionId === 'section-doc-upload' ? 'ring-2 ring-blue-500/10 border-blue-200' : 'opacity-80'
            }`}
          >
            <div className="flex items-start gap-4 border-b border-slate-100 pb-5 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">Required Document Uploads</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">Please upload legible documents. Files are validated for integrity.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {documentRequirements.map((doc) => (
                <DocumentUploader
                  key={doc.documentKey}
                  documentKey={doc.documentKey}
                  label={doc.label}
                  isRequired={doc.isRequired}
                  uploadState={uploadStates[doc.documentKey] || { status: 'idle', progress: 0, metadata: null, error: null, previewUrl: null }}
                  onUpload={(file) => uploadFile(doc.documentKey, file)}
                  onRemove={() => removeFile(doc.documentKey)}
                />
              ))}
            </div>
          </div>

          {/* SECTION 9: SERVICE SUMMARY */}
          <div 
            id="section-summary"
            className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm text-left"
          >
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Service Charges & Wallet Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Automatic deduction will be processed upon checkout.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Service Price</span>
                  <span className="text-base font-black text-slate-800 mt-0.5 block">{formatCurrency(service.mrp)}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${isBalanceSufficient ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <Wallet size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Current Wallet</span>
                  <span className="text-base font-black text-slate-800 mt-0.5 block">{formatCurrency(walletBalance)}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl shrink-0">
                  <Layers size={18} />
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                  <span className={`text-base font-black mt-0.5 block ${isBalanceSufficient ? 'text-slate-800' : 'text-rose-500'}`}>
                    {formatCurrency(walletBalance - service.mrp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error indicators */}
            {displayError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-250 text-red-700 animate-in fade-in duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-normal">{displayError}</p>
              </div>
            )}

            {/* Submit Bar / Checkout */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-t border-slate-200 pt-6">
              <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>NSDL Authorized API Payment Secure Gateway Integration.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder || isServerValidating}
                className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                  isSubmittingOrder || isServerValidating
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[#145BFF] hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {isServerValidating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Validating details...</span>
                  </>
                ) : (
                  <>
                    <span>Validate & Review Details</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      </div>

      {/* ─── HIGH FIDELITY GOVERNMENT PREVIEW MODAL ──────────────────────────── */}
      <GovtForm49APreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        data={formValues}
        isCorrection={isCorrection}
        uploads={uploadStates}
        onSubmit={handleFinalSubmit}
        isSubmitting={isSubmittingOrder}
        previewUrl={generatedPdf?.previewUrl}
      />

    </div>
  );
}
