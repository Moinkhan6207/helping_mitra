import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { activeUserMiddleware } from '../../middlewares/activeUser.middleware';
import { BadRequestError, ForbiddenError } from '../../core/errors/app.error';
import { firebaseService } from '../firebase/firebase.service';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../firebase/firebase.constants';
import { isPathOwnedByUser } from '../firebase/firebase.utils';

const router = Router();

// Multer memory storage with dynamic size limit from env
const storageMulter = multer.memoryStorage();
const upload = multer({
  storage: storageMulter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('file');

// Middleware to handle Multer file size errors nicely
function handleMulterError(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        const limitKb = Math.round(MAX_FILE_SIZE_BYTES / 1024);
        return next(new BadRequestError(`File size exceeds the ${limitKb} KB limit.`, 'LIMIT_FILE_SIZE'));
      }
      return next(err);
    }
    next();
  });
}

/**
 * Validate file content signatures (magic numbers) to detect corruption or renamed files.
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    // PDF: %PDF-
    return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF';
  }
  if (mimeType === 'image/png') {
    // PNG: 89 50 4E 47
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    // JPEG/JPG: FF D8 FF
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  return false;
}

/**
 * POST /api/uploads/document
 * Upload and optimize a document file to the real Firebase Storage temp location.
 */
router.post(
  '/document',
  authMiddleware,
  activeUserMiddleware,
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { uploadSessionId, documentKey } = req.body;

      if (!uploadSessionId || !documentKey) {
        throw new BadRequestError('uploadSessionId and documentKey are required fields.');
      }

      const multerReq = req as any;
      if (!multerReq.file) {
        const limitKb = Math.round(MAX_FILE_SIZE_BYTES / 1024);
        throw new BadRequestError(`No file uploaded or file exceeds the ${limitKb} KB limit.`);
      }

      const file = multerReq.file;

      // 1. File size check (empty file)
      if (file.size === 0) {
        throw new BadRequestError(`File "${file.originalname}" is empty or corrupted.`);
      }

      // 2. MIME type whitelist check
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
        throw new BadRequestError(
          `File type "${file.mimetype}" is not allowed. Supported types: PDF, JPG, JPEG, PNG.`,
          'INVALID_MIME_TYPE'
        );
      }

      // 3. File content integrity (magic numbers signature check)
      if (!validateFileSignature(file.buffer, file.mimetype)) {
        throw new BadRequestError(
          `File content validation failed for "${file.originalname}". The file is corrupted or its type signature is invalid.`,
          'INVALID_FILE_SIGNATURE'
        );
      }

      // 4. Optimization step (Image / PDF)
      let optimizedBuffer = file.buffer;
      if (file.mimetype.startsWith('image/')) {
        try {
          let sharpImg = sharp(file.buffer);
          const meta = await sharpImg.metadata();
          
          // Resize if required (max width 1200px to maintain readability while keeping file lightweight)
          if (meta.width && meta.width > 1200) {
            sharpImg = sharpImg.resize({ width: 1200, withoutEnlargement: true });
          }
          
          // Compress quality & strip metadata (sharp strips EXIF metadata unless .withMetadata() is explicitly called)
          if (file.mimetype === 'image/png') {
            optimizedBuffer = await sharpImg.png({ compressionLevel: 8, palette: true }).toBuffer();
          } else {
            optimizedBuffer = await sharpImg.jpeg({ quality: 80, progressive: true }).toBuffer();
          }
        } catch (imgErr) {
          console.error('Image optimization failed, falling back to original buffer:', imgErr);
        }
      } else if (file.mimetype === 'application/pdf') {
        try {
          const pdfDoc = await PDFDocument.load(file.buffer);
          
          // Strip unnecessary metadata
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
          
          const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
          const compressedBuffer = Buffer.from(compressedBytes);
          
          // Fallback to original PDF if compression results in no benefit
          if (compressedBuffer.length < file.buffer.length) {
            optimizedBuffer = compressedBuffer;
          }
        } catch (pdfErr) {
          console.error('PDF optimization failed, falling back to original buffer:', pdfErr);
        }
      }

      // 5. Generate storage path: /helping-mitra/users/{userId}/temp/{uploadSessionId}/{documentKey}-{timestamp}.{ext} or admin results path
      let storagePath = '';
      if (req.user!.role === 'ADMIN' && documentKey === 'order-results') {
        storagePath = `/helping-mitra/admin/${userId}/temp/order-results/${uploadSessionId}/${file.originalname}`;
      } else {
        const extension = file.originalname.split('.').pop() ?? 'bin';
        const timestamp = Date.now();
        storagePath = `/helping-mitra/users/${userId}/temp/${uploadSessionId}/${documentKey}-${timestamp}.${extension.toLowerCase()}`;
      }

      // 6. Upload directly to real Firebase Storage bucket (Never mock)
      await firebaseService.uploadFile(storagePath, optimizedBuffer, file.mimetype);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully.',
        data: {
          storagePath,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: optimizedBuffer.length,
          documentKey,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/uploads/document
 * Remove an uploaded temporary file from storage.
 */
router.delete(
  '/document',
  authMiddleware,
  activeUserMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { storagePath } = req.query;

      if (!storagePath || typeof storagePath !== 'string') {
        throw new BadRequestError('storagePath is required.');
      }

      // Enforce ownership check (admins can delete their /admin/temp files, users their /users/temp files)
      const isAdminPath = storagePath.startsWith(`/helping-mitra/admin/${userId}/temp/`);
      const isUserPath = isPathOwnedByUser(storagePath, userId);
      if (!isAdminPath && !isUserPath) {
        throw new ForbiddenError('Access Denied. You do not own this file.');
      }

      await firebaseService.deleteFile(storagePath);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
