'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useRegister } from '../hooks/useRegister';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { UserType } from '../types';
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from 'lucide-react';

// Define schemas for each step separately for step-level validation
const stepSchemas = [
  // Step 1: Personal Info
  z.object({
    name: z.string().min(1, 'Full Name is required'),
    shopName: z.string().min(1, 'Shop Name is required'),
  }),
  // Step 2: Contact Info
  z.object({
    mobile: z.string().regex(/^\d{10}$/, 'Mobile must be exactly 10 digits'),
    email: z.string().email('Please enter a valid email address'),
  }),
  // Step 3: KYC Info
  z.object({
    aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar Number must be exactly 12 digits'),
    panNumber: z.string()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F)'),
  }),
  // Step 4: Address Info
  z.object({
    address: z.string().min(1, 'Address is required'),
    state: z.string().min(1, 'State is required'),
    district: z.string().min(1, 'District is required'),
    pinCode: z.string().regex(/^\d{6}$/, 'Pin Code must be exactly 6 digits'),
  }),
  // Step 5: Account Type
  z.object({
    userType: z.enum(['RETAILER', 'DISTRIBUTOR', 'MASTER_DISTRIBUTOR']),
  }),
  // Step 6: Password Info
  z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
];

type FormData = {
  name: string;
  shopName: string;
  mobile: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  userType: UserType;
  password?: string;
  confirmPassword?: string;
};

