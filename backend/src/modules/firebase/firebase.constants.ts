/**
 * Firebase Storage Upload Engine — Constants
 * All upload constraints are defined here.
 * Never trust the frontend — always re-validate on backend.
 */

/** Allowed MIME types for document uploads. */
import { env } from '../../config/env';

/** Allowed MIME types for document uploads. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

/** Display-friendly allowed extensions. */
export const ALLOWED_EXTENSIONS = ['PDF', 'JPG', 'JPEG', 'PNG'];

/** Maximum upload size in bytes. */
export const MAX_FILE_SIZE_BYTES = env.MAX_FILE_SIZE_BYTES;

/**
 * Temporary storage path format:
 * /helping-mitra/users/{userId}/temp/{uploadSessionId}/{documentKey}-{timestamp}.{ext}
 */
export const TEMP_PATH_REGEX =
  /^\/helping-mitra\/users\/([^/]+)\/temp\/([^/]+)\/([^/]+)-(\d+)\.[a-z]+$/i;

/**
 * Future production path format (for reference):
 * /helping-mitra/users/{userId}/orders/{orderId}/documents/{documentKey}-{timestamp}.{ext}
 */
export const ORDER_PATH_REGEX =
  /^\/helping-mitra\/users\/([^/]+)\/orders\/([^/]+)\/documents\/([^/]+)-(\d+)\.[a-z]+$/i;

/** Indicator string that marks mock Firebase credentials. */
export const MOCK_CREDENTIAL_PREFIX = 'mock_';
