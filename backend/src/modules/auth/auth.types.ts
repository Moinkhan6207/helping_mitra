import { Role, UserStatus, UserType } from '@prisma/client';

export interface JWTPayload {
  id: string;
  role: Role;
  userType: UserType | null;
  status: UserStatus;
}

export interface AuthUserResponse {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: Role;
  userType: UserType | null;
  status: UserStatus;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}
