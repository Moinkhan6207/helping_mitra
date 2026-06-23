export interface UserDashboardSummary {
  walletBalance: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

export interface RecentService {
  id: string;
  name: string;
  slug: string;
  mrp: number;
  status: string;
  updatedAt: string;
  category: {
    name: string;
  };
}

export interface AdminDashboardSummary {
  totalUsers: number;
  totalRetailers: number;
  totalDistributors: number;
  totalMasterDistributors: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  // Service catalogue stats
  totalCategories: number;
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  recentServices: RecentService[];
  // Wallet recharge KPIs (Phase 4)
  pendingRecharges: number;
  underReviewRecharges: number;
  rechargesCreditedToday: number;
  rechargesRejectedToday: number;
}
