// src/api/auth.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create API keys table
export async function createApiKeysTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(100),
      permissions TEXT[],
      rate_limit INTEGER DEFAULT 100,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used TIMESTAMP
    )
  `);
}

export async function generateApiKey(name: string, permissions: string[] = ['read']): Promise<string> {
  const key = 'bzj_' + crypto.randomBytes(32).toString('hex');

  await pool.query(
    'INSERT INTO api_keys (key, name, permissions) VALUES ($1, $2, $3)',
    [key, name, permissions]
  );

  return key;
}

export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const { rows: [key] } = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND active = true',
      [apiKey]
    );

    if (!key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used
    await pool.query(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = $1',
      [key.id]
    );

    // Add key info to request
    (req as any).apiKey = key;

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

