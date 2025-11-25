/**
 * 🔐 Professional Team Login System with PIN Authentication
 * Features: bcrypt hashing, JWT tokens, rate limiting, session management
 * Version: 2.0 - Secure Edition
 */

import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configuration
const JWT_SECRET: string = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for secure team login');
}
const JWT_EXPIRY = '24h';
const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Rate limiting storage
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

// TABULA RASA: Team database MUST be retrieved from database
// This legacy structure is kept only as a fallback stub - all team data comes from database
// TODO: Remove this stub once database integration is complete
const TEAM_DATABASE: Record<string, any> = {
  // TABULA RASA: All team member data removed - must be retrieved from database
  // No hardcoded team members - empty stub only
};

/**
 * Check if email is rate-limited
 */
function checkRateLimit(email: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const attempt = loginAttempts.get(email);
  const now = Date.now();

  if (!attempt) {
    return { allowed: true };
  }

  // Check if still blocked
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    const retryAfter = Math.ceil((attempt.blockedUntil - now) / 1000);
    return {
      allowed: false,
      reason: `Too many failed attempts. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    };
  }

  // Reset if block period has passed
  if (attempt.blockedUntil && attempt.blockedUntil <= now) {
    loginAttempts.delete(email);
    return { allowed: true };
  }

  // Check if too many attempts
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(email, { ...attempt, blockedUntil });

    const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
    return {
      allowed: false,
      reason: `Too many failed attempts. Account locked for ${retryAfter} seconds.`,
      retryAfter,
    };
  }

  return { allowed: true };
}

/**
 * Record failed login attempt
 */
function recordFailedAttempt(email: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(email, { count: attempt.count + 1, lastAttempt: now });
  }
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(email: string) {
  loginAttempts.delete(email);
}

/**
 * 🔓 Admin: Reset login attempts (for debugging/unblocking users)
 */
export async function resetLoginAttempts(params: any) {
  const { email } = params || {};

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  loginAttempts.delete(email);
  logger.info(`🔓 Login attempts reset for ${email}`);

  return ok({
    success: true,
    message: `Login attempts cleared for ${email}. User can try again.`,
  });
}

/**
 * 🔐 Secure Team Login with PIN
 */
export async function teamLoginSecure(params: any) {
  const { email, pin } = params || {};

  // Validation
  if (!email || !pin) {
    throw new BadRequestError('Email and PIN are required');
  }

  if (!/^\d{6}$/.test(pin)) {
    throw new BadRequestError('PIN must be exactly 6 digits');
  }

  // Rate limiting check
  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    logger.warn(`🚫 Rate limit exceeded for ${email}`);
    throw new UnauthorizedError(rateCheck.reason || 'Too many attempts');
  }

  // Find team member
  let member: any = null;
  for (const teamMember of Object.values(TEAM_DATABASE)) {
    if (teamMember.email.toLowerCase() === email.toLowerCase()) {
      member = teamMember;
      break;
    }
  }

  if (!member) {
    recordFailedAttempt(email);
    logger.warn(`🚫 Login attempt for non-existent member: ${email}`);
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify PIN
  const pinValid = await bcrypt.compare(pin, member.pinHash);

  if (!pinValid) {
    recordFailedAttempt(email);
    const attempt = loginAttempts.get(email);
    const remaining = MAX_LOGIN_ATTEMPTS - (attempt?.count || 0);

    logger.warn(`🚫 Invalid PIN for ${member.name} (${email}) - ${remaining} attempts remaining`);
    throw new UnauthorizedError(
      remaining > 0
        ? `Invalid PIN. ${remaining} attempt(s) remaining.`
        : 'Invalid PIN. Account locked.'
    );
  }

  // Success! Clear attempts
  clearLoginAttempts(email);

  // Generate JWT token - BUG FIX: Use userId instead of id for consistency with jwtAuth middleware
  const token = jwt.sign(
    {
      userId: member.id, // Changed from 'id' to 'userId' for consistency
      email: member.email,
      role: member.role,
      department: member.department,
      name: member.name, // Added for adminAuth compatibility
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  // Get permissions
  const permissions = getPermissionsForRole(member.role);

  // Personalized response
  const response = getPersonalizedResponse(member);

  // Log successful login
  logger.info(`✅ Team login successful: ${member.name} (${member.role})`);

  return ok({
    success: true,
    token,
    user: {
      id: member.id,
      name: member.name,
      email: member.email, // ✅ CRITICAL: Frontend needs this for recognition!
      role: member.role,
      department: member.department,
      language: member.language,
      badge: (member as any).badge || '',
    },
    permissions,
    message: response,
    expiresIn: JWT_EXPIRY,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get team member list (safe - no PINs!)
 */
export function getTeamMemberList() {
  return Object.values(TEAM_DATABASE).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    department: member.department,
    badge: (member as any).badge || '',
  }));
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
 * Personalized welcome message
 */
function getPersonalizedResponse(member: any): string {
  const responses: { [key: string]: string } = {
    Indonesian: `Selamat datang kembali, ${member.name}! Anda telah berhasil masuk sebagai ${member.role}.`,
    Italian: `Ciao ${member.name}! Bentornato. Accesso riuscito come ${member.role}.`,
    Ukrainian: `Ласкаво просимо, ${member.name}! Ви успішно увійшли як ${member.role}.`,
    English: `Welcome back, ${member.name}! You have successfully logged in as ${member.role}.`,
  };

  return responses[member.language] || responses['English'] || 'Welcome back!';
}
