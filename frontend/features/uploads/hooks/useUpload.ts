'use client';

import { useState, useCallback, useRef } from 'react';
import axiosClient from '@/lib/axios';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UploadMetadata,
  UploadState,
  DocumentUploadsStateMap,
} from '../types';

const INITIAL_STATE: UploadState = {
  status: 'idle',
  progress: 0,
  metadata: null,
  error: null,
  previewUrl: null,
};

/**
 * useUpload — Document Upload Hook
 *
 * Manages upload lifecycle (validate → upload → success/error → remove) for a
 * set of document keys associated with a service application.
 *
 * Standardized to upload files via the backend API.
 */
export function useUpload(documentKeys: string[], userId: string) {
  const initialState: DocumentUploadsStateMap = {};
  documentKeys.forEach((k) => {
    initialState[k] = { ...INITIAL_STATE };
  });

  const [uploadStates, setUploadStates] = useState<DocumentUploadsStateMap>(initialState);
  const previewUrls = useRef<Record<string, string>>({});
  const uploadSessionId = useRef(`upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const setDocState = useCallback((key: string, patch: Partial<UploadState>) => {
    setUploadStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
  }, []);

  /**
   * Validates file type and size before upload.
   * Returns error message or null if valid.
   */
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return `Invalid file type "${file.type}". Allowed: PDF, JPG, JPEG, PNG only.`;
    }
    if (file.size === 0) {
      return `File "${file.name}" is empty or corrupted.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File "${file.name}" exceeds the 5 MB maximum size limit.`;
    }
    return null;
  };

  /**
   * Upload a file for a specific document key.
   */
  const uploadFile = useCallback(
    async (documentKey: string, file: File) => {
      // Validate first
      const validationError = validateFile(file);
      if (validationError) {
        setDocState(documentKey, { status: 'error', error: validationError, progress: 0 });
        return;
      }

      setDocState(documentKey, { status: 'uploading', progress: 0, error: null });

      // Build image preview URL for image types
      let previewUrl: string | null = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        previewUrls.current[documentKey] = previewUrl;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadSessionId', uploadSessionId.current);
        formData.append('documentKey', documentKey);

        const response = await axiosClient.post('/uploads/document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setDocState(documentKey, { progress: pct });
            }
          },
        });

        const metadata = response.data.data;
        setDocState(documentKey, {
          status: 'success',
          progress: 100,
          metadata,
          previewUrl,
        });
      } catch (err: any) {
        console.error('Upload error:', err);
        const errMsg = err?.message || 'Upload failed. Please try again.';
        setDocState(documentKey, {
          status: 'error',
          error: errMsg,
          progress: 0,
        });
      }
    },
    [userId, setDocState]
  );

  /**
   * Remove an uploaded file — deletes from API and resets state.
   */
  const removeFile = useCallback(
    async (documentKey: string) => {
      const state = uploadStates[documentKey];
      if (!state?.metadata) return;

      const { storagePath } = state.metadata;

      // Revoke object URL to avoid memory leak
      if (previewUrls.current[documentKey]) {
        URL.revokeObjectURL(previewUrls.current[documentKey]);
        delete previewUrls.current[documentKey];
      }

      // Reset UI immediately for responsiveness
      setDocState(documentKey, { ...INITIAL_STATE });

      try {
        await axiosClient.delete('/uploads/document', {
          params: { storagePath },
        });
      } catch (err) {
        // Ignore not-found errors (already deleted or never existed)
        console.warn('Could not delete file from storage:', err);
      }
    },
    [uploadStates, setDocState]
  );

  /** Returns a map of documentKey → UploadMetadata | null for form submission */
  const getMetadataMap = useCallback((): Record<string, UploadMetadata | null> => {
    const map: Record<string, UploadMetadata | null> = {};
    documentKeys.forEach((key) => {
      map[key] = uploadStates[key]?.metadata ?? null;
    });
    return map;
  }, [documentKeys, uploadStates]);

  /** Returns true if all required document keys have been successfully uploaded */
  const allRequiredUploaded = useCallback(
    (requiredKeys: string[]): boolean => {
      return requiredKeys.every((key) => uploadStates[key]?.status === 'success');
    },
    [uploadStates]
  );

  return {
    uploadStates,
    uploadFile,
    removeFile,
    getMetadataMap,
    allRequiredUploaded,
  };
}
