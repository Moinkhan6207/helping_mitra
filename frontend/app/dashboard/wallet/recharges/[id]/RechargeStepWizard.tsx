'use client';

import React from 'react';
import { Check, CreditCard, Send, Hourglass, CheckCircle2, AlertCircle } from 'lucide-react';

interface RechargeStepWizardProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  status?: string;
}

export default function RechargeStepWizard({ currentStep, status }: RechargeStepWizardProps) {
  const steps = [
    { number: 1, label: 'Create Recharge', icon: Check },
    { number: 2, label: 'Pay Amount', icon: CreditCard },
    { number: 3, label: 'Submit Proof', icon: Send },
    { number: 4, label: 'Under Verification', icon: Hourglass },
    { number: 5, label: 'Wallet Credited', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 select-none w-full">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const stepNum = step.number;
          
          // Determine status of this step
          let isCompleted = currentStep > stepNum;
          let isActive = currentStep === stepNum;
          let isWarning = status === 'REJECTED' && stepNum === 3;
          
          // Custom override based on status
          if (status === 'BALANCE_CREDITED') {
            isCompleted = true;
            isActive = false;
          }
          
          const StepIcon = step.icon;

          return (
            <React.Fragment key={step.number}>
              {/* Connector line */}
              {idx > 0 && (
                <div className={`flex-1 h-0.5 mx-2 md:mx-4 transition-all duration-300 ${
                  isCompleted || (isActive && !isWarning) ? 'bg-[#145BFF]' : 'bg-slate-200'
                }`} />
              )}

              {/* Step item */}
              <div className="flex flex-col items-center relative z-10 shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                    isWarning
                      ? 'bg-rose-50 border-rose-500 text-rose-600 ring-4 ring-rose-500/10'
                      : isCompleted
                      ? 'bg-[#145BFF] border-[#145BFF] text-white'
                      : isActive
                      ? 'bg-white border-[#145BFF] text-[#145BFF] ring-4 ring-[#145BFF]/10 scale-105 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {isWarning ? (
                    <AlertCircle size={15} className="stroke-[2.5]" />
                  ) : isCompleted ? (
                    <Check size={14} className="stroke-[3]" />
                  ) : (
                    <StepIcon size={14} className="stroke-[2]" />
                  )}
                </div>
                
                <span
                  className={`text-[9px] md:text-[10px] font-black mt-2.5 uppercase tracking-wider text-center hidden sm:inline-block max-w-[100px] transition-colors duration-200 ${
                    isWarning
                      ? 'text-rose-600'
                      : isCompleted || isActive
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile-only active step text banner */}
      <div className="sm:hidden mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase text-slate-500 tracking-wider">
        <span>Active Stage:</span>
        <span className={`text-[#145BFF] ${status === 'REJECTED' ? 'text-rose-600' : ''}`}>
          {status === 'REJECTED' && currentStep === 3
            ? 'Action Required: Resubmit Proof'
            : steps[currentStep - 1].label}
        </span>
      </div>
    </div>
  );
}
