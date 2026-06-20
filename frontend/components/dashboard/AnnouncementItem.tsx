import React from 'react';
import { Announcement } from './announcements';
import {
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  TrendingUp,
} from 'lucide-react';

interface AnnouncementItemProps {
  announcement: Announcement;
}

// Config mappings for announcement types (icons, colors, and badges)
const TYPE_CONFIGS = {
  INFO: {
    icon: Megaphone,
    bgClass: 'bg-blue-50/70 border-blue-100/50 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-100',
    descClass: 'text-blue-700/90 dark:text-blue-300/80',
    badgeClass: 'bg-blue-100/80 text-blue-800 border-blue-200/50 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800/50',
    label: 'INFO',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  SUCCESS: {
    icon: CheckCircle2,
    bgClass: 'bg-emerald-50/70 border-emerald-100/50 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-100',
    descClass: 'text-emerald-700/90 dark:text-emerald-300/80',
    badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/50 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-800/50',
    label: 'SUCCESS',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  WARNING: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50/70 border-amber-100/50 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-100',
    descClass: 'text-amber-700/90 dark:text-amber-300/80',
    badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-200/50 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800/50',
    label: 'WARNING',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  SECURITY: {
    icon: ShieldAlert,
    bgClass: 'bg-rose-50/70 border-rose-100/50 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-100',
    descClass: 'text-rose-700/90 dark:text-rose-300/80',
    badgeClass: 'bg-rose-100/80 text-rose-800 border-rose-200/50 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-800/50',
    label: 'SECURITY',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  MAINTENANCE: {
    icon: Wrench,
    bgClass: 'bg-purple-50/70 border-purple-100/50 text-purple-900 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-100',
    descClass: 'text-purple-700/90 dark:text-purple-300/80',
    badgeClass: 'bg-purple-100/80 text-purple-800 border-purple-200/50 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-800/50',
    label: 'MAINTENANCE',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  BUSINESS: {
    icon: TrendingUp,
    bgClass: 'bg-indigo-50/70 border-indigo-100/50 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-100',
    descClass: 'text-indigo-700/90 dark:text-indigo-300/80',
    badgeClass: 'bg-indigo-100/80 text-indigo-800 border-indigo-200/50 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800/50',
    label: 'BUSINESS',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
};

export const AnnouncementItem: React.FC<AnnouncementItemProps> = ({ announcement }) => {
  const config = TYPE_CONFIGS[announcement.type] || TYPE_CONFIGS.INFO;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 hover:shadow-sm ${config.bgClass}`}>
      {/* Upper header section: Badge + optional timestamp */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border select-none ${config.badgeClass}`}>
          {config.label}
        </span>
        {announcement.timestamp && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold italic">
            {announcement.timestamp}
          </span>
        )}
      </div>

      {/* Main content: Icon, Title, and Message */}
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}>
          <Icon size={16} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold tracking-tight select-none">
            {announcement.title}
          </h4>
          <p className={`text-[11px] font-medium leading-relaxed ${config.descClass}`}>
            {announcement.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementItem;
