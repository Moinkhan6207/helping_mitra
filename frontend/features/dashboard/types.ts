export interface UserDashboardSummary {
  walletBalance: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
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
}