export const RegisterForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shopName: '',
    mobile: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    address: '',
    state: '',
    district: '',
    pinCode: '',
    userType: 'RETAILER',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const registerMutation = useRegister();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error once user starts editing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    setErrors({});
    const schema = stepSchemas[currentStep - 1];
    
    // Pick current step fields
    const dataToValidate: Record<string, any> = {};
    if (currentStep === 1) {
      dataToValidate.name = formData.name;
      dataToValidate.shopName = formData.shopName;
    } else if (currentStep === 2) {
      dataToValidate.mobile = formData.mobile;
      dataToValidate.email = formData.email;
    } else if (currentStep === 3) {
      dataToValidate.aadhaarNumber = formData.aadhaarNumber;
      dataToValidate.panNumber = formData.panNumber;
    } else if (currentStep === 4) {
      dataToValidate.address = formData.address;
      dataToValidate.state = formData.state;
      dataToValidate.district = formData.district;
      dataToValidate.pinCode = formData.pinCode;
    } else if (currentStep === 5) {
      dataToValidate.userType = formData.userType;
    } else if (currentStep === 6) {
      dataToValidate.password = formData.password;
      dataToValidate.confirmPassword = formData.confirmPassword;
    }

    const validationResult = schema.safeParse(dataToValidate);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        } else {
          // Top-level refine error (e.g. password mismatch in step 6)
          fieldErrors.confirmPassword = issue.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setApiError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateCurrentStep()) return;

    // Trigger user registration call
    registerMutation.mutate(formData, {
      onError: (err: any) => {
        // Display precise server conflict errors or generic server exception messages
        setApiError(err?.message || 'Registration failed. Please try again.');
      },
    });
  };

  const stepsInfo = [
    { title: 'Personal', desc: 'Name & Shop' },
    { title: 'Contact', desc: 'Mobile & Email' },
    { title: 'KYC', desc: 'Aadhaar & PAN' },
    { title: 'Address', desc: 'Location' },
    { title: 'Account', desc: 'Partner Role' },
    { title: 'Security', desc: 'Password' },
  ];

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[620px] z-10 animate-fadeIn">
      {/* Left Column - Portal Branding (Dark Blue Background) */}
      <div className="w-full md:w-[45%] bg-[#2b5a9e] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-white/5 rounded-full pointer-events-none" />

        {/* Logo and Tagline */}
        <div className="flex flex-col items-center justify-center flex-grow text-center z-10 py-10 md:py-0">
          {/* Logo Icon */}
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-2xl font-black text-[#2b5a9e] shadow-lg mb-6 hover:scale-105 transition-transform duration-300">
            HM
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Helping Mitra Portal
          </h1>
          <p className="text-sm text-blue-100 max-w-xs leading-relaxed">
            Your trusted partner for Digital & Financial Services
          </p>

          {/* Features List */}
          <div className="mt-12 space-y-6 w-full max-w-xs text-left">
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors duration-200">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide">100% Secure & Trusted</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors duration-200">
                <ArrowRight size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide">Instant Processing</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors duration-200">
                <Check size={20} className="text-white" />
              </div>
              <span className="text-sm font-semibold tracking-wide">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="text-center md:text-left text-xs text-blue-200/60 z-10">
          © 2026 Helping Mitra. All rights reserved.
        </div>
      </div>

      {/* Right Column - Multi-Step Wizard Form */}
      <div className="w-full md:w-[55%] bg-white p-8 md:p-12 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Become a Partner</h2>
            <p className="text-sm text-slate-500 mt-1">Create your Helping Mitra digital store registry</p>
          </div>

          {/* Progress Wizard Headers */}
          <div className="mb-8 hidden sm:flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            
            {stepsInfo.map((step, idx) => {
              const stepNum = idx + 1;
              const isCompleted = currentStep > stepNum;
              const isActive = currentStep === stepNum;

              return (
                <div key={idx} className="flex flex-col items-center z-10 select-none">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isActive
                        ? 'bg-primary-blue border-primary-blue text-white shadow-lg shadow-primary-blue/30 scale-110'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-2 uppercase tracking-wide transition-colors duration-200 ${
                      isActive ? 'text-primary-blue font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Small Screen Step Indicator */}
          <div className="sm:hidden mb-6 flex items-center justify-between text-xs text-slate-500 font-bold px-1 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <span>STEP {currentStep} OF 6: {stepsInfo[currentStep - 1].title.toUpperCase()}</span>
            <span className="text-primary-blue">{Math.round(((currentStep - 1) / 5) * 100)}% DONE</span>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    theme="light"
                    label="Full Name"
                    placeholder="enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                  />
                  <Input
                    theme="light"
                    label="Shop Name"
                    placeholder="enter shop/business name"
                    value={formData.shopName}
                    onChange={(e) => handleInputChange('shopName', e.target.value)}
                    error={errors.shopName}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    theme="light"
                    label="Mobile Number"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                    error={errors.mobile}
                  />
                  <Input
                    theme="light"
                    label="Email Address"
                    placeholder="partner@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                  />
                </div>
              </div>
            )}

            {/* Step 3: KYC Info */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">KYC Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    theme="light"
                    label="Aadhaar Number"
                    placeholder="12-digit Aadhaar card number"
                    maxLength={12}
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                    error={errors.aadhaarNumber}
                  />
                  <Input
                    theme="light"
                    label="PAN Card Number"
                    placeholder="10-character PAN number"
                    maxLength={10}
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                    error={errors.panNumber}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Address Info */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">Address Information</h3>
                <Input
                  theme="light"
                  label="Full Office/Shop Address"
                  placeholder="flat, block, street address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={errors.address}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    theme="light"
                    label="State"
                    placeholder="e.g. Madhya Pradesh"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    error={errors.state}
                  />
                  <Input
                    theme="light"
                    label="District"
                    placeholder="e.g. Indore"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    error={errors.district}
                  />
                  <Input
                    theme="light"
                    label="Pin Code"
                    placeholder="6-digit zip/pin"
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => handleInputChange('pinCode', e.target.value.replace(/\D/g, ''))}
                    error={errors.pinCode}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Account Type */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">Select Account Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['RETAILER', 'DISTRIBUTOR', 'MASTER_DISTRIBUTOR'] as const).map((type) => {
                    const titleMap = {
                      RETAILER: 'Retailer',
                      DISTRIBUTOR: 'Distributor',
                      MASTER_DISTRIBUTOR: 'Master Distributor',
                    };
                    const descMap = {
                      RETAILER: 'Use single wallet services directly for your store customers.',
                      DISTRIBUTOR: 'Onboard and distribute services to network retailers.',
                      MASTER_DISTRIBUTOR: 'Create distributors, retailers, and scale regional networks.',
                    };

                    return (
                      <div
                        key={type}
                        onClick={() => handleInputChange('userType', type)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                          formData.userType === type
                            ? 'border-primary-blue bg-primary-blue/5 text-slate-900 ring-2 ring-primary-blue/10'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold text-sm ${formData.userType === type ? 'text-primary-blue' : 'text-slate-800'}`}>
                            {titleMap[type]}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              formData.userType === type ? 'border-primary-blue bg-primary-blue' : 'border-slate-300'
                            }`}
                          >
                            {formData.userType === type && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{descMap[type]}</p>
                      </div>
                    );
                  })}
                </div>
                {errors.userType && (
                  <span className="text-xs text-red-500 font-medium">{errors.userType}</span>
                )}
              </div>
            )}

            {/* Step 6: Password Info */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-semibold text-slate-500 border-b border-slate-100 pb-2 mb-2">Setup Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PasswordInput
                    theme="light"
                    label="Password"
                    placeholder="at least 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={errors.password}
                    disabled={registerMutation.isPending}
                  />
                  <PasswordInput
                    theme="light"
                    label="Confirm Password"
                    placeholder="re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    disabled={registerMutation.isPending}
                  />
                </div>
              </div>
            )}

            {/* Action Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={registerMutation.isPending}
                  className="inline-flex items-center justify-center px-5 py-3 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#2b5a9e] hover:bg-blue-800 text-white rounded-xl font-semibold shadow-lg shadow-blue-800/15 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} className="ml-2" />
                </button>
              ) : (
                <Button
                  type="submit"
                  className="px-6 py-3 bg-[#2b5a9e] hover:bg-blue-800 text-white"
                  loading={registerMutation.isPending}
                  disabled={registerMutation.isPending}
                >
                  <span>Submit Registration</span>
                  <Check size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex justify-center items-center text-sm gap-2">
            <span className="text-slate-500">Already registered?</span>
            <Link
              href="/login"
              className="text-[#2b5a9e] hover:underline font-semibold transition-colors"
            >
              Sign In Here
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/activate"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-500/10"
            >
              <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] font-black">
                ✓
              </div>
              <span>Activate Existing Account</span>
            </Link>

            <a
              href="https://wa.me/919999999999?text=Hello%20Helping%20Mitra%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#128C7E] hover:bg-[#075E54] text-white rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] shadow-md shadow-emerald-600/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489.002 9.961-4.469 9.964-9.964.003-2.66-1.026-5.163-2.897-7.037C16.471 1.73 13.97 .7 11.998.7c-5.492 0-9.963 4.471-9.965 9.965-.001 1.93.535 3.803 1.547 5.474l-.979 3.575 3.666-.96c1.602.876 3.178 1.346 4.39 1.349zM18.867 15.46c-.308-.154-1.82-.9-2.1-.1s-.242.308-.297.37c-.055.062-.11.093-.219.043-.109-.053-.46-.17-1.398-.98-.73-.65-1.224-1.455-1.368-1.7-.142-.246-.015-.38.093-.488.098-.097.219-.247.308-.371.09-.124.11-.21.165-.353.055-.143.028-.268-.014-.352-.04-.085-.297-.87-.393-1.1s-.192-.187-.24-.19l-.21-.005c-.144 0-.377.054-.574.271-.197.217-.753.736-.753 1.794s.77 2.083.878 2.228c.108.146 1.516 2.316 3.673 3.247.513.221.913.354 1.225.453.515.163.984.14 1.354.084.413-.062 1.82-.743 2.076-1.46.257-.718.257-1.334.18-1.46-.077-.128-.242-.206-.55-.36z"/>
              </svg>
              <span>Support WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
