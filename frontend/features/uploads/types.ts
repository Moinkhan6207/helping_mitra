/** Allowed file MIME types for document uploads */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Maximum upload size in bytes (from environment configuration) */
export const MAX_FILE_SIZE_BYTES =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAX_FILE_SIZE_BYTES
    ? parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_BYTES, 10)
    : 5 * 1024 * 1024; // fallback to 5 MB

/** Upload lifecycle state */
export type UploadStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

/**
 * Metadata stored in component state for each uploaded file.
 * Never stores a public URL — only the Firebase Storage path.
 */
export interface UploadMetadata {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  documentKey: string;
}

/** Per-document upload state tracked in the hook */
export interface UploadState {
  status: UploadStatus;
  progress: number; // 0–100
  metadata: UploadMetadata | null;
  error: string | null;
  previewUrl: string | null; // object URL for image previews (revoked on remove)
}

/** Map of documentKey → UploadState for a whole upload session */
export type DocumentUploadsStateMap = Record<string, UploadState>;

/** All upload metadata ready for submission — nulls indicate missing required docs */
export type DocumentMetadataMap = Record<string, UploadMetadata | null>;
