'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { buildConsentText } from '../components/ConsentCheckbox';
import { UploadMetadata } from '../../uploads/types';
import { useAuthStore } from '@/features/auth/authStore';

interface UseOrderSubmitOptions {
  serviceId: string;
  serviceName: string;
  amount: number;
}

interface SubmitPayload {
  fieldValues: { fieldKey: string; fieldLabel: string; value: string }[];
  documents: (UploadMetadata & { documentLabel: string })[];
  consentGiven: boolean;
  generatedPdf?: {
    fileName: string;
    storagePath: string;
    fileSize: number;
    fileType: string;
  } | null;
}

interface OrderSubmitResult {
  orderId: string;
}

export function useOrderSubmit({ serviceId, serviceName, amount }: UseOrderSubmitOptions) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  // Stable idempotency key — generated once per hook mount
  // Re-generating on each submit attempt would break idempotency for network retries
  const [idempotencyKey] = useState<string>(() => uuidv4());

  const submit = useCallback(
    async ({ fieldValues, documents, consentGiven, generatedPdf }: SubmitPayload) => {
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const consentText = buildConsentText(serviceName, amount);

        const payload = {
          idempotencyKey,
          serviceId,
          serviceName,
          amount,
          consentGiven,
          consentText,
          fieldValues,
          documents: documents.map((d) => ({
            documentKey: d.documentKey,
            documentName: d.documentLabel,
            fileName: d.fileName,
            storagePath: d.storagePath,
            fileSize: d.fileSize,
            fileType: d.mimeType,
          })),
          generatedPdf: generatedPdf || null,
        };

        const token = useAuthStore.getState().accessToken;

        const response = await fetch('/api/proxy/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle validation errors array
          if (data.errors && Array.isArray(data.errors)) {
            const msg = data.errors.map((e: any) => e.message).join(', ');
            throw new Error(msg);
          }
          throw new Error(data.message ?? 'Order submission failed. Please try again.');
        }

        const orderId = data.data?.orderId;
        setSuccessOrderId(orderId);
        return { orderId } as OrderSubmitResult;
      } catch (err: any) {
        setSubmitError(err.message ?? 'An unexpected error occurred.');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [idempotencyKey, serviceId, serviceName, amount]
  );

  return {
    submit,
    isSubmitting,
    submitError,
    successOrderId,
    clearError: () => setSubmitError(null),
  };
}
