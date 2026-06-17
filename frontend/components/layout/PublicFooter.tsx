import React from 'react';
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const companyLinks = [
    { name: 'About Us', href: '#platform' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Partner Plans', href: '#plans' },
  ];

  const serviceLinks = [
    { name: 'PAN Card Services', href: '#services' },
    { name: 'Voter ID Services', href: '#services' },
    { name: 'Samagra Services', href: '#services' },
    { name: 'Vahan Services', href: '#services' },
    { name: 'Driving Licence', href: '#services' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Disclaimer', href: '#' },
  ];

  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-16 text-slate-600 text-sm">
      <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-4">
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-blue to-indigo-600 p-1.5 shadow-md shadow-primary-blue/15">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              Helping Mitra
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Helping Mitra is a premium digital service business platform enabling retailers across India to run their own Service Center.
          </p>
        </div>

        {/* Company Links */}
        <div>
          <h4 className="font-bold text-slate-900 mb-4">Company</h4>
          <ul className="flex flex-col gap-2.5">
            {companyLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-primary-blue transition-colors duration-150">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services Links */}
        <div>
          <h4 className="font-bold text-slate-900 mb-4">Services</h4>
          <ul className="flex flex-col gap-2.5">
            {serviceLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} className="hover:text-primary-blue transition-colors duration-150">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info column */}
        <div>
          <h4 className="font-bold text-slate-900 mb-4">Contact Info</h4>
          <ul className="flex flex-col gap-3.5">
            <li className="flex items-start gap-2.5">
              <Phone className="h-4.5 w-4.5 text-primary-blue mt-0.5" />
              <span>+91 9876543210</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="h-4.5 w-4.5 text-primary-blue mt-0.5" />
              <span className="break-all">support@helpingmitra.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4.5 w-4.5 text-primary-blue mt-0.5" />
              <span>123 FinTech Row, Bandra, Mumbai, MH - 400051</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright row */}
      <div className="mx-auto max-w-7xl px-6 mt-16 pt-8 border-t border-slate-200 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>&copy; 2026 Helping Mitra. All rights reserved.</p>
        <ul className="flex items-center gap-6">
          {legalLinks.map((link) => (
            <li key={link.name}>
              <a href={link.href} className="hover:text-primary-blue transition-colors">
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default PublicFooter;
