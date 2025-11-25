/**
 * Comprehensive Input Validation Schemas
 *
 * Centralized validation schemas for all API endpoints
 * Uses Zod for runtime validation with TypeScript support
 */

import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  // User identification
  userId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid userId format'),
  email: z.string().email('Invalid email format'),
  sessionId: z.string().min(1).max(255),

  // Pagination
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),

  // Common constraints
  optionalString: z.string().optional(),
  requiredString: z.string().min(1),
  textInput: z.string().max(10000), // 10k char limit
  shortText: z.string().max(500), // 500 char limit

  // Numerical values
  positiveNumber: z.number().positive(),
  optionalNumber: z.number().optional(),
  percentage: z.number().min(0).max(1),

  // Arrays
  stringArray: z.array(z.string()).max(100),
  optionalStringArray: z.array(z.string()).max(100).optional(),
};

// AI Service validation schemas
export const aiSchemas = {
  chat: z.object({
    prompt: commonSchemas.textInput.optional(),
    message: commonSchemas.textInput.optional(),
    context: commonSchemas.textInput.optional(),
    provider: z.enum(['zantara', 'llama']).optional().default('zantara'),
    model: commonSchemas.optionalString,
    userId: commonSchemas.userId.optional(),
    userEmail: commonSchemas.email.optional(),
    userName: commonSchemas.shortText.optional(),
    sessionId: commonSchemas.sessionId.optional(),
    max_tokens: z.number().int().min(1).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional(),
  }).refine((data) => data.prompt || data.message, {
    message: 'Either prompt or message is required',
  }),
};

// Memory validation schemas
export const memorySchemas = {
  save: z.object({
    userId: commonSchemas.userId,
    profile_facts: commonSchemas.stringArray.max(10).default([]),
    summary: z.string().max(500).default(''),
    counters: z.record(z.number()).default({}),
  }),

  search: z.object({
    userId: commonSchemas.userId,
    query: commonSchemas.textInput,
    limit: z.number().int().min(1).max(50).default(10),
  }),

  retrieve: z.object({
    userId: commonSchemas.userId,
  }),
};

// Oracle/Bali Zero validation schemas
export const oracleSchemas = {
  base: z.object({
    service: z.enum(['visa', 'company', 'tax', 'legal', 'property']).optional(),
    scenario: commonSchemas.textInput,
    urgency: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    complexity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    region: z.string().max(100).optional().default('Bali'),
    budget: commonSchemas.positiveNumber.optional(),
    goals: commonSchemas.stringArray.max(20).optional(),
  }),

  simulate: z.object({
    service: z.enum(['visa', 'company', 'tax', 'legal', 'property']).optional(),
    scenario: commonSchemas.textInput.optional(),
    urgency: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    complexity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    region: z.string().max(100).optional().default('Bali'),
    budget: commonSchemas.positiveNumber.optional(),
    goals: commonSchemas.stringArray.max(20).optional(),
  }),

  analyze: z.object({
    service: z.enum(['visa', 'company', 'tax', 'legal', 'property']).optional(),
    scenario: commonSchemas.textInput.optional(),
    urgency: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    complexity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    region: z.string().max(100).optional().default('Bali'),
    budget: commonSchemas.positiveNumber.optional(),
    goals: commonSchemas.stringArray.max(20).optional(),
  }),

  predict: z.object({
    service: z.enum(['visa', 'company', 'tax', 'legal', 'property']).optional(),
    scenario: commonSchemas.textInput.optional(),
    urgency: z.enum(['low', 'normal', 'high']).optional().default('normal'),
    complexity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    region: z.string().max(100).optional().default('Bali'),
    budget: commonSchemas.positiveNumber.optional(),
    timeline_months: z.number().int().min(1).max(120).optional(),
  }),
};

// Team authentication validation schemas
export const authSchemas = {
  teamLogin: z.object({
    email: commonSchemas.email,
    pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
  }),

  tokenVerify: z.object({
    token: commonSchemas.requiredString,
  }),
};

