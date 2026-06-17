import React from 'react';
import Link from 'next/link';
import RegisterForm from '@/features/auth/components/RegisterForm';

export const metadata = {
  title: 'Register Partner - Helping Mitra',
  description: 'Create a Helping Mitra Partner Account. Choose Retailer, Distributor, or Master Distributor role and start your service agency.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-[#e2edf8] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft circular background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-blue-300/35 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-blue-400/30 rounded-full blur-[90px] pointer-events-none" />

      {/* Register Form Container */}
      <div className="w-full flex justify-center z-10">
        <RegisterForm />
      </div>
    </div>
  );
}
