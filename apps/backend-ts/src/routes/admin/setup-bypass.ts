/**
 * Database Setup Route (No CSRF - for initial setup)
 *
 * This endpoint bypasses CSRF protection for initial database setup
 * Should be removed or protected after setup is complete
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { initializeDatabase } from '../../scripts/init-database.js';
import { ok, err } from '../../utils/response.js';
import logger from '../../services/logger.js';

const router = Router();

/**
 * Initialize database with tables and default data (no CSRF protection)
 * This is only for initial setup - should be disabled after database is created
 */
router.post('/init-database-unsafe', async (_req: Request, res: Response) => {
  try {
    logger.info('🚀 Starting database initialization via unsafe API...');

    await initializeDatabase();

    logger.info('✅ Database initialization completed successfully');

    res.status(200).json(ok({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString(),
      warning: 'This endpoint should be disabled after initial setup'
    }));

  } catch (error: any) {
    logger.error('❌ Database initialization failed:', error);

    res.status(500).json(err('Database initialization failed', {
      error: error.message,
      timestamp: new Date().toISOString()
    } as any));
  }
});

export default router;