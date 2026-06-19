import { ALLOWED_MIME_TYPES } from './firebase.constants';

/** Allowed MIME type union derived from constant array. */
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Metadata stored for each uploaded document.
 * Never stores a public download URL — only the Firebase Storage path.
 */
export interface UploadMetadata {
  /** Firebase Storage path e.g. /users/usr_001/temp/upl_001/aadhaar_card-1753200000.pdf */
  storagePath: string;
  /** Original filename e.g. aadhaar-card.pdf */
  fileName: string;
  /** MIME type e.g. application/pdf */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Semantic document key matching the ServiceDocumentRequirement.documentKey */
  documentKey: string;
}

/** Result returned from backend metadata validation. */
export interface UploadValidationResult {
  isValid: boolean;
  errors: Array<{ documentKey: string; message: string }>;
}

/** Shape of the uploads map stored in form/component state on the frontend. */
export type DocumentUploadsMap = Record<string, UploadMetadata | null>;
