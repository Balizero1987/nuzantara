/**
 * TAX PLATFORM - Company Management Handlers
 *
 * Endpoints:
 * - GET    /api/tax/companies
 * - POST   /api/tax/companies
 * - GET    /api/tax/companies/:id
 * - PUT    /api/tax/companies/:id
 * - DELETE /api/tax/companies/:id
 */

import { Request, Response } from 'express';
import logger from '../../services/logger.js';

// TODO: Replace with actual database connection
// This is mock data for development

interface Company {
  id: string;
  company_name: string;
  legal_entity_type: string;
  npwp?: string;
  email: string;
  phone?: string;
  kbli_code?: string;
  kbli_description?: string;
  assigned_consultant_id?: string;
  assigned_consultant_name?: string;
  status: string;
  documents_folder_url?: string;
  client_since?: string;
  created_at: string;
  updated_at: string;
}

// Mock data storage (replace with DB)
let MOCK_COMPANIES: Company[] = [
  {
    id: 'company-1',
    company_name: 'PT Example Indonesia',
    legal_entity_type: 'PT',
    npwp: '12.345.678.9-123.000',
    email: 'contact@ptexample.com',
    phone: '+62-812-3456-7890',
    kbli_code: '46391',
    kbli_description: 'Wholesale trade',
    assigned_consultant_id: 'angel-uuid',
    assigned_consultant_name: 'Angel',
    status: 'active',
    documents_folder_url: 'https://drive.google.com/example',
    client_since: '2023-01-15',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-11-05T10:00:00Z'
  },
  {
    id: 'company-2',
    company_name: 'CV Test Corporation',
    legal_entity_type: 'CV',
    npwp: '98.765.432.1-321.000',
    email: 'info@testcorp.com',
    kbli_code: '62010',
    kbli_description: 'IT Services',
    assigned_consultant_id: 'kadek-uuid',
    assigned_consultant_name: 'Kadek',
    status: 'active',
    client_since: '2023-06-20',
    created_at: '2023-06-20T14:00:00Z',
    updated_at: '2024-10-01T09:00:00Z'
  },
  {
    id: 'company-3',
    company_name: 'PT Demo Limited',
    legal_entity_type: 'PT',
    npwp: '11.222.333.4-444.000',
    email: 'admin@demolimited.com',
    kbli_code: '47911',
    kbli_description: 'Retail',
    assigned_consultant_id: 'dewaayu-uuid',
    assigned_consultant_name: 'Dewa Ayu',
    status: 'pending',
    client_since: '2024-10-01',
    created_at: '2024-10-01T11:00:00Z',
    updated_at: '2024-10-01T11:00:00Z'
  }
];

/**
 * GET /api/tax/companies
 * List all companies (with filters and pagination)
 */
export async function listCompanies(req: Request, res: Response) {
  try {
    const {
      consultant_id,
      status,
      search,
      kbli_code,
      page = '1',
      limit = '20'
    } = req.query;

    const user = (req as any).user;

    // TODO: Query database with filters
    // const query = 'SELECT * FROM companies WHERE ...';

    let filtered = [...MOCK_COMPANIES];

    // Filter by consultant (if not viewing all)
    if (consultant_id && consultant_id !== 'all') {
      filtered = filtered.filter(c => c.assigned_consultant_id === consultant_id);
    }

    // Filter by status
    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Search by name, NPWP, or email
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.company_name.toLowerCase().includes(searchLower) ||
        c.npwp?.includes(search) ||
        c.email.toLowerCase().includes(searchLower)
      );
    }

    // Filter by KBLI
    if (kbli_code) {
      filtered = filtered.filter(c => c.kbli_code === kbli_code);
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    logger.info(`Listed ${paginated.length} companies for user: ${user?.email}`);

    return res.json({
      ok: true,
      data: {
        companies: paginated,
        total: filtered.length,
        page: pageNum,
        limit: limitNum,
        has_more: offset + limitNum < filtered.length
      }
    });

  } catch (error: any) {
    logger.error('List companies error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to list companies'
    });
  }
}

/**
 * POST /api/tax/companies
 * Create new company
 */
