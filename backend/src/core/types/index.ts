export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorDetail {
  code: string;
  details: any;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: ErrorDetail;
}

export interface AuthenticatedUser {
  id: string;
  role: 'USER' | 'ADMIN';
  userType: 'RETAILER' | 'DISTRIBUTOR' | 'MASTER_DISTRIBUTOR' | null;
  status: 'ACTIVE' | 'INACTIVE';
}
