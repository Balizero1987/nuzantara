/**
 * Team Login Authentication Handler
 * Integrates with ZANTARA identity recognition system
 */

import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import jwt from 'jsonwebtoken';

// Team member database (same as ai.ts)
const TEAM_RECOGNITION = {
  // Leadership
  zainal: {
    id: 'zainal',
    name: 'Zainal Abidin',
    role: 'CEO',
    email: 'zainal@balizero.com',
    pin: '847261',
    department: 'management',
    language: 'Indonesian',
    aliases: ['zainal', 'saya zainal', 'halo saya zainal', 'sono zainal'],
    personalizedResponse:
      'Selamat datang kembali Zainal! Sebagai CEO, Anda memiliki akses penuh ke semua sistem Bali Zero dan ZANTARA.',
  },
  ruslana: {
    id: 'ruslana',
    name: 'Ruslana',
    role: 'Board Member',
    email: 'ruslana@balizero.com',
    pin: '293518',
    department: 'management',
    language: 'English',
    aliases: ['ruslana', 'i am ruslana', 'my name is ruslana', 'sono ruslana'],
    personalizedResponse:
      'Welcome back Ruslana! As a Board Member, you have full access to all Bali Zero systems.',
  },

  // Technology & AI
  zero: {
    id: 'zero',
    name: 'Zero',
    role: 'AI Bridge/Tech Lead',
    email: 'zero@balizero.com',
    pin: '010719',
    department: 'technology',
    language: 'Italian',
    aliases: ['zero', 'sono zero', "i'm zero", 'io sono zero', 'ciao sono zero'],
    personalizedResponse:
      'Ciao Zero! Bentornato. Come capo del team tech, hai accesso completo a tutti i sistemi ZANTARA e Bali Zero.',
  },

  // Setup Team - Indonesian
  amanda: {
    id: 'amanda',
    name: 'Amanda',
    role: 'Executive Consultant',
    email: 'amanda@balizero.com',
    pin: '614829',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['amanda', 'saya amanda', 'halo saya amanda'],
    personalizedResponse:
      'Selamat datang Amanda! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  anton: {
    id: 'anton',
    name: 'Anton',
    role: 'Executive Consultant',
    email: 'anton@balizero.com',
    pin: '538147',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['anton', 'saya anton', 'halo saya anton'],
    personalizedResponse:
      'Selamat datang Anton! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  vino: {
    id: 'vino',
    name: 'Vino',
    role: 'Junior Consultant',
    email: 'vino@balizero.com',
    pin: '926734',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['vino', 'saya vino', 'halo saya vino'],
    personalizedResponse:
      'Selamat datang Vino! Sebagai Junior Consultant, Anda dapat mengakses sistem Bali Zero.',
  },
  krisna: {
    id: 'krisna',
    name: 'Krisna',
    role: 'Executive Consultant',
    email: 'krisna@balizero.com',
    pin: '471592',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['krisna', 'saya krisna', 'halo saya krisna'],
    personalizedResponse:
      'Selamat datang Krisna! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  adit: {
    id: 'adit',
    name: 'Adit',
    role: 'Crew Lead',
    email: 'adit@balizero.com',
    pin: '385216',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['adit', 'saya adit', 'halo saya adit'],
    personalizedResponse:
      'Selamat datang Adit! Sebagai Crew Lead, Anda dapat mengakses sistem Bali Zero.',
  },
  ari: {
    id: 'ari',
    name: 'Ari',
    role: 'Specialist Consultant',
    email: 'ari@balizero.com',
    pin: '759483',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['ari', 'saya ari', 'halo saya ari'],
    personalizedResponse:
      'Selamat datang Ari! Sebagai Specialist Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  dea: {
    id: 'dea',
    name: 'Dea',
    role: 'Executive Consultant',
    email: 'dea@balizero.com',
    pin: '162847',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['dea', 'saya dea', 'halo saya dea'],
    personalizedResponse:
      'Selamat datang Dea! Sebagai Executive Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  surya: {
    id: 'surya',
    name: 'Surya',
    role: 'Specialist Consultant',
    email: 'surya@balizero.com',
    pin: '894621',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['surya', 'saya surya', 'halo saya surya'],
    personalizedResponse:
      'Selamat datang Surya! Sebagai Specialist Consultant, Anda dapat mengakses semua sistem Bali Zero.',
  },
  damar: {
    id: 'damar',
    name: 'Damar',
    role: 'Junior Consultant',
    email: 'damar@balizero.com',
    pin: '637519',
    department: 'setup',
    language: 'Indonesian',
    aliases: ['damar', 'saya damar', 'halo saya damar'],
    personalizedResponse:
      'Selamat datang Damar! Sebagai Junior Consultant, Anda dapat mengakses sistem Bali Zero.',
  },

  // Tax Department
  veronika: {
    id: 'veronika',
    name: 'Veronika',
    role: 'Tax Manager',
    email: 'veronika@balizero.com',
    pin: '418639',
    department: 'tax',
    language: 'Ukrainian',
    aliases: ['veronika', 'я вероніка', 'i am veronika', 'sono veronika'],
    personalizedResponse:
      'Ласкаво просимо Вероніка! Як Tax Manager, у вас є повний доступ до всіх систем Bali Zero.',
  },
  olena: {
    id: 'olena',
    name: 'Olena',
    role: 'External Tax Advisory',
    email: 'olena@balizero.com',
    pin: '925814',
    department: 'tax',
    language: 'Ukrainian',
    aliases: ['olena', 'я олена', 'i am olena', 'sono olena'],
    personalizedResponse:
      'Ласкаво просимо Олена! Як External Tax Advisory, у вас є доступ до систем Bali Zero.',
  },
  angel: {
    id: 'angel',
    name: 'Angel',
    role: 'Tax Expert',
    email: 'angel@balizero.com',
    pin: '341758',
    department: 'tax',
    language: 'English',
    aliases: ['angel', 'i am angel', 'my name is angel', 'sono angel'],
    personalizedResponse: 'Welcome Angel! As Tax Expert, you have access to all Bali Zero systems.',
  },
  kadek: {
    id: 'kadek',
    name: 'Kadek',
    role: 'Tax Consultant',
    email: 'kadek@balizero.com',
    pin: '786294',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['kadek', 'saya kadek', 'halo saya kadek'],
    personalizedResponse:
      'Selamat datang Kadek! Sebagai Tax Consultant, Anda dapat mengakses sistem Bali Zero.',
  },
  dewaayu: {
    id: 'dewaayu',
    name: 'Dewa Ayu',
    role: 'Tax Consultant',
    email: 'dewaayu@balizero.com',
    pin: '259176',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['dewa ayu', 'dewaayu', 'saya dewa ayu', 'halo saya dewa ayu'],
    personalizedResponse:
      'Selamat datang Dewa Ayu! Sebagai Tax Consultant, Anda dapat mengakses sistem Bali Zero.',
  },
  faisha: {
    id: 'faisha',
    name: 'Faisha',
    role: 'Tax Care',
    email: 'faisha@balizero.com',
    pin: '673942',
    department: 'tax',
    language: 'Indonesian',
    aliases: ['faisha', 'saya faisha', 'halo saya faisha'],
    personalizedResponse:
      'Selamat datang Faisha! Sebagai Tax Care, Anda dapat mengakses sistem Bali Zero.',
  },

  // Reception & Marketing
  rina: {
    id: 'rina',
    name: 'Rina',
    role: 'Reception',
    email: 'rina@balizero.com',
    pin: '214876',
    department: 'reception',
    language: 'Indonesian',
    aliases: ['rina', 'saya rina', 'halo saya rina'],
    personalizedResponse:
      'Selamat datang Rina! Sebagai Reception, Anda dapat mengakses sistem Bali Zero.',
  },
  nina: {
    id: 'nina',
    name: 'Nina',
    role: 'Marketing Advisory',
    email: 'nina@balizero.com',
    pin: '582931',
    department: 'marketing',
    language: 'English',
    aliases: ['nina', 'i am nina', 'my name is nina', 'sono nina'],
    personalizedResponse:
      'Welcome Nina! As Marketing Advisory, you have access to Bali Zero systems.',
  },
  sahira: {
    id: 'sahira',
    name: 'Sahira',
    role: 'Marketing Specialist',
    email: 'sahira@balizero.com',
    pin: '512638',
    department: 'marketing',
    language: 'Indonesian',
    aliases: ['sahira', 'saya sahira', 'halo saya sahira'],
    personalizedResponse:
      'Selamat datang Sahira! Sebagai Marketing Specialist, Anda dapat mengakses sistem Bali Zero.',
  },
  marta: {
    id: 'marta',
    name: 'Marta',
    role: 'External Advisory',
    email: 'marta@balizero.com',
    pin: '847325',
    department: 'advisory',
    language: 'Italian',
    aliases: ['marta', 'sono marta', 'ciao sono marta', 'i am marta'],
    personalizedResponse:
      'Ciao Marta! Benvenuta. Come External Advisory, hai accesso ai sistemi Bali Zero.',
  },
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
  for (const [_key, teamMember] of Object.entries(TEAM_RECOGNITION)) {
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
