'use client';

import React from 'react';
import { Phone, Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-12 md:py-16 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-2 items-center">
        
        {/* Contact Info Details */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue bg-primary-blue/5 px-3 py-1 rounded-full border border-primary-blue/10">
              Contact Center
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-4 sm:text-4xl tracking-tight leading-tight">
              Got a Question About Helping Mitra?
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Have questions about registration, commission slabs, or wallet recharges? Reach out to our dedicated merchant helpdesk.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Phone */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm shadow-slate-100 hover:border-slate-350 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue border border-primary-blue/10">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-semibold">Support Mobile Number</span>
                <span className="text-slate-900 font-bold block mt-0.5 text-sm sm:text-base">+91 9876543210</span>
                <a href="tel:+919876543210" className="mt-1 inline-flex items-center text-xs text-primary-blue font-bold hover:underline gap-1">
                  Call Us
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm shadow-slate-100 hover:border-slate-350 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-semibold">Support Email</span>
                <span className="text-slate-900 font-bold block mt-0.5 text-sm sm:text-base break-all">support@helpingmitra.com</span>
                <a href="mailto:support@helpingmitra.com" className="mt-1 inline-flex items-center text-xs text-indigo-600 font-bold hover:underline gap-1">
                  Send Email
                </a>
              </div>
            </div>

            {/* Address */}
            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm shadow-slate-100 hover:border-slate-350 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-semibold">Office Address</span>
                <p className="text-slate-700 font-medium text-xs leading-normal mt-0.5">
                  123 FinTech Row, Bandra Kurla Complex, Bandra East, Mumbai, MH - 400051
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Mockup */}
        <div className="flex justify-center items-center">
          <Card hoverGlow glass className="w-full max-w-md p-6 bg-white border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-blue" /> Send Message
            </h3>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-550 font-semibold">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary-blue/40 text-slate-800 rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-550 font-semibold">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="Enter 10-Digit Mobile"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary-blue/40 text-slate-800 rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-550 font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter Email Address"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary-blue/40 text-slate-800 rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-550 font-semibold">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help your service center?"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary-blue/40 text-slate-800 rounded-xl px-4 py-3 text-xs placeholder-slate-400 outline-none transition-colors resize-none"
                />
              </div>

              <Button variant="primary" size="md" className="w-full mt-2 cursor-pointer">
                Submit Query <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;
