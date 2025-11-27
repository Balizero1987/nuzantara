/**
 * Database Setup Route
 *
 * This endpoint allows for database initialization and setup
 * Should only be accessible in development or with proper admin auth
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { initializeDatabase } from '../../scripts/init-database.js';
import { ok, err } from '../../utils/response.js';
import logger from '../../services/logger.js';

const router = Router();

/**
 * Initialize database with tables and default data
 */
router.post('/init-database', async (_req: Request, res: Response) => {
  try {
    logger.info('🚀 Starting database initialization via API...');

    await initializeDatabase();

    logger.info('✅ Database initialization completed successfully');

    res.status(200).json(ok({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    }));

  } catch (error: any) {
    logger.error('❌ Database initialization failed:', error);

    res.status(500).json(err('Database initialization failed', {
      error: error.message,
      timestamp: new Date().toISOString()
    } as any));
  }
});

/**
 * Check database status
 */
router.get('/database-status', async (_req: Request, res: Response) => {
  try {
    const { getDatabasePool } = await import('../../services/connection-pool.js');
    const db = getDatabasePool();
    if (!db) {
      return res.status(503).json({
        ok: false,
        error: 'Database pool not available',
      });
    }

    // Check if tables exist
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('team_members', 'auth_audit_log', 'user_sessions')
    `);

    const tablesExist = tablesResult.rows.length === 3;

    // Count team members if table exists
    let teamMembersCount = 0;
    if (tablesExist) {
      const countResult = await db.query('SELECT COUNT(*) as count FROM team_members WHERE is_active = true');
      teamMembersCount = parseInt(countResult.rows[0].count);
    }

    res.status(200).json(ok({
      connected: true,
      tablesExist,
      teamMembersCount,
      tables: tablesResult.rows.map((row: any) => row.table_name)
    }));

  } catch (error: any) {
    logger.error('Database status check failed:', error);

    res.status(500).json(err('Database connection failed', {
      error: error.message
    } as any));
  }
});

export default router;
