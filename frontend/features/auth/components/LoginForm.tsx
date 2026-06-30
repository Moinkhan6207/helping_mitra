'use client';

import React, { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useLogin } from '../hooks/useLogin';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { MessageSquare, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Email or Mobile Number is required')
    .refine((val) => {
      // Must be valid email OR exactly 10-digit mobile number
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      const isEmail = emailRegex.test(val);
      const isMobile = /^\d{10}$/.test(val);
      return isEmail || isMobile;
    }, {
      message: 'Please enter a valid email address or 10-digit mobile number',
    }),
  password: z.string().min(1, 'Password is required'),
});

function LoginFormContent() {
  const searchParams = useSearchParams();
  const isRegistered = searchParams ? searchParams.get('registered') === 'true' : false;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError(null);

    const trimmedIdentifier = identifier.trim();

    // Schema Validation
    const validationResult = loginSchema.safeParse({ identifier: trimmedIdentifier, password });
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // API login call
    loginMutation.mutate(
      { identifier: validationResult.data.identifier, password },
      {
        onError: (err: any) => {
          setApiError(err?.message || 'Invalid username or password. Please try again.');
        },
      }
    );
  };

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
                <CheckCircle2 size={20} className="text-white" />
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

      {/* Right Column - Login Form */}
      <div className="w-full md:w-[55%] bg-white p-8 md:p-12 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Login to Your Account</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your account</p>
          </div>

          {isRegistered && (
            <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold">Account Registered!</p>
                <p className="text-xs text-emerald-600/90 mt-0.5">Please check your credentials and sign in.</p>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm font-medium">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              theme="light"
              label="Email Address or Mobile"
              placeholder="enter registered email or mobile"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={errors.identifier}
              disabled={loginMutation.isPending}
            />

            <div>
              <PasswordInput
                theme="light"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={loginMutation.isPending}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#2b5a9e] hover:text-blue-800 font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2 bg-[#2b5a9e] hover:bg-blue-800 text-white"
              loading={loginMutation.isPending}
              disabled={loginMutation.isPending}
            >
              <span>Login To Account</span>
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex justify-center items-center text-sm gap-2">
            <span className="text-slate-500">New partner?</span>
            <Link
              href="/register"
              className="text-[#2b5a9e] hover:underline font-semibold transition-colors"
            >
              Create New Account
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
              href="https://wa.me/917999713744?text=Hello%20Helping%20Mitra%20Support"
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
}

export const LoginForm: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-6 bg-slate-800 rounded w-1/2"></div>
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-10 bg-slate-800 rounded w-full mt-4"></div>
          <div className="h-10 bg-slate-800 rounded w-full"></div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
};

export default LoginForm;
