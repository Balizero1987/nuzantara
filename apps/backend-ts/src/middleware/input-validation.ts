/**
 * Input Validation Middleware
 * 
 * Standardized input validation using Zod schemas
 * Part of Q1 2025 Priority Actions from ANALISI_STRATEGICA_ARCHITETTURA.md
 * 
 * @module middleware/input-validation
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { StandardError, ErrorCode } from '../utils/error-handler.js';
import logger from '../services/logger.js';

/**
 * Validation schema registry
 * Handlers can register their validation schemas here
 */
const validationSchemas = new Map<string, z.ZodSchema>();

/**
 * Register validation schema for a handler
 */
export function registerValidationSchema(handlerKey: string, schema: z.ZodSchema) {
  validationSchemas.set(handlerKey, schema);
  logger.debug(`Registered validation schema for handler: ${handlerKey}`);
}

/**
 * Input validation middleware factory
 * Creates middleware that validates request body/query/params against Zod schema
 */
export function validateInput(
  schema: z.ZodSchema,
  options: {
    source?: 'body' | 'query' | 'params';
    allowUnknown?: boolean;
  } = { source: 'body', allowUnknown: false }
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[options.source || 'body'];
      
      // Validate data
      const validated = schema.parse(data);
      
      // Replace request data with validated data
      (req as any)[options.source || 'body'] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.warn('Input validation failed', {
          path: req.path,
          errors: formattedErrors,
        });
        
        throw new StandardError(
          'Validation failed',
          422,
          ErrorCode.VALIDATION_ERROR,
          'VALIDATION_ERROR',
          { validationErrors: formattedErrors }
        );
      }
      
      next(error);
    }
  };
}

/**
 * Handler-specific validation middleware
 * Automatically validates based on handler:id key in request
 */
export function handlerValidation(req: Request, _res: Response, next: NextFunction) {
  const handlerKey = req.body?.key || req.path.split('/').pop() || '';
  const schema = validationSchemas.get(handlerKey);
  
  if (!schema) {
    // No validation schema registered for this handler - skip validation
    return next();
  }
  
  try {
    const data = req.body?.params || req.body;
    const validated = schema.parse(data);
    
    // Replace request data with validated data
    if (req.body?.params) {
      req.body.params = validated;
    } else {
      req.body = validated;
    }
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      logger.warn('Handler input validation failed', {
        handlerKey,
        errors: formattedErrors,
      });
      
      throw new StandardError(
        `Validation failed for handler: ${handlerKey}`,
        422,
        ErrorCode.VALIDATION_ERROR,
        'VALIDATION_ERROR',
        { handlerKey, validationErrors: formattedErrors }
      );
    }
    
    next(error);
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // API key validation
  apiKey: z.string().min(10, 'API key must be at least 10 characters'),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
  }),
  
  // Sort order
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
};
