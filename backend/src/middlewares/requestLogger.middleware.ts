import { Request, Response, NextFunction } from 'express';

// Set of keys to redact to ensure zero leakage of private credentials in query params, headers, or logs
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'aadhaar',
  'pan',
  'paymentkey',
  'secret',
  'privatekey',
  'firebase',
  'authorization',
  'cvv',
  'cardnumber',
  'pin',
]);

/**
 * Sanitizes object by masking sensitive keys recursively.
 * Can be used in debug logs if body or query logging is enabled in development.
 */
export const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = sanitizeData(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * HTTP Request logger logging method, sanitized URL, response code, and latency in milliseconds.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Scrub query parameters to prevent leakage of credentials passed via URL
    let sanitizedUrl = originalUrl;
    if (originalUrl.includes('?')) {
      try {
        const [pathPart, queryPart] = originalUrl.split('?');
        const searchParams = new URLSearchParams(queryPart);
        let modified = false;

        for (const key of searchParams.keys()) {
          const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (SENSITIVE_KEYS.has(normalizedKey)) {
            searchParams.set(key, '[REDACTED]');
            modified = true;
          }
        }

        if (modified) {
          sanitizedUrl = `${pathPart}?${searchParams.toString()}`;
        }
      } catch {
        // Fallback if parsing fails
        sanitizedUrl = originalUrl.split('?')[0] + '?url_parse_error=true';
      }
    }

    // Console output structure: [HTTP] GET /api/health 200 - 3.42ms
    console.log(`[HTTP] ${method} ${sanitizedUrl} ${statusCode} - ${timeInMs}ms`);
  });

  next();
};
