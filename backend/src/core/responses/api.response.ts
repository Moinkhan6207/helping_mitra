import { Response } from 'express';
import { SuccessResponse, ErrorResponse } from '../types';

/**
 * Standardized utility helper to send a successful HTTP response.
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200
): Response => {
  const payload: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(payload);
};

/**
 * Standardized utility helper to send an error HTTP response.
 */
export const sendError = (
  res: Response,
  message: string,
  code: string,
  details: any = null,
  statusCode: number = 500
): Response => {
  const payload: ErrorResponse = {
    success: false,
    message,
    error: {
      code,
      details,
    },
  };
  return res.status(statusCode).json(payload);
};
