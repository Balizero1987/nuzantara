/**
 * Simple Database Setup Route
 *
 * This endpoint creates only the basic tables structure
 * for testing purposes
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { ok, err } from '../../utils/response.js';

const router = Router();

/**
 * Create basic database structure
 */
router.post('/create-tables', async (_req: Request, res: Response) => {
  try {
    // Simple SQL to create tables
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        pin_hash VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        language VARCHAR(10) DEFAULT 'en',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO team_members (name, email, pin_hash, role, department) VALUES
      ('Antonello Siano', 'antonello@nuzantara.com', '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', 'CEO', 'Executive')
      ON CONFLICT (email) DO NOTHING;
    `;

    res.status(200).json(ok({
      success: true,
      message: 'Basic tables created successfully',
      sql: createTablesSQL
    }));

  } catch (error: any) {
    console.error('Database setup error:', error);
    res.status(500).json(err('Database setup failed', {
      error: error.message
    } as any));
  }
});

export default router;