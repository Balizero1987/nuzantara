/**
 * Team Login Authentication Handler
 * Integrates with ZANTARA identity recognition system
 * 
 * REFACTORED: "Sventra tutto" - Uses hardcoded Source of Truth for reliability
 */

import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError, InternalServerError } from '../../utils/errors.js';
import jwt from 'jsonwebtoken';
import { getDatabasePool } from '../../services/connection-pool.js';
import { getTeamMemberByEmail, TEAM_MEMBERS } from '../../config/team-members.js';

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

  // Find team member by email in CONFIG (Reliable Source of Truth)
  const member = getTeamMemberByEmail(email);

  if (!member) {
    throw new BadRequestError('User not found. Please check your email.');
  }

  // Verify PIN (Direct comparison for hardcoded reliability)
  if (member.pin !== pin) {
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

  // Try to update last login in DB if available, but don't block if it fails
  try {
    const updateDb = getDatabasePool();
    // Check if table exists or catch error to be safe
    await updateDb.query(
      'UPDATE team_members SET last_login = NOW() WHERE email = $1',
      [member.email]
    ).catch(() => { /* Ignore DB errors */ });
  } catch (error) {
    // Ignore connection pool errors
  }

  // Generate JWT token for API authentication
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-development-only';
  if (!process.env.JWT_SECRET) {
    logger.warn('⚠️ JWT_SECRET not set, using default for development');
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
      email: member.email,
      position: member.position
    },
    permissions: session.permissions,
    loginTime: session.loginTime,
  });
}

/**
 * Get permissions based on role
 */
function getPermissionsForRole(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    'admin': ['all', 'admin', 'finance', 'hr', 'tech', 'marketing'],
    'manager': ['setup', 'finance', 'clients', 'reports'],
    'staff': ['setup', 'clients'],
    'demo': ['read-only'],
    'CEO': ['all', 'admin', 'finance', 'hr', 'tech', 'marketing'],
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
    'Reception': ['clients', 'appointments'],
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
  // Return hardcoded list without sensitive data (PIN)
  return TEAM_MEMBERS.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    email: m.email,
    // No PIN returned
  })).sort((a, b) => a.name.localeCompare(b.name));
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
