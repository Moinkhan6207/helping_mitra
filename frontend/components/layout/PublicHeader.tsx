'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('#hero');
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: 'Home', href: '/#hero' },
    { name: 'About Us', href: '/#platform' },
    { name: 'Services', href: '/#services' },
    { name: 'Business Partners', href: '/#plans' },
    { name: 'Contact', href: '/#contact' },
  ];

  // Set active section on initial load if hash is present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      setActiveSection(window.location.hash);
    }
  }, []);

  // IntersectionObserver to highlight section on scroll
  useEffect(() => {
    const isHomePage = window.location.pathname === '/';
    if (!isHomePage) return;

    const sections = ['hero', 'platform', 'services', 'plans', 'contact'];
    const elements = sections.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -55% 0px', // Highlights when section occupies the middle portion of the screen
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingRef.current) return; // Prevent highlighting jump during smooth scrolling

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            setActiveSection(`#${id}`);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const isHomePage = window.location.pathname === '/';
    const hash = href.includes('#') ? '#' + href.split('#')[1] : '';

    if (isHomePage && hash) {
      e.preventDefault();
      const targetId = hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        isScrollingRef.current = true;
        setActiveSection(hash);

        element.scrollIntoView({ behavior: 'smooth' });

        // Update URL hash state without causing page jump
        window.history.pushState(null, '', hash);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Keep isScrolling = true until smooth scroll is estimated to finish
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 850);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between" aria-label="Global">
        
        {/* Logo */}
        <Link 
          href="/#hero" 
          onClick={(e) => handleNavClick(e, '/#hero')}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-blue to-indigo-600 p-2 shadow-md shadow-primary-blue/15">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Helping <span className="text-primary-blue">Mitra</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex md:gap-x-8">
          {navigation.map((item) => {
            const itemHash = '#' + item.href.split('#')[1];
            const isActive = activeSection === itemHash;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`relative py-1.5 text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary-blue font-bold' 
                    : 'text-slate-600 hover:text-primary-blue'
                }`}
              >
                {item.name}
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue rounded-full transition-all duration-300 ${
                  isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                }`} />
              </a>
            );
          })}
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
          <div className="flex flex-col gap-3">
            {navigation.map((item) => {
              const itemHash = '#' + item.href.split('#')[1];
              const isActive = activeSection === itemHash;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item.href);
                    handleLinkClick();
                  }}
                  className={`pl-3.5 py-2.5 border-l-2 text-base font-bold transition-all duration-200 rounded-r-lg ${
                    isActive 
                      ? 'text-primary-blue border-primary-blue bg-blue-50/40' 
                      : 'text-slate-600 border-transparent hover:text-primary-blue hover:border-slate-350'
                  }`}
                >
                  {item.name}
                </a>
              );
            })}
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
