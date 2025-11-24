/**
 * ZANTARA Team Members Configuration
 * Source of Truth for Authentication
 * 
 * "Fai funzionare per sempre" - Hardcoded for reliability
 */

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  pin: string; // Plaintext for simplicity/reliability as requested
  role: 'admin' | 'manager' | 'staff' | 'demo';
  department: string;
  position: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    email: 'amanda@balizero.com',
    name: 'Amanda Wong',
    pin: '1234',
    role: 'admin',
    department: 'management',
    position: 'Lead Executive',
  },
  {
    id: '2',
    email: 'alessia@balizero.com',
    name: 'Alessia Marchetti',
    pin: '1234',
    role: 'admin',
    department: 'advisory',
    position: 'Legal Director',
  },
  {
    id: '3',
    email: 'marco@balizero.com',
    name: 'Marco Bianchi',
    pin: '1234',
    role: 'manager',
    department: 'setup',
    position: 'Setup Manager',
  },
  {
    id: '4',
    email: 'sofia@balizero.com',
    name: 'Sofia Rossi',
    pin: '1234',
    role: 'staff',
    department: 'tax',
    position: 'Tax Specialist',
  },
  {
    id: '5',
    email: 'demo@balizero.com',
    name: 'Demo User',
    pin: '0000',
    role: 'demo',
    department: 'public',
    position: 'Demo Account',
  },
  {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    pin: '1234',
    role: 'admin',
    department: 'Engineering',
    position: 'Test Account',
  },
  // Additional Team Members from DB (Migrated for reliability)
  {
    id: 'zero',
    email: 'zero@balizero.com',
    name: 'Zero',
    pin: '0000',
    role: 'admin',
    department: 'AI',
    position: 'System Administrator',
  }
];

export const getTeamMemberByEmail = (email: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase().trim());
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.id === id);
};
