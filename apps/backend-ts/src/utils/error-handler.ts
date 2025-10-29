/**
 * Standardized Error Handling System
 * 
 * Implements consistent error response format across all handlers
 * Part of Q1 2025 Priority Actions from ANALISI_STRATEGICA_ARCHITETTURA.md
 * 
 * @module utils/error-handler
 */

import type { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.js';

/**
 * Standard error response format
 */
export interface StandardErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    type: 'USER_ERROR' | 'SYSTEM_ERROR' | 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT_ERROR';
    details?: any;
    requestId?: string;
    timestamp: string;
  };
}

/**
 * Error codes enum for consistent error handling
 */
export enum ErrorCode {
  // User Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  type: StandardErrorResponse['error']['type'] = 'SYSTEM_ERROR',
  details?: any,
  requestId?: string
): StandardErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message,
      type,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Map HTTP status to error type
 */
function getErrorType(statusCode: number): StandardErrorResponse['error']['type'] {
  if (statusCode >= 400 && statusCode < 500) {
    if (statusCode === 401) return 'AUTH_ERROR';
    if (statusCode === 403) return 'AUTH_ERROR';
    if (statusCode === 422) return 'VALIDATION_ERROR';
    if (statusCode === 429) return 'RATE_LIMIT_ERROR';
    return 'USER_ERROR';
  }
  return 'SYSTEM_ERROR';
}

/**
 * Map HTTP status to error code
 */
function getErrorCode(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400: return ErrorCode.BAD_REQUEST;
    case 401: return ErrorCode.UNAUTHORIZED;
    case 403: return ErrorCode.FORBIDDEN;
    case 404: return ErrorCode.NOT_FOUND;
    case 422: return ErrorCode.VALIDATION_ERROR;
    case 429: return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 503: return ErrorCode.SERVICE_UNAVAILABLE;
    default: return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}

/**
 * Global error handler middleware
 * Standardizes all error responses
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).requestId || 'unknown';
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Determine error code and type
  const errorCode = err.errorCode || getErrorCode(statusCode);
  const errorType = err.errorType || getErrorType(statusCode);
  
  // Get error message
  const message = err.message || 'An unexpected error occurred';
  
  // Sanitize error details for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const details = isDevelopment && err.details ? err.details : undefined;
  
  // Log error
  logger.error('Request error', {
    requestId,
    errorCode,
    errorType,
    statusCode,
    message,
    path: req.path,
    method: req.method,
    stack: isDevelopment ? err.stack : undefined,
  });
  
  // Send standardized error response
  const errorResponse = createErrorResponse(
    errorCode,
    message,
    errorType,
    details,
    requestId
  );
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error class with standardized format
 */
export class StandardError extends Error {
  statusCode: number;
  errorCode: ErrorCode;
  errorType: StandardErrorResponse['error']['type'];
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    errorType: StandardErrorResponse['error']['type'] = 'SYSTEM_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'StandardError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
