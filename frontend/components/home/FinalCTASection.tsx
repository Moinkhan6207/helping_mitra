import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

export const FinalCTASection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-tr from-slate-50 via-white to-slate-50 border-t border-slate-200 relative overflow-hidden text-center">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] h-[300px] w-[500px] rounded-full bg-primary-blue/5 blur-[120px] -z-10" />

      <div className="mx-auto max-w-4xl px-6 flex flex-col items-center gap-6">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-5xl tracking-tight leading-none">
          Ready to Start Your <br className="inline" />
          <span className="bg-gradient-to-r from-primary-blue to-indigo-600 bg-clip-text text-transparent">
            Service Business?
          </span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
          Register in minutes, add wallet balances securely, and launch utility operations from your local shop immediately.
        </p>

        <div className="pt-4">
          <Link href="/register">
            <Button variant="primary" size="lg" className="px-8 py-4">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
