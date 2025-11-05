/**
 * TAX PLATFORM Routes
 * Tax management system for Bali Zero
 * Phase 1: Authentication & Company Management
 */

import { Router } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../utils/errors.js';
import {
  login,
  logout,
  me,
  verifyToken,
  requireRole,
  requirePermission
} from '../handlers/tax/auth.js';
import {
  listCompanies,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany
} from '../handlers/tax/companies.js';

const router = Router();

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

/**
 * POST /api/tax/auth/login
 * Login and get JWT token
 */
const LoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required')
});

router.post('/auth/login', async (req, res) => {
  try {
    const validated = LoginSchema.parse(req.body);
    return await login(req, res);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Login failed'
    });
  }
});

/**
 * POST /api/tax/auth/logout
 * Logout (client-side token removal)
 */
router.post('/auth/logout', verifyToken, async (req, res) => {
  return await logout(req, res);
});

/**
 * GET /api/tax/auth/me
 * Get current user info
 */
router.get('/auth/me', verifyToken, async (req, res) => {
  return await me(req, res);
});

// ============================================================
// COMPANY MANAGEMENT ROUTES (Protected)
// ============================================================

/**
 * GET /api/tax/companies
 * List companies with filters
 * Query params: consultant_id, status, search, kbli_code, page, limit
 */
router.get('/companies', verifyToken, async (req, res) => {
  return await listCompanies(req, res);
});

/**
 * POST /api/tax/companies
 * Create new company
 * Requires: can_create_calculations permission (for now, any authenticated user)
 */
const CreateCompanySchema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  legal_entity_type: z.enum(['PT', 'PT_PMA', 'CV', 'FIRMA', 'UD', 'PERORANGAN']),
  email: z.string().email('Valid email required'),
  npwp: z.string().optional(),
  phone: z.string().optional(),
  kbli_code: z.string().optional(),
  kbli_description: z.string().optional(),
  assigned_consultant_id: z.string().optional(),
  documents_folder_url: z.string().url().optional().or(z.literal(''))
});

router.post('/companies', verifyToken, async (req, res) => {
  try {
    const validated = CreateCompanySchema.parse(req.body);
    return await createCompany(req, res);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to create company'
    });
  }
});

/**
 * GET /api/tax/companies/:id
 * Get single company details
 */
router.get('/companies/:id', verifyToken, async (req, res) => {
  return await getCompany(req, res);
});

/**
 * PUT /api/tax/companies/:id
 * Update company
 */
const UpdateCompanySchema = z.object({
  company_name: z.string().optional(),
  legal_entity_type: z.enum(['PT', 'PT_PMA', 'CV', 'FIRMA', 'UD', 'PERORANGAN']).optional(),
  email: z.string().email().optional(),
  npwp: z.string().optional(),
  phone: z.string().optional(),
  kbli_code: z.string().optional(),
  kbli_description: z.string().optional(),
  assigned_consultant_id: z.string().optional(),
  documents_folder_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  internal_notes: z.string().optional()
});

router.put('/companies/:id', verifyToken, async (req, res) => {
  try {
    const validated = UpdateCompanySchema.parse(req.body);
    return await updateCompany(req, res);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to update company'
    });
  }
});

/**
 * DELETE /api/tax/companies/:id
 * Soft delete company (managers only)
 */
router.delete('/companies/:id', verifyToken, requireRole('tax_manager'), async (req, res) => {
  return await deleteCompany(req, res);
});

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * GET /api/tax/health
 * Tax platform health check
 */
router.get('/health', (req, res) => {
  return res.json({
    ok: true,
    service: 'tax-platform',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: ['POST /auth/login', 'POST /auth/logout', 'GET /auth/me'],
      companies: ['GET /companies', 'POST /companies', 'GET /companies/:id', 'PUT /companies/:id', 'DELETE /companies/:id']
    }
  });
});

export default router;
