import { z } from 'zod';

export const approveRechargeSchema = z.object({
  verifiedAmountPaise: z
    .number({
      required_error: 'Verified amount is required',
    })
    .int('Verified amount must be an integer paise')
    .positive('Verified amount must be a positive number'),
  paymentDate: z
    .string({
      required_error: 'Payment date is required',
    })
    .datetime({
      message: 'Payment date must be a valid ISO-8601 datetime string',
    }),
  receivingAccountId: z
    .string({
      required_error: 'Receiving account ID is required',
    })
    .trim()
    .min(1, 'Receiving account ID is required'),
  adminRemarks: z.string().trim().optional().nullable(),
});

export const rejectRechargeSchema = z.object({
  rejectionReason: z
    .string({
      required_error: 'Rejection reason is required',
    })
    .trim()
    .min(10, 'Rejection reason must be at least 10 characters long'),
});

export type ApproveRechargeInput = z.infer<typeof approveRechargeSchema>;
export type RejectRechargeInput = z.infer<typeof rejectRechargeSchema>;

export const adjustWalletSchema = z.object({
  userId: z
    .string({
      required_error: 'User ID is required',
    })
    .uuid('User ID must be a valid UUID'),
  amountPaise: z
    .number({
      required_error: 'Adjustment amount in paise is required',
    })
    .int('Amount must be an integer paise'),
  remarks: z
    .string({
      required_error: 'A reason for adjustment is required',
    })
    .trim()
    .min(10, 'Adjustment remarks must be at least 10 characters long'),
});

export type AdjustWalletInput = z.infer<typeof adjustWalletSchema>;

