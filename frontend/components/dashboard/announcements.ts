export type AnnouncementType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'SECURITY'
  | 'MAINTENANCE'
  | 'BUSINESS';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string;
  timestamp?: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    type: 'INFO',
    title: 'Platform Update',
    message:
      'Welcome to Helping Mitra Portal. PAN Services, Voter Services, Samagra Services, Vahan Services, Driving Licence Services and Farmer Services are now available through a single dashboard experience.',
  },
  {
    id: '2',
    type: 'SUCCESS',
    title: 'Live Services Status',
    message:
      'PAN Find, PAN PDF, Voter PDF, Samagra PDF, RC PDF and DL PDF services are currently operational.',
    timestamp: 'Last Updated: Today',
  },
  {
    id: '3',
    type: 'SECURITY',
    title: 'Security Advisory',
    message:
      'Never share your password, OTP, wallet PIN or login credentials. Helping Mitra support team will never ask for sensitive account information.',
  },
  {
    id: '4',
    type: 'WARNING',
    title: 'Wallet Information',
    message:
      'All service charges are deducted directly from your wallet balance. Please maintain sufficient balance before placing service orders.',
  },
  {
    id: '5',
    type: 'BUSINESS',
    title: 'Business Growth Opportunity',
    message:
      'Activate additional services such as PAN, Voter, Samagra and Farmer Services to increase monthly earnings.',
  },
  {
    id: '6',
    type: 'MAINTENANCE',
    title: 'System Maintenance',
    message:
      'Routine maintenance activities may be performed during non-business hours. Any planned downtime will be announced in advance.',
  },
];
