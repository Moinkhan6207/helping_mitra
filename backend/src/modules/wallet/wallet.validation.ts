import { z } from 'zod';

export const submitVerificationSchema = z.object({
  utr: z
    .string({
      required_error: 'UTR / Transaction Reference is required',
    })
    .trim()
    .min(1, 'UTR / Transaction Reference is required')
    .transform((val) => val.replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .min(12, 'UTR must be at least 12 characters')
        .max(22, 'UTR must be at most 22 characters')
        .regex(/^[a-zA-Z0-9]+$/, 'UTR must contain only letters and numbers')
    ),
  proofStoragePath: z.string().trim().nullable().optional(),
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

export const resubmitVerificationSchema = z.object({
  utr: z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, ''))
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return val.length >= 12 && val.length <= 22 && /^[a-zA-Z0-9]+$/.test(val);
      },
      {
        message: 'UTR must be 12-22 alphanumeric characters',
      }
    ),
  proofStoragePath: z.string().trim().nullable().optional(),
}).refine((data) => data.utr || data.proofStoragePath, {
  message: 'Either UTR or Proof Screenshot must be provided for resubmission',
  path: ['utr'],
});

export type ResubmitVerificationInput = z.infer<typeof resubmitVerificationSchema>;
