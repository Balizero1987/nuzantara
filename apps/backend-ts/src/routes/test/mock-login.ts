/**
 * Mock Login Test Route
 *
 * This endpoint simulates login without database connection
 * for testing purposes
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ok } from '../../utils/response.js';

const router = Router();

// Production guard
if (process.env.NODE_ENV === 'production') {
  throw new Error('Mock login is disabled in production');
}

// Mock team members data (same PIN: 1234 for testing)
const mockTeamMembers = [
  {
    id: 'ceo-123',
    name: 'Antonello Siano',
    email: 'antonello@nuzantara.com',
    pinHash: '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj', // "1234" hashed
    role: 'CEO',
    department: 'Executive',
    language: 'en'
  },
  {
    id: 'tech-456',
    name: 'Tech Lead',
    email: 'tech@nuzantara.com',
    pinHash: '$2b$10$rOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJjzJjzJjzJOzJqQjzJjzJj',
    role: 'AI Bridge/Tech Lead',
    department: 'Technology',
    language: 'en'
  }
];

// Mock permissions for roles
function getPermissionsForRole(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    'CEO': ['all', 'admin', 'finance', 'hr', 'tech', 'marketing'],
    'AI Bridge/Tech Lead': ['all', 'tech', 'admin', 'finance'],
    'Executive Consultant': ['setup', 'finance', 'clients', 'reports'],
    'Junior Consultant': ['setup', 'clients'],
    'Tax Manager': ['tax', 'finance', 'reports', 'clients'],
    'Marketing Specialist': ['marketing', 'clients', 'reports'],
    'Reception': ['clients', 'appointments'],
  };

  return permissions[role] || ['clients'];
}

/**
 * Mock team login endpoint (no database required)
 */
router.post('/mock-login', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body || {};

    if (!email || !pin) {
      return res.status(400).json(ok({
        success: false,
        error: 'Email e PIN sono richiesti'
      }));
    }

    // Find mock user
    const member = mockTeamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());

    if (!member) {
      return res.status(401).json(ok({
        success: false,
        error: 'Utente non trovato'
      }));
    }

    // Verify PIN using bcrypt
    const isValidPin = await bcrypt.compare(pin, member.pinHash);
    if (!isValidPin) {
      return res.status(401).json(ok({
        success: false,
        error: 'PIN non valido'
      }));
    }

    // Create session
    const sessionId = `session_${Date.now()}_${member.id}`;

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json(ok({
        success: false,
        error: 'Server configuration error - JWT system unavailable'
      }));
    }
    const token = jwt.sign(
      {
        userId: member.id,
        email: member.email,
        role: member.role,
        department: member.department,
        sessionId: sessionId,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log(`🔐 Mock login successful: ${member.name} (${member.role}) - Session: ${sessionId}`);

    return res.status(200).json(ok({
      success: true,
      sessionId,
      token,
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        permissions: getPermissionsForRole(member.role),
        language: member.language,
        loginTime: new Date().toISOString()
      },
      message: `Login riuscito! Benvenuto ${member.name}`
    }));

  } catch (error: any) {
    console.error('Mock login error:', error);
    return res.status(500).json(ok({
      success: false,
      error: 'Errore durante il login',
      details: error.message
    }));
  }
});

/**
 * Get mock team members
 */
router.get('/mock-members', async (_req: Request, res: Response) => {
  const safeMembers = mockTeamMembers.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    department: member.department,
    language: member.language
  }));

  return res.status(200).json(ok({
    success: true,
    members: safeMembers,
    total: safeMembers.length
  }));
});

/**
 * Test endpoint to verify server is working
 */
router.get('/test', async (_req: Request, res: Response) => {
  return res.status(200).json(ok({
    success: true,
    message: 'Mock login system working!',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /test/mock-login',
      'GET /test/mock-members'
    ]
  }));
});

export default router;