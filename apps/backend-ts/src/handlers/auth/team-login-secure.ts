/**
 * 🔐 Professional Team Login System with PIN Authentication
 * Features: bcrypt hashing, JWT tokens, rate limiting, session management
 * Version: 2.0 - Secure Edition
 */

import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError, UnauthorizedError } from "../../utils/errors.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'zantara-jwt-secret-CHANGE-IN-PRODUCTION-2025';
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

// Team database with secure PIN hashes
const TEAM_DATABASE = {
  'zainal': {
    id: 'zainal',
    name: 'Zainal Abidin',
    role: 'CEO',
    email: 'zainal@balizero.com',
    department: 'management',
    language: 'Indonesian',
    pinHash: '$2b$10$6Ydh5k6U3OZMB5WVRx4Jn.pQYZxpwbtXjSZYtnhBAaQZfD/wXHLrq',
    badge: '👑'
  },
  'ruslana': {
    id: 'ruslana',
    name: 'Ruslana',
    role: 'Board Member',
    email: 'ruslana@balizero.com',
    department: 'management',
    language: 'English',
    pinHash: '$2b$10$1Ft/5C5l6vZKBxRtFUVIIeknCk3zPoF5eBXE69VThgEa/GM.9MrLW',
    badge: '💼'
  },
  'zero': {
    id: 'zero',
    name: 'Zero',
    role: 'AI Bridge/Tech Lead',
    email: 'zero@balizero.com',
    department: 'technology',
    language: 'Italian',
    pinHash: '$2b$10$rutWaozCCzoYFeavGHcK.urGxi/Y9Td/1qq20K0nwMY412fzWlCS.',
    badge: '🤖'
  },
  'amanda': {
    id: 'amanda',
    name: 'Amanda',
    role: 'Executive Consultant',
    email: 'amanda@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$aSbKt0B4axbmEMGlk8CjBeDsm37.shHvqtdiYDCCAz87bWk00taT2', // PIN: 180785
    badge: '📒'
  },
  'anton': {
    id: 'anton',
    name: 'Anton',
    role: 'Executive Consultant',
    email: 'anton@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$hy..Cg5PDeZivJpTsxbzCuNeIC25dF18u/SLpNPj/4ktn1th/g6qO'
  },
  'vino': {
    id: 'vino',
    name: 'Vino',
    role: 'Junior Consultant',
    email: 'vino@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$O.mPYkHTMomhTvu1i3odGerFKc3uQZcWHgFeizNS6uZayUbhWP6Wa'
  },
  'krisna': {
    id: 'krisna',
    name: 'Krisna',
    role: 'Executive Consultant',
    email: 'krisna@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$B9J2sIRSUgQDSOYmh0ETS..CW8vUe9ffrJJstiXzFEGeHU9oQm8Kq'
  },
  'adit': {
    id: 'adit',
    name: 'Adit',
    role: 'Crew Lead',
    email: 'adit@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$Bfi.tqrydp.0Sd5t823wT.sCQbkvy7jh3RH4dfyvslaOCucMlGE06'
  },
  'ari': {
    id: 'ari',
    name: 'Ari',
    role: 'Specialist Consultant',
    email: 'ari@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$Vs6npRYdlYr3MT.xAwRJIOZ5UKsS24oDmmzhDcDZd7TP70x.TTn62'
  },
  'dea': {
    id: 'dea',
    name: 'Dea',
    role: 'Executive Consultant',
    email: 'dea@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$Ueq7X.40DA6vZxhLrZvgJORm8MLyiTdYLviw/444bWiECRS12xhsG'
  },
  'surya': {
    id: 'surya',
    name: 'Surya',
    role: 'Specialist Consultant',
    email: 'surya@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$FeUqCsEoclWCtUwkNyhTtetdraYcGR3mJWh4sQTVYPFTATMBqJl8.'
  },
  'damar': {
    id: 'damar',
    name: 'Damar',
    role: 'Junior Consultant',
    email: 'damar@balizero.com',
    department: 'setup',
    language: 'Indonesian',
    pinHash: '$2b$10$4KiaIDNBGt28DztFgp985eGP7yQ/bEqfHuifvkQwqvFtd9PJ.RGPm'
  },
  'veronika': {
    id: 'veronika',
    name: 'Veronika',
    role: 'Tax Manager',
    email: 'veronika@balizero.com',
    department: 'tax',
    language: 'Ukrainian',
    pinHash: '$2b$10$cSWe.4BUZB1FwUG/J7mKtuv26GvmVCTpJ5d6fHf7J1O92q2t12naq',
    badge: '💰'
  },
  'olena': {
    id: 'olena',
    name: 'Olena',
    role: 'External Tax Advisory',
    email: 'olena@balizero.com',
    department: 'tax',
    language: 'Ukrainian',
    pinHash: '$2b$10$6OtzdXSN0g2n.Lr9HmN/BeoZeI6yCw81fMCJp9kCjNiEP2yUiVLTS'
  },
  'angel': {
    id: 'angel',
    name: 'Angel',
    role: 'Tax Expert',
    email: 'angel@balizero.com',
    department: 'tax',
    language: 'English',
    pinHash: '$2b$10$WKJpmD7NEztOzwI.MMubnuGSmqMIi//7dECxJW2fgwjnlsQohqkEq'
  },
  'kadek': {
    id: 'kadek',
    name: 'Kadek',
    role: 'Tax Consultant',
    email: 'kadek@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    pinHash: '$2b$10$i1vPTNYeYQZhkzOqsla2UeARAhC0TMOfWUnlD2DfPozlEHOYl.2sO'
  },
  'dewaayu': {
    id: 'dewaayu',
    name: 'Dewa Ayu',
    role: 'Tax Consultant',
    email: 'dewaayu@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    pinHash: '$2b$10$7R8ISmrUHDXYmBXhjVwol.VFMFEwa5yR8PTdhA4XSAOSIRJ/VMXIe'
  },
  'faisha': {
    id: 'faisha',
    name: 'Faisha',
    role: 'Tax Care',
    email: 'faisha@balizero.com',
    department: 'tax',
    language: 'Indonesian',
    pinHash: '$2b$10$Nz6U3IniefjQWYUIScD4ke0J/diQyG8jZYTIiQqEW8q1Ik5ZjLlpe'
  },
  'rina': {
    id: 'rina',
    name: 'Rina',
    role: 'Reception',
    email: 'rina@balizero.com',
    department: 'reception',
    language: 'Indonesian',
    pinHash: '$2b$10$VI.3LJSFK8QZquhq819Y/uMvYukDlvBLLS0Da9R/SIbVJ7rF8tNBC',
    badge: '📞'
  },
  'nina': {
    id: 'nina',
    name: 'Nina',
    role: 'Marketing Advisory',
    email: 'nina@balizero.com',
    department: 'marketing',
    language: 'English',
    pinHash: '$2b$10$ygt54IjN4eU3.LMq7bZKUekTfXk5g1eZcNbiOlvcke45yULjXHUIy',
    badge: '📢'
  },
  'sahira': {
    id: 'sahira',
    name: 'Sahira',
    role: 'Marketing Specialist',
    email: 'sahira@balizero.com',
    department: 'marketing',
    language: 'Indonesian',
    pinHash: '$2b$10$LCqrsa0q9z8IGymcJyp2/efy8w7x/CgNhujkL61PoiR52pAWmm6nW'
  },
  'marta': {
    id: 'marta',
    name: 'Marta',
    role: 'External Advisory',
    email: 'marta@balizero.com',
    department: 'advisory',
    language: 'Italian',
    pinHash: '$2b$10$v2LQf9BbOwj0UzWn/obXYOBi//pU5R6bb6p4eCUYfRVLVrEYnhGBC',
    badge: '💼'
  }
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
      retryAfter
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
      retryAfter
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

  // Generate JWT token
  const token = jwt.sign(
    {
      id: member.id,
      email: member.email,
      role: member.role,
      department: member.department
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
      role: member.role,
      department: member.department,
      language: member.language,
      badge: (member as any).badge || ''
    },
    permissions,
    message: response,
    expiresIn: JWT_EXPIRY
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
  return Object.values(TEAM_DATABASE).map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
    department: member.department,
    badge: (member as any).badge || ''
  }));
}

/**
 * Get permissions based on role
 */
function getPermissionsForRole(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
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
    'External Advisory': ['clients', 'reports']
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
    English: `Welcome back, ${member.name}! You have successfully logged in as ${member.role}.`
  };

  return responses[member.language] || responses['English'] || 'Welcome back!';
}
