import React from 'react';
import Link from 'next/link';
import LoginForm from '@/features/auth/components/LoginForm';

export const metadata = {
  title: 'Login - Helping Mitra',
  description: 'Access the Helping Mitra Partner Portal. Log in to manage Samagra, PAN, and Vahan digital registry services.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#e2edf8] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft circular background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-blue-300/35 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-blue-400/30 rounded-full blur-[90px] pointer-events-none" />

      {/* Login Form Container */}
      <div className="w-full flex justify-center z-10">
        <LoginForm />
      </div>
    </div>
  );
}
