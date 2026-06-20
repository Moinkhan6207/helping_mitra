import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { ANNOUNCEMENTS } from './announcements';
import AnnouncementItem from './AnnouncementItem';

export const AnnouncementsCard: React.FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check browser preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  // Duplicate dataset to support seamless infinite loop translation
  const infiniteAnnouncements = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 flex flex-col h-full min-h-[280px] select-none">
      {/* Header Title Info */}
      <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Megaphone size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Announcements</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Latest news and alerts</p>
        </div>
      </div>

      {/* Scrolling viewport with responsive heights */}
      <div className="ticker-card-viewport flex-1 relative overflow-hidden mt-3 h-[200px] sm:h-[240px] md:h-[260px] lg:h-[300px]">
        {prefersReducedMotion ? (
          // Static Mode (accessible fallback)
          <div className="h-full overflow-y-auto space-y-3 pr-1 py-1">
            {ANNOUNCEMENTS.map((announcement, idx) => (
              <AnnouncementItem key={`${announcement.id}-${idx}`} announcement={announcement} />
            ))}
          </div>
        ) : (
          // Dynamic auto-scrolling mode
          <div className="absolute top-0 left-0 right-0 scrolling-ticker-list flex flex-col gap-3 py-1">
            {infiniteAnnouncements.map((announcement, idx) => (
              <AnnouncementItem key={`${announcement.id}-${idx}`} announcement={announcement} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsCard;
