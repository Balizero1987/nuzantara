/**
 * Team Login Authentication Handler
 * Integrates with ZANTARA identity recognition system
 */

import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError, InternalServerError } from '../../utils/errors.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getDatabasePool } from '../../services/connection-pool.js';

// Session management with automatic cleanup
const activeSessions = new Map<string, any>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Session cleanup function
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.createdAt > SESSION_TTL) {
      activeSessions.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    logger.info(`🧹 Cleaned up ${cleanedCount} expired sessions`);
  }
}

// Start cleanup interval (every hour)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000); // Every hour
}

/**
 * Team member login authentication
 */
export async function teamLogin(params: any) {
  const { email, pin } = params || {};

  if (!email) {
    throw new BadRequestError('Email is required for login');
  }

  if (!pin) {
    throw new BadRequestError('PIN is required for login');
  }

  // Validate PIN format (4-8 digits)
  if (!/^[0-9]{4,8}$/.test(pin)) {
    throw new BadRequestError('Invalid PIN format. Must be 4-8 digits.');
  }

  // Find team member by email in DATABASE
  let member: any = null;
  try {
    const db = getDatabasePool();
    const result = await db.query(
      'SELECT id, name, email, pin_hash, role, department, language, personalized_response, is_active FROM team_members WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email]
    );
    
    if (result.rows.length > 0) {
      member = result.rows[0];
    }
  } catch (error) {
    logger.error(`Database error during login for ${email}:`, error as Error);
    throw new InternalServerError('Authentication service unavailable');
  }

  if (!member) {
    throw new BadRequestError('User not found. Please check your email.');
  }

  // Verify PIN using bcrypt (secure comparison)
  const isValidPin = await bcrypt.compare(pin, member.pin_hash);
  if (!isValidPin) {
    // Log failed attempt for security monitoring
    logger.warn(`Failed login attempt for ${email} - Invalid PIN`);
    throw new BadRequestError('Invalid PIN. Please try again.');
  }

  // Create session
  const sessionId = `session_${Date.now()}_${member.id}`;
  const now = Date.now();
  const session = {
    id: sessionId,
    user: member,
    loginTime: new Date(now).toISOString(),
    lastActivity: new Date(now).toISOString(),
    createdAt: now, // For TTL tracking
    permissions: getPermissionsForRole(member.role),
  };

  activeSessions.set(sessionId, session);

  // Update last login timestamp in database
  try {
    const updateDb = getDatabasePool();
    await updateDb.query(
      'UPDATE team_members SET last_login = NOW() WHERE id = $1',
      [member.id]
    );
  } catch (error) {
    logger.warn('Failed to update last_login timestamp:', error as Error);
  }

  // Generate JWT token for API authentication
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('🚨 JWT_SECRET environment variable is not configured!');
    throw new InternalServerError('Server configuration error - authentication service unavailable');
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

  // Log successful login
  logger.info(`🔐 Team login successful: ${member.name} (${member.role}) - Session: ${sessionId}`);

  return ok({
    success: true,
    sessionId,
    token, // JWT token for API calls
    user: {
      id: member.id,
      name: member.name,
      role: member.role,
      department: member.department,
      language: member.language || 'en', // Default fallback
      email: member.email,
    },
    permissions: session.permissions,
    personalizedResponse: member.personalized_response || false, // DB usually uses snake_case
    loginTime: session.loginTime,
  });
}

/**
 * Get permissions based on role
 */
function getPermissionsForRole(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    CEO: ['all', 'admin', 'finance', 'hr', 'tech', 'marketing'],
    'Board Member': ['all', 'finance', 'hr', 'tech', 'marketing'],
    'AI Bridge/Tech Lead': ['all', 'tech', 'admin', 'finance'],
    'Executive Consultant': ['setup', 'finance', 'clients', 'reports'],
    'Specialist Consultant': ['setup', 'clients', 'reports'],
    'Junior Consultant': ['setup', 'clients'],
    'Crew Lead': ['setup', 'clients', 'team'],
    'Tax Manager': ['tax', 'finance', 'reports', 'clients'],
    'Tax Expert': ['tax', 'reports', 'clients'],
    'Tax Consultant': ['tax', 'clients'],
    'Tax Care': ['tax', 'clients'],
    'Marketing Specialist': ['marketing', 'clients', 'reports'],
    'Marketing Advisory': ['marketing', 'clients'],
    Reception: ['clients', 'appointments'],
    'External Advisory': ['clients', 'reports'],
  };

  return permissions[role] || ['clients'];
}

/**
 * Validate session
 */
export function validateSession(sessionId: string): any {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return null;
  }

  // Update last activity
  session.lastActivity = new Date().toISOString();
  activeSessions.set(sessionId, session);

  return session;
}

/**
 * Get all team members for login form (Public safe list)
 */
export async function getTeamMembers() {
  try {
    const db = getDatabasePool();
    const result = await db.query('SELECT id, name, role, department, email, pin FROM team_members ORDER BY name');
    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve team members list:', error as Error);
    return [];
  }
}

/**
 * Logout session
 */
export function logoutSession(sessionId: string) {
  const session = activeSessions.get(sessionId);
  if (session) {
    activeSessions.delete(sessionId);
    logger.info(`🔓 Team logout: ${session.user.name} - Session: ${sessionId}`);
    return true;
  }
  return false;
}
