export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type UserType = 'RETAILER' | 'DISTRIBUTOR' | 'MASTER_DISTRIBUTOR';

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  userType: UserType | null;
  status: UserStatus;
  shopName?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  address?: string | null;
  state?: string | null;
  district?: string | null;
  pinCode?: string | null;
}

export interface AuthSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponseData {
  user: User;
}

export interface RefreshTokenResponseData {
  accessToken: string;
}
