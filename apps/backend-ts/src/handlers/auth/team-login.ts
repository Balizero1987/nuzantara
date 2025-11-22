/**
 * Team Login Authentication Handler
 * Integrates with ZANTARA identity recognition system
 */

import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import jwt from 'jsonwebtoken';

// TABULA RASA: Team member database MUST be retrieved from database
// This legacy structure is kept only as a fallback stub - all team data comes from database
// TODO: Remove this stub once database integration is complete
const TEAM_RECOGNITION: Record<string, any> = {
  // TABULA RASA: All team member data removed - must be retrieved from database
  // No hardcoded team members - empty stub only
};

// Session management
const activeSessions = new Map<string, any>();

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

  // Find team member by email
  let member: any = null;
  for (const teamMember of Object.values(TEAM_RECOGNITION)) {
    if (teamMember.email.toLowerCase() === email.toLowerCase()) {
      member = teamMember;
      break;
    }
  }

  if (!member) {
    throw new BadRequestError('User not found. Please check your email.');
  }

  // Verify PIN
  if (member.pin !== pin) {
    // Log failed attempt for security monitoring
    logger.warn(`Failed login attempt for ${email} - Invalid PIN`);
    throw new BadRequestError('Invalid PIN. Please try again.');
  }

  // Create session
  const sessionId = `session_${Date.now()}_${member.id}`;
  const session = {
    id: sessionId,
    user: member,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    permissions: getPermissionsForRole(member.role),
  };

  activeSessions.set(sessionId, session);

  // Generate JWT token for API authentication
  const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
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
      language: member.language,
      email: member.email,
    },
    permissions: session.permissions,
    personalizedResponse: member.personalizedResponse,
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
 * Get all team members for login form
 */
export function getTeamMembers() {
  return Object.values(TEAM_RECOGNITION).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    department: member.department,
    email: member.email,
    pin: member.pin, // Required for PIN validation in router.ts
  }));
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
