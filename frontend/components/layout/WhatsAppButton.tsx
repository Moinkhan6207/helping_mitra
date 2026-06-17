import React from 'react';
import { MessageSquareCode } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  return (
    <a
      href="https://wa.me/919876543210"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/20 active:scale-95 transition-all duration-200"
      aria-label="WhatsApp Support Helpdesk"
    >
      <MessageSquareCode className="h-6 w-6" />
    </a>
  );
};

export default WhatsAppButton;