export async function createCompany(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const {
      company_name,
      legal_entity_type,
      npwp,
      email,
      phone,
      kbli_code,
      kbli_description,
      assigned_consultant_id,
      documents_folder_url
    } = req.body;

    // Validation
    if (!company_name || !legal_entity_type || !email) {
      return res.status(400).json({
        ok: false,
        error: 'company_name, legal_entity_type, and email are required'
      });
    }

    // Validate legal entity type
    const validTypes = ['PT', 'PT_PMA', 'CV', 'FIRMA', 'UD', 'PERORANGAN'];
    if (!validTypes.includes(legal_entity_type)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid legal_entity_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // TODO: Insert into database
    // const result = await db.query('INSERT INTO companies ...');

    // Mock creation
    const newCompany: Company = {
      id: `company-${Date.now()}`,
      company_name,
      legal_entity_type,
      npwp,
      email,
      phone,
      kbli_code,
      kbli_description,
      assigned_consultant_id: assigned_consultant_id || user.sub,
      status: 'pending',
      documents_folder_url,
      client_since: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    MOCK_COMPANIES.push(newCompany);

    logger.info(`Company created: ${company_name} by ${user.email}`);

    return res.status(201).json({
      ok: true,
      data: {
        company: newCompany,
        id: newCompany.id
      }
    });

  } catch (error: any) {
    logger.error('Create company error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create company'
    });
  }
}

/**
 * GET /api/tax/companies/:id
 * Get single company with details
 */
export async function getCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // TODO: Query database
    // const company = await db.query('SELECT * FROM companies WHERE id = $1', [id]);

    const company = MOCK_COMPANIES.find(c => c.id === id);

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: 'Company not found'
      });
    }

    // TODO: Get additional data
    // - Recent calculations
    // - Payment summary
    // - Jurnal connection status

    logger.info(`Company viewed: ${company.company_name} by ${user.email}`);

    return res.json({
      ok: true,
      data: {
        company,
        // Mock additional data
        recent_calculations: [],
        payment_summary: {
          total_paid_ytd: 0,
          outstanding: 0,
          next_payment_due: null
        },
        jurnal_connection: {
          connected: false,
          last_sync: null
        }
      }
    });

  } catch (error: any) {
    logger.error('Get company error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to get company'
    });
  }
}

/**
 * PUT /api/tax/companies/:id
 * Update company
 */
export async function updateCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const updates = req.body;

    // TODO: Update in database
    // const result = await db.query('UPDATE companies SET ... WHERE id = $1', [id]);

    const companyIndex = MOCK_COMPANIES.findIndex(c => c.id === id);

    if (companyIndex === -1) {
      return res.status(404).json({
        ok: false,
        error: 'Company not found'
      });
    }

    // Update company
    MOCK_COMPANIES[companyIndex] = {
      ...MOCK_COMPANIES[companyIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    logger.info(`Company updated: ${MOCK_COMPANIES[companyIndex].company_name} by ${user.email}`);

    return res.json({
      ok: true,
      data: {
        company: MOCK_COMPANIES[companyIndex]
      }
    });

  } catch (error: any) {
    logger.error('Update company error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to update company'
    });
  }
}

/**
 * DELETE /api/tax/companies/:id
 * Soft delete company (set status to inactive)
 */
export async function deleteCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if user has permission
    if (!user.permissions?.can_manage_users) {
      return res.status(403).json({
        ok: false,
        error: 'Only managers can delete companies'
      });
    }

    // TODO: Soft delete in database
    // const result = await db.query('UPDATE companies SET status = $1 WHERE id = $2', ['inactive', id]);

    const companyIndex = MOCK_COMPANIES.findIndex(c => c.id === id);

    if (companyIndex === -1) {
      return res.status(404).json({
        ok: false,
        error: 'Company not found'
      });
    }

    // Soft delete
    MOCK_COMPANIES[companyIndex].status = 'inactive';
    MOCK_COMPANIES[companyIndex].updated_at = new Date().toISOString();

    logger.info(`Company deleted: ${MOCK_COMPANIES[companyIndex].company_name} by ${user.email}`);

    return res.json({
      ok: true,
      message: 'Company deleted successfully'
    });

  } catch (error: any) {
    logger.error('Delete company error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to delete company'
    });
  }
}
