import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { env } from '../../config/env';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MOCK_CREDENTIAL_PREFIX,
  TEMP_PATH_REGEX,
} from './firebase.constants';
import { UploadMetadata, UploadValidationResult } from './firebase.types';
import { isPathOwnedByUser } from './firebase.utils';

/**
 * FirebaseService — Singleton
 *
 * Lazy-initialises the Firebase Admin SDK on first use.
 * Detects mock credentials (values starting with "mock_") and automatically
 * enters MOCK MODE, skipping real bucket operations so the app runs locally
 * without a real Firebase project.
 */
class FirebaseService {
  private static instance: FirebaseService;
  private app: App | null = null;
  private isMockMode: boolean = false;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Lazy init. Called automatically before any operation.
   */
  private init(): void {
    if (this.app) return;

    const projectId = env.FIREBASE_PROJECT_ID ?? '';
    const clientEmail = env.FIREBASE_CLIENT_EMAIL ?? '';
    const privateKey = env.FIREBASE_PRIVATE_KEY ?? '';
    const storageBucket = env.FIREBASE_STORAGE_BUCKET ?? '';

    // Detect mock mode: env.FIREBASE_MOCK_MODE or any credential starting with "mock_" triggers simulation
    if (
      env.FIREBASE_MOCK_MODE ||
      projectId.startsWith(MOCK_CREDENTIAL_PREFIX) ||
      clientEmail.startsWith(MOCK_CREDENTIAL_PREFIX) ||
      privateKey.startsWith(MOCK_CREDENTIAL_PREFIX) ||
      storageBucket.startsWith(MOCK_CREDENTIAL_PREFIX)
    ) {
      this.isMockMode = true;
      console.warn(
        '⚠️  FirebaseService: Running in MOCK MODE. ' +
          'Upload operations will be simulated. ' +
          'Replace credentials in .env for production use.'
      );
      return;
    }

    // Validate all required credentials are present
    if (!projectId || !clientEmail || !privateKey || !storageBucket) {
      throw new Error(
        'FirebaseService: Missing required environment variables. ' +
          'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, ' +
          'FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET in .env'
      );
    }

    try {
      // Avoid re-initialising if already done (e.g. hot reload)
      if (getApps().length > 0) {
        this.app = getApps()[0]!;
      } else {
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            // Replace literal \n escapes from environment variable strings
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
          storageBucket,
        });
      }
      console.log('✅ FirebaseService: Admin SDK initialised.');
    } catch (error) {
      console.error('❌ FirebaseService: Admin SDK initialisation failed.', error);
      throw error;
    }
  }

  /**
   * Returns true when operating in mock / simulation mode.
   */
  get mockMode(): boolean {
    this.init();
    return this.isMockMode;
  }

  /**
   * Validates upload metadata submitted by the frontend.
   *
   * Checks:
   * 1. Storage path format matches /users/{userId}/temp/... regex
   * 2. Path belongs to the authenticated user (ownership check)
   * 3. File size does not exceed MAX_FILE_SIZE_BYTES (5 MB)
   * 4. MIME type is in the allowlist
   * 5. Document key is in the list of allowed keys for this service
   * 6. File actually exists in Firebase Storage (skipped in mock mode)
   */
  async validateUploadMetadata(
    userId: string,
    allowedDocumentKeys: string[],
    metadata: UploadMetadata
  ): Promise<{ valid: boolean; error?: string }> {
    this.init();

    // 1. Path format
    if (!TEMP_PATH_REGEX.test(metadata.storagePath)) {
      return { valid: false, error: `Invalid storage path format for "${metadata.documentKey}"` };
    }

    // 2. Ownership — path must start with /users/{userId}/
    if (!isPathOwnedByUser(metadata.storagePath, userId)) {
      return {
        valid: false,
        error: `Storage path ownership mismatch for "${metadata.documentKey}". Access denied.`,
      };
    }

    // 3. File size
    if (metadata.fileSize <= 0) {
      return {
        valid: false,
        error: `File "${metadata.fileName}" is empty or corrupted.`,
      };
    }
    if (metadata.fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File "${metadata.fileName}" exceeds the 5 MB size limit.`,
      };
    }

    // 4. MIME type
    if (!ALLOWED_MIME_TYPES.includes(metadata.mimeType as any)) {
      return {
        valid: false,
        error: `File type "${metadata.mimeType}" is not allowed for "${metadata.documentKey}".`,
      };
    }

    // 5. Document key whitelist
    if (!allowedDocumentKeys.includes(metadata.documentKey)) {
      return {
        valid: false,
        error: `Document key "${metadata.documentKey}" is not required for this service.`,
      };
    }

    // 6. File existence check (production only)
    if (!this.isMockMode && this.app) {
      try {
        const bucket = getStorage(this.app).bucket();
        // storagePath starts with /, bucket paths do not
        const filePath = metadata.storagePath.replace(/^\//, '');
        const [exists] = await bucket.file(filePath).exists();
        if (!exists) {
          return {
            valid: false,
            error: `Uploaded file for "${metadata.documentKey}" not found in storage. Please re-upload.`,
          };
        }
      } catch (err) {
        console.error('FirebaseService: File existence check failed.', err);
        return {
          valid: false,
          error: `Storage verification failed for "${metadata.documentKey}".`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validates a full set of document uploads against required keys.
   */
  async validateDocumentUploads(
    userId: string,
    requiredKeys: string[],
    uploads: Record<string, UploadMetadata | null>
  ): Promise<UploadValidationResult> {
    this.init();

    const errors: Array<{ documentKey: string; message: string }> = [];
    const allowedKeys = Object.keys(uploads);

    for (const key of requiredKeys) {
      const meta = uploads[key];
      if (!meta) {
        errors.push({ documentKey: key, message: `Document "${key}" is required but was not uploaded.` });
        continue;
      }

      const result = await this.validateUploadMetadata(userId, allowedKeys, meta);
      if (!result.valid) {
        errors.push({ documentKey: key, message: result.error! });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Helper to ensure all storage paths are normalized to include the /helping-mitra prefix
   */
  private normalizePath(storagePath: string): string {
    if (!storagePath.startsWith('/helping-mitra') && !storagePath.startsWith('helping-mitra')) {
      const cleanPath = storagePath.startsWith('/') ? storagePath : `/${storagePath}`;
      return `/helping-mitra${cleanPath}`;
    }
    return storagePath;
  }

  /**
   * Deletes a file from Firebase Storage.
   * In mock mode, this is a no-op.
   */
  async deleteFile(storagePath: string): Promise<void> {
    this.init();
    const normalizedPath = this.normalizePath(storagePath);
    if (this.isMockMode) {
      console.log(`[MOCK] FirebaseService.deleteFile: ${normalizedPath}`);
      return;
    }

    if (!this.app) return;

    try {
      const bucket = getStorage(this.app).bucket();
      const filePath = normalizedPath.replace(/^\//, '');
      await bucket.file(filePath).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error('FirebaseService: Failed to delete file.', err);
    }
  }

  /**
   * Architecture skeleton for orphan cleanup (Phase 4+).
   * Finds temp uploads older than the given TTL and deletes them.
   */
  async cleanupOrphanUploads(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    this.init();
    if (this.isMockMode) {
      console.log('[MOCK] FirebaseService.cleanupOrphanUploads: skipped in mock mode');
      return;
    }

    // TODO Phase 4: List files in /users/*/temp/ and delete those older than olderThanMs
    console.warn('FirebaseService.cleanupOrphanUploads: Not yet fully implemented.');
  }

  /**
   * Generates a temporary signed URL for a private storage path.
   * Supports standard Firebase Admin getSignedUrl in production and mock URL in mock mode.
   */
  async getSignedUrl(storagePath: string, expiresMinutes = 15, fileName?: string): Promise<string> {
    this.init();
    const normalizedPath = this.normalizePath(storagePath);
    if (this.isMockMode) {
      return `https://mock-storage.googleapis.com${normalizedPath}?expires=${Date.now() + expiresMinutes * 60 * 1000}&mock=true${fileName ? `&download=${encodeURIComponent(fileName)}` : ''}`;
    }

    if (!this.app) {
      throw new Error('Firebase Service is not initialised.');
    }

    const bucket = getStorage(this.app).bucket();
    const filePath = normalizedPath.replace(/^\//, '');
    const file = bucket.file(filePath);

    const options: any = {
      action: 'read',
      expires: Date.now() + expiresMinutes * 60 * 1000,
    };

    if (fileName) {
      // Set GCS response header to force attachment download with correct file name
      const escapedFileName = encodeURIComponent(fileName);
      options.responseDisposition = `attachment; filename="${escapedFileName}"; filename*=UTF-8''${escapedFileName}`;
    }

    const [url] = await file.getSignedUrl(options);

    return url;
  }

  /**
   * Uploads a result file to Firebase Storage.
   * In mock mode, this is a no-op that simulates file uploading.
   */
  async uploadResultFile(
    orderId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ storagePath: string; fileName: string }> {
    this.init();
    const storagePath = `/results/${orderId}/${fileName}`;
    if (this.isMockMode) {
      console.log(`[MOCK] FirebaseService.uploadResultFile: Uploaded file to ${storagePath}`);
      return { storagePath, fileName };
    }

    if (!this.app) {
      throw new Error('Firebase Service is not initialised.');
    }

    const bucket = getStorage(this.app).bucket();
    const filePath = storagePath.replace(/^\//, '');
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
      },
      resumable: false,
    });

    return { storagePath, fileName };
  }

  /**
   * Downloads the first 16 bytes of a storage path file to check its magic numbers.
   */
  async getFileSignature(storagePath: string): Promise<Buffer> {
    this.init();
    const normalizedPath = this.normalizePath(storagePath);
    if (this.isMockMode) {
      // Simulate file signature based on file extension
      const ext = normalizedPath.split('.').pop()?.toLowerCase() ?? '';
      if (ext === 'pdf') return Buffer.from('%PDF-1.5');
      if (ext === 'png') return Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (ext === 'jpg' || ext === 'jpeg') return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      return Buffer.alloc(16);
    }

    if (!this.app) {
      throw new Error('Firebase Service is not initialised.');
    }

    try {
      const bucket = getStorage(this.app).bucket();
      const file = bucket.file(normalizedPath.replace(/^\//, ''));
      const [buffer] = await file.download({ start: 0, end: 15 });
      return buffer;
    } catch (err) {
      console.error('FirebaseService: Failed to download file signature.', err);
      throw new Error('Failed to retrieve file signature from storage.');
    }
  }

  /**
   * Uploads a file buffer directly to Firebase Storage.
   */
  async uploadFile(storagePath: string, buffer: Buffer, contentType: string): Promise<void> {
    this.init();
    const normalizedPath = this.normalizePath(storagePath);
    if (this.isMockMode) {
      throw new Error('Firebase Service is in Mock Mode. Uploads to real Firebase Storage are required.');
    }

    if (!this.app) {
      throw new Error('Firebase Service is not initialised.');
    }

    try {
      const bucket = getStorage(this.app).bucket();
      const file = bucket.file(normalizedPath.replace(/^\//, ''));
      await file.save(buffer, {
        metadata: {
          contentType,
        },
        resumable: false,
      });
      console.log(`FirebaseService: Uploaded file to ${normalizedPath}`);
    } catch (err) {
      console.error('FirebaseService: Failed to upload file to storage.', err);
      throw new Error('Storage upload operation failed.');
    }
  }

  /**
   * Copies a file from temporary upload location to a permanent location and deletes the temporary file.
   */
  async moveResultFile(tempPath: string, finalPath: string): Promise<void> {
    this.init();
    const normalizedTempPath = this.normalizePath(tempPath);
    const normalizedFinalPath = this.normalizePath(finalPath);
    if (this.isMockMode) {
      console.log(`[MOCK] FirebaseService.moveResultFile: Moved ${normalizedTempPath} -> ${normalizedFinalPath}`);
      return;
    }

    if (!this.app) {
      throw new Error('Firebase Service is not initialised.');
    }

    try {
      const bucket = getStorage(this.app).bucket();
      const srcFile = bucket.file(normalizedTempPath.replace(/^\//, ''));
      const destFile = bucket.file(normalizedFinalPath.replace(/^\//, ''));
      await srcFile.copy(destFile);
      await srcFile.delete();
      console.log(`FirebaseService: Moved file from ${normalizedTempPath} to ${normalizedFinalPath}`);
    } catch (err) {
      console.error('FirebaseService: Failed to move file in storage.', err);
      throw new Error('Storage copy/move operation failed.');
    }
  }

  /**
   * Automatically deletes unlinked temporary result uploads older than the specified hour window.
   */
  async cleanupTempResultUploads(olderThanHours = 24): Promise<number> {
    this.init();
    if (this.isMockMode) {
      console.log(`[MOCK] FirebaseService.cleanupTempResultUploads: simulated execution`);
      return 0;
    }

    if (!this.app) return 0;

    try {
      const bucket = getStorage(this.app).bucket();
      // List all files starting with "admin/" prefix
      const [files] = await bucket.getFiles({ prefix: 'admin/' });
      const now = Date.now();
      const maxAgeMs = olderThanHours * 60 * 60 * 1000;
      let deleteCount = 0;

      for (const file of files) {
        // Look for result files in temp folders: /admin/{adminId}/temp/order-results/{uploadSessionId}/{filename}
        if (file.name.includes('/temp/order-results/')) {
          const [metadata] = await file.getMetadata();
          const time = new Date(metadata.updated || metadata.timeCreated || '').getTime();
          if (now - time > maxAgeMs) {
            await file.delete();
            deleteCount++;
          }
        }
      }

      return deleteCount;
    } catch (err) {
      console.error('FirebaseService: Failed to clean up temporary result files.', err);
      return 0;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
