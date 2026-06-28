import { TEMP_PATH_REGEX } from './firebase.constants';

/**
 * Parses a Firebase Storage temporary path and extracts its parts.
 *
 * Expected format:
 * /users/{userId}/temp/{uploadSessionId}/{documentKey}-{timestamp}.{ext}
 */
export function parseTempPath(storagePath: string): {
  userId: string;
  uploadSessionId: string;
  documentKey: string;
  timestamp: string;
  extension: string;
} | null {
  const match = storagePath.match(TEMP_PATH_REGEX);
  if (!match) return null;

  const [, userId, uploadSessionId, documentKey, timestamp] = match;
  const extension = storagePath.split('.').pop() ?? '';

  return { userId, uploadSessionId, documentKey, timestamp, extension };
}

/**
 * Checks whether a storage path belongs to the authenticated user.
 *
 * Security rule: /users/{userId}/... must start with the requesting user's ID.
 */
export function isPathOwnedByUser(storagePath: string, userId: string): boolean {
  const parts = parseTempPath(storagePath);
  return parts !== null && parts.userId === userId;
}

/**
 * Returns a safe upload session ID based on current timestamp and random suffix.
 * Format: upl_{timestamp}_{random6chars}
 */
export function generateUploadSessionId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `upl_${ts}_${rand}`;
}

/**
 * Builds a temporary Firebase Storage path.
 * Format: /users/{userId}/temp/{sessionId}/{documentKey}-{timestamp}.{ext}
 */
export function buildTempPath(
  userId: string,
  sessionId: string,
  documentKey: string,
  extension: string
): string {
  const ts = Date.now();
  return `/helping-mitra/users/${userId}/temp/${sessionId}/${documentKey}-${ts}.${extension.toLowerCase()}`;
}

/**
 * Builds the final production order path (for future Phase 4 use).
 * Format: /helping-mitra/users/{userId}/orders/{orderId}/documents/{documentKey}-{timestamp}.{ext}
 */
export function buildOrderPath(
  userId: string,
  orderId: string,
  documentKey: string,
  extension: string
): string {
  const ts = Date.now();
  return `/helping-mitra/users/${userId}/orders/${orderId}/documents/${documentKey}-${ts}.${extension.toLowerCase()}`;
}