// Communication validation schemas
export const communicationSchemas = {
  whatsapp: z.object({
    to: commonSchemas.requiredString,
    message: commonSchemas.textInput,
    userId: commonSchemas.userId.optional(),
  }),

  instagram: z.object({
    action: z.enum(['post', 'comment', 'dm', 'analyze']),
    content: commonSchemas.textInput,
    userId: commonSchemas.userId.optional(),
  }),

  translate: z.object({
    text: commonSchemas.requiredString,
    from: z.string().length(2).optional(),
    to: z.string().length(2),
    context: z.enum(['general', 'business', 'technical', 'legal']).optional().default('general'),
  }),
};

// Google Workspace validation schemas
export const googleSchemas = {
  gmail: z.object({
    action: z.enum(['list', 'get', 'send', 'search', 'delete']),
    messageId: commonSchemas.optionalString,
    query: commonSchemas.optionalString,
    to: z.array(commonSchemas.email).optional(),
    subject: commonSchemas.optionalString,
    body: commonSchemas.textInput.optional(),
    maxResults: z.number().int().min(1).max(100).optional().default(50),
  }),

  calendar: z.object({
    action: z.enum(['list', 'get', 'create', 'update', 'delete']),
    eventId: commonSchemas.optionalString,
    summary: commonSchemas.optionalString,
    description: commonSchemas.textInput.optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    attendees: z.array(commonSchemas.email).optional(),
  }),

  drive: z.object({
    action: z.enum(['list', 'get', 'upload', 'delete', 'search']),
    fileId: commonSchemas.optionalString,
    name: commonSchemas.optionalString,
    query: commonSchemas.optionalString,
    mimeType: commonSchemas.optionalString,
    pageSize: z.number().int().min(1).max(100).optional().default(50),
  }),

  sheets: z.object({
    action: z.enum(['get', 'update', 'append', 'create']),
    spreadsheetId: commonSchemas.requiredString,
    range: commonSchemas.requiredString,
    values: z.array(z.array(z.string())).optional(),
  }),

  docs: z.object({
    action: z.enum(['get', 'create', 'update']),
    documentId: commonSchemas.optionalString,
    title: commonSchemas.optionalString,
    content: commonSchemas.textInput.optional(),
  }),
};

// Analytics validation schemas
export const analyticsSchemas = {
  dashboard: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    metrics: commonSchemas.stringArray.optional(),
    filters: z.record(z.any()).optional(),
  }),

  driveRecap: z.object({
    userId: commonSchemas.userId.optional(),
    dateRange: z.enum(['today', 'week', 'month', 'year']).optional().default('month'),
    includeDetails: z.boolean().optional().default(false),
  }),
};

// Handler validation schemas
export const handlerSchemas = {
  call: z.object({
    key: commonSchemas.requiredString,
    params: z.any().optional(), // Flexible params for different handlers
    context: z.record(z.any()).optional(),
  }),

  introspection: z.object({
    category: commonSchemas.optionalString,
    includeMetadata: z.boolean().optional().default(true),
  }),
};

// Search validation schemas
export const searchSchemas = {
  knowledge: z.object({
    query: commonSchemas.requiredString,
    category: z.enum(['legal', 'tax', 'immigration', 'business']).optional(),
    limit: z.number().int().min(1).max(50).optional().default(10),
    threshold: commonSchemas.percentage.optional().default(0.7),
  }),

  hybrid: z.object({
    query: commonSchemas.requiredString,
    collections: commonSchemas.stringArray.optional(),
    filters: z.record(z.any()).optional(),
    limit: z.number().int().min(1).max(50).optional().default(10),
  }),
};

// Error handling utilities
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation utility functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new ValidationError(`Validation failed: ${error.message}`, details);
    }
    throw new ValidationError('Validation failed');
  }
}

// Middleware factory for request validation
export function createValidationMiddleware(schema: z.ZodSchema<any>, source: 'body' | 'query' | 'params' = 'body') {
  return (req: any, res: any, next: any) => {
    try {
      const data = req[source];
      const validated = validateInput(schema, data);
      req.validated = req.validated || {};
      req.validated[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}