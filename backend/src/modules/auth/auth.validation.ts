import { z } from 'zod';
import { UserType } from '@prisma/client';

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Full Name is required'),
    mobile: z
      .string()
      .trim()
      .length(10, 'Mobile must be exactly 10 digits')
      .regex(/^\d+$/, 'Mobile must contain only digits'),
    email: z.string().trim().min(1, 'Email is required').email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
    shopName: z.string().trim().min(1, 'Shop Name is required'),
    aadhaarNumber: z
      .string()
      .trim()
      .length(12, 'Aadhaar must be exactly 12 digits')
      .regex(/^\d+$/, 'Aadhaar must contain only digits'),
    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    address: z.string().trim().min(1, 'Address is required'),
    state: z.string().trim().min(1, 'State is required'),
    district: z.string().trim().min(1, 'District is required'),
    pinCode: z
      .string()
      .trim()
      .length(6, 'Pin Code must be exactly 6 digits')
      .regex(/^\d+$/, 'Pin Code must contain only digits'),
    userType: z.nativeEnum(UserType, {
      errorMap: () => ({ message: 'User Type is required and must be a valid UserType' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or Mobile is required'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh Token is required'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
