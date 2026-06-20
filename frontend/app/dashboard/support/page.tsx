'use client';

import React from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  HelpCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

/**
 * Support Page — Phase 3 MVP
 *
 * Shows:
 * - WhatsApp Support (primary channel)
 * - Support Phone
 * - Support Email
 * - Operating hours
 * - FAQ accordion (Phase 3 MVP)
 */
export default function SupportPage() {
  const supportChannels = [
    {
      id: 'whatsapp-support',
      label: 'WhatsApp Support',
      description: 'Chat directly with our support team. Fastest response.',
      icon: MessageCircle,
      color: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      action: () => window.open('https://wa.me/919999999999?text=Hi%2C%20I%20need%20help%20with%20Helping%20Mitra', '_blank'),
      buttonLabel: 'Open WhatsApp',
      buttonClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
      value: '+91 99999 99999',
    },
    {
      id: 'phone-support',
      label: 'Support Phone',
      description: 'Call us directly during business hours.',
      icon: Phone,
      color: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600',
      action: () => window.open('tel:+919999999999', '_self'),
      buttonLabel: 'Call Now',
      buttonClass: 'bg-[#145BFF] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20',
      value: '+91 99999 99999',
    },
    {
      id: 'email-support',
      label: 'Email Support',
      description: 'Send us an email for non-urgent queries.',
      icon: Mail,
      color: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-50 border-violet-100 text-violet-600',
      action: () => window.open('mailto:support@helpingmitra.com?subject=Support%20Request', '_self'),
      buttonLabel: 'Send Email',
      buttonClass: 'bg-violet-500 hover:bg-violet-600 text-white shadow-md shadow-violet-500/20',
      value: 'support@helpingmitra.com',
    },
  ];

  const faqs = [
    {
      q: 'How do I apply for a PAN card?',
      a: 'Go to PAN Services → New PAN Apply in the sidebar. Fill in the required form fields and upload the necessary documents. Your wallet will be debited automatically.',
    },
    {
      q: 'How long does it take to process an order?',
      a: 'Most orders are processed within 24–48 hours. You will be able to track the status in My Orders once order tracking is activated.',
    },
    {
      q: 'How is my wallet funded?',
      a: 'Your wallet is funded by the admin team. Contact support via WhatsApp or phone to request a wallet top-up. Do NOT share your password or OTP with anyone.',
    },
    {
      q: 'What documents do I need for Voter PDF service?',
      a: 'The Voter PDF service requires your Voter ID number or Epic number. Check the service page for the complete document checklist.',
    },
    {
      q: 'I submitted a wrong application. Can I cancel it?',
      a: 'Please contact support immediately via WhatsApp with your order details. Cancellation depends on whether the order has already been processed.',
    },
  ];

  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          Get help from the Helping Mitra team. We're here for you.
        </p>
      </div>

      {/* Security Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700 leading-relaxed">
          <strong>Security notice:</strong> Helping Mitra staff will <strong>NEVER</strong> ask for
          your password, OTP, or PIN code. Do not share these with anyone.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportChannels.map(({ id, label, description, icon: Icon, iconBg, action, buttonLabel, buttonClass, value }) => (
          <div
            key={id}
            id={id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 font-mono">
              {value}
            </p>

            <button
              onClick={action}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${buttonClass}`}
            >
              {buttonLabel}
              <ExternalLink size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Operating Hours */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Clock size={15} className="text-slate-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Operating Hours</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { day: 'Monday – Friday', hours: '9:00 AM – 7:00 PM' },
            { day: 'Saturday', hours: '10:00 AM – 5:00 PM' },
            { day: 'Sunday', hours: 'WhatsApp only' },
            { day: 'Public Holidays', hours: 'WhatsApp only' },
          ].map(({ day, hours }) => (
            <div key={day} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500">{day}</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{hours}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
          <HelpCircle size={16} className="text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800">Frequently Asked Questions</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} id={`faq-item-${idx}`}>
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                aria-expanded={openFaq === idx}
              >
                <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                <span className={`text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-4 animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
