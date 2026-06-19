import { firebaseService } from '../firebase/firebase.service';
import { UploadMetadata, UploadValidationResult } from '../firebase/firebase.types';
import { prisma } from '../../config/database';

/**
 * Validates uploaded document metadata for a service application.
 *
 * Steps:
 * 1. Fetch required document keys from the database for this service.
 * 2. Delegate each uploaded file's metadata to FirebaseService for full validation.
 * 3. Return structured errors for any missing or invalid documents.
 */
export async function validateServiceDocuments(
  serviceId: string,
  userId: string,
  uploads: Record<string, UploadMetadata | null>
): Promise<UploadValidationResult> {
  // Fetch the required document keys from the database
  const requiredDocs = await prisma.serviceDocumentRequirement.findMany({
    where: { serviceId, isRequired: true },
    select: { documentKey: true },
    orderBy: { displayOrder: 'asc' },
  });

  const requiredKeys = requiredDocs.map((d: { documentKey: string }) => d.documentKey);

  // No required documents for this service — skip validation
  if (requiredKeys.length === 0) {
    return { isValid: true, errors: [] };
  }

  return firebaseService.validateDocumentUploads(userId, requiredKeys, uploads);
}
