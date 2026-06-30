'use client';

import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-16 bg-white relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#145BFF]/3 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/3 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 flex flex-col items-center text-center">

        {/* Contact Info Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3.5 py-1.5 rounded-full border border-primary-blue/10">
            Contact Center
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-5 sm:text-4xl tracking-tight leading-tight">
            Got a Question About Helping Mitra?
          </h2>
          <p className="text-slate-650 mt-3 text-sm sm:text-base leading-relaxed">
            Have questions about registration, commission slabs, or wallet recharges? Reach out to our dedicated merchant helpdesk.
          </p>
        </div>

        {/* 3-Column Contact Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">

          {/* Phone Card */}
          <div className="flex flex-col items-center p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-blue/10 text-primary-blue border border-primary-blue/10 mb-4 transition-transform duration-300 hover:scale-110">
              <Phone className="h-5.5 w-5.5" />
            </div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Support Mobile</span>
            <span className="text-slate-900 font-extrabold mt-2 text-base sm:text-lg">+91 7999713744</span>
            <a
              href="tel:+919876543210"
              className="mt-3 inline-flex items-center text-xs text-primary-blue font-bold hover:underline"
            >
              Call Us
            </a>
          </div>

          {/* Email Card */}
          <div className="flex flex-col items-center p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-650 mb-4 transition-transform duration-300 hover:scale-110">
              <Mail className="h-5.5 w-5.5" />
            </div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Support Email</span>
            <span className="text-slate-900 font-extrabold mt-2 text-base sm:text-lg break-all">helpingmitra01@gmail.com</span>
            <a
              href="mailto:support@helpingmitra.com"
              className="mt-3 inline-flex items-center text-xs text-indigo-650 font-bold hover:underline"
            >
              Send Email
            </a>
          </div>

          {/* Address Card */}
          <div className="flex flex-col items-center p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-4 transition-transform duration-300 hover:scale-110">
              <MapPin className="h-5.5 w-5.5" />
            </div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Office Address</span>
            <p className="text-slate-700 font-medium text-xs leading-relaxed mt-2.5 max-w-[240px]">
              123 FinTech Row, Bandra Kurla Complex, Bandra East, Mumbai, MH - 400051
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default ContactSection;
