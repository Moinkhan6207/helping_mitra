'use client';

import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { storage, isFirebaseMockMode } from '@/lib/firebase';
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
 * Works in both MOCK MODE (simulated timers) and PRODUCTION MODE (Firebase).
 */
export function useUpload(documentKeys: string[], userId: string) {
  const initialState: DocumentUploadsStateMap = {};
  documentKeys.forEach((k) => { initialState[k] = { ...INITIAL_STATE }; });

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

      const extension = file.name.split('.').pop() ?? 'bin';
      const storagePath = `/users/${userId}/temp/${uploadSessionId.current}/${documentKey}-${Date.now()}.${extension.toLowerCase()}`;

      if (isFirebaseMockMode) {
        // ── MOCK MODE: simulate upload with a timer ──────────────────────────
        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 10, 100);
          setDocState(documentKey, { progress });
          if (progress >= 100) {
            clearInterval(interval);
            const metadata: UploadMetadata = {
              storagePath,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              documentKey,
            };
            setDocState(documentKey, {
              status: 'success',
              progress: 100,
              metadata,
              previewUrl,
            });
          }
        }, 80);
        return;
      }

      // ── PRODUCTION MODE: real Firebase Storage upload ─────────────────────
      if (!storage) {
        setDocState(documentKey, {
          status: 'error',
          error: 'Firebase Storage is not initialized. Please contact support.',
        });
        return;
      }

      try {
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setDocState(documentKey, { progress: pct });
          },
          (error) => {
            console.error('Upload error:', error);
            setDocState(documentKey, {
              status: 'error',
              error: `Upload failed: ${error.message}`,
              progress: 0,
            });
          },
          () => {
            const metadata: UploadMetadata = {
              storagePath,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              documentKey,
            };
            setDocState(documentKey, {
              status: 'success',
              progress: 100,
              metadata,
              previewUrl,
            });
          }
        );
      } catch (err: any) {
        setDocState(documentKey, {
          status: 'error',
          error: err?.message ?? 'Upload failed. Please try again.',
          progress: 0,
        });
      }
    },
    [userId, setDocState]
  );

  /**
   * Remove an uploaded file — deletes from Firebase Storage (or mock) and resets state.
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

      if (!isFirebaseMockMode && storage) {
        try {
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
        } catch (err) {
          // Ignore not-found errors (already deleted or never existed)
          console.warn('Could not delete file from storage:', err);
        }
      } else {
        console.log(`[MOCK] Removed file: ${storagePath}`);
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
