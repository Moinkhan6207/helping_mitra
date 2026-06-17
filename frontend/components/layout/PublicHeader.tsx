'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '#hero' },
    { name: 'About Us', href: '#platform' },
    { name: 'Services', href: '#services' },
    { name: 'Business Partners', href: '#plans' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between" aria-label="Global">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-blue to-indigo-600 p-2 shadow-md shadow-primary-blue/15">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Helping <span className="text-primary-blue">Mitra</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex md:gap-x-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-primary-blue transition-colors duration-150"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Member Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Create Account
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-500 hover:text-slate-700 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-6 py-5 flex flex-col gap-5 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className="text-base font-semibold text-slate-600 hover:text-primary-blue transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <Link href="/login" onClick={handleLinkClick}>
              <Button variant="outline" size="md" className="w-full">
                Member Login
              </Button>
            </Link>
            <Link href="/register" onClick={handleLinkClick}>
              <Button variant="primary" size="md" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
