/**
 * ZANTARA Team Members Configuration
 * Source of Truth for Authentication
 * 
 * "Fai funzionare per sempre" - Hardcoded for reliability
 * Updated with full team roster but simplified PINs for immediate access
 */

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  pin: string; // Plaintext for simplicity/reliability as requested
  role: 'admin' | 'manager' | 'staff' | 'demo' | 'CEO' | 'Board Member' | 'Founder' | 'Consultant' | 'Executive Consultant' | 'Junior Consultant' | 'Supervisor' | 'Team Leader' | 'Tax Manager' | 'Advisory' | 'Tax Lead' | 'Tax Care' | 'Reception' | 'Marketing Advisory' | 'Marketing & Accounting';
  department: string;
  position: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'zainal',
    name: 'Zainal Abidin',
    email: 'zainal@balizero.com',
    role: 'CEO',
    department: 'management',
    position: 'CEO',
    pin: '1234'
  },
  {
    id: 'ruslana',
    name: 'Ruslana',
    email: 'ruslana@balizero.com',
    role: 'Board Member',
    department: 'management',
    position: 'Board Member',
    pin: '1234'
  },
  {
    id: 'zero',
    name: 'Zero',
    email: 'zero@balizero.com',
    role: 'Founder',
    department: 'AI',
    position: 'System Administrator',
    pin: '0000'
  },
  {
    id: 'amanda',
    name: 'Amanda Wong',
    email: 'amanda@balizero.com',
    role: 'Consultant',
    department: 'setup',
    position: 'Lead Executive',
    pin: '1234'
  },
  {
    id: 'alessia',
    name: 'Alessia Marchetti',
    email: 'alessia@balizero.com',
    role: 'admin',
    department: 'advisory',
    position: 'Legal Director',
    pin: '1234'
  },
  {
    id: 'marco',
    name: 'Marco Bianchi',
    email: 'marco@balizero.com',
    role: 'manager',
    department: 'setup',
    position: 'Setup Manager',
    pin: '1234'
  },
  {
    id: 'sofia',
    name: 'Sofia Rossi',
    email: 'sofia@balizero.com',
    role: 'staff',
    department: 'tax',
    position: 'Tax Specialist',
    pin: '1234'
  },
  {
    id: 'anton',
    name: 'Anton',
    email: 'anton@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '1234'
  },
  {
    id: 'vino',
    name: 'Vino',
    email: 'info@balizero.com',
    role: 'Junior Consultant',
    department: 'setup',
    position: 'Junior Consultant',
    pin: '1234'
  },
  {
    id: 'krisna',
    name: 'Krisna',
    email: 'krisna@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '1234'
  },
  {
    id: 'adit',
    name: 'Adit',
    email: 'consulting@balizero.com',
    role: 'Supervisor',
    department: 'setup',
    position: 'Supervisor',
    pin: '1234'
  },
  {
    id: 'ari',
    name: 'Ari Firda',
    email: 'ari.firda@balizero.com',
    role: 'Team Leader',
    department: 'setup',
    position: 'Team Leader',
    pin: '1234'
  },
  {
    id: 'dea',
    name: 'Dea',
    email: 'dea@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '1234'
  },
  {
    id: 'surya',
    name: 'Surya',
    email: 'surya@balizero.com',
    role: 'Team Leader',
    department: 'setup',
    position: 'Team Leader',
    pin: '1234'
  },
  {
    id: 'damar',
    name: 'Damar',
    email: 'damar@balizero.com',
    role: 'Junior Consultant',
    department: 'setup',
    position: 'Junior Consultant',
    pin: '1234'
  },
  {
    id: 'veronika',
    name: 'Veronika',
    email: 'tax@balizero.com',
    role: 'Tax Manager',
    department: 'tax',
    position: 'Tax Manager',
    pin: '1234'
  },
  {
    id: 'olena',
    name: 'Olena',
    email: 'olena@balizero.com',
    role: 'Advisory',
    department: 'advisory',
    position: 'Advisory',
    pin: '1234'
  },
  {
    id: 'marta',
    name: 'Marta',
    email: 'marta@balizero.com',
    role: 'Advisory',
    department: 'advisory',
    position: 'Advisory',
    pin: '1234'
  },
  {
    id: 'angel',
    name: 'Angel',
    email: 'angel.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '1234'
  },
  {
    id: 'kadek',
    name: 'Kadek',
    email: 'kadek.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '1234'
  },
  {
    id: 'dewaayu',
    name: 'Dewa Ayu',
    email: 'dewa.ayu.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '1234'
  },
  {
    id: 'faisha',
    name: 'Faisha',
    email: 'faisha.tax@balizero.com',
    role: 'Tax Care',
    department: 'tax',
    position: 'Tax Care',
    pin: '1234'
  },
  {
    id: 'rina',
    name: 'Rina',
    email: 'rina@balizero.com',
    role: 'Reception',
    department: 'operations',
    position: 'Reception',
    pin: '1234'
  },
  {
    id: 'nina',
    name: 'Nina',
    email: 'nina@balizero.com',
    role: 'Marketing Advisory',
    department: 'marketing',
    position: 'Marketing Advisory',
    pin: '1234'
  },
  {
    id: 'sahira',
    name: 'Sahira',
    email: 'sahira@balizero.com',
    role: 'Marketing & Accounting',
    department: 'marketing',
    position: 'Marketing & Accounting',
    pin: '1234'
  }
];

export const getTeamMemberByEmail = (email: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase().trim());
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.id === id);
};
