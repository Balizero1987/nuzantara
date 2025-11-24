/**
 * ZANTARA Team Members Configuration
 * Source of Truth for Authentication
 * 
 * "Fai funzionare per sempre" - Hardcoded for reliability
 * Updated with full team roster for maximum coherence
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
    pin: '847261'
  },
  {
    id: 'ruslana',
    name: 'Ruslana',
    email: 'ruslana@balizero.com',
    role: 'Board Member',
    department: 'management',
    position: 'Board Member',
    pin: '293518'
  },
  {
    id: 'zero',
    name: 'Zero',
    email: 'zero@balizero.com',
    role: 'Founder',
    department: 'AI',
    position: 'System Administrator',
    pin: '010719'
  },
  {
    id: 'amanda',
    name: 'Amanda Wong', // Normalized name
    email: 'amanda@balizero.com',
    role: 'Consultant',
    department: 'setup',
    position: 'Lead Executive',
    pin: '614829'
  },
  {
    id: 'anton',
    name: 'Anton',
    email: 'anton@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '538147'
  },
  {
    id: 'vino',
    name: 'Vino',
    email: 'info@balizero.com',
    role: 'Junior Consultant',
    department: 'setup',
    position: 'Junior Consultant',
    pin: '926734'
  },
  {
    id: 'krisna',
    name: 'Krisna',
    email: 'krisna@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '471592'
  },
  {
    id: 'adit',
    name: 'Adit',
    email: 'consulting@balizero.com',
    role: 'Supervisor',
    department: 'setup',
    position: 'Supervisor',
    pin: '385216'
  },
  {
    id: 'ari',
    name: 'Ari Firda',
    email: 'ari.firda@balizero.com',
    role: 'Team Leader',
    department: 'setup',
    position: 'Team Leader',
    pin: '759483'
  },
  {
    id: 'dea',
    name: 'Dea',
    email: 'dea@balizero.com',
    role: 'Executive Consultant',
    department: 'setup',
    position: 'Executive Consultant',
    pin: '162847'
  },
  {
    id: 'surya',
    name: 'Surya',
    email: 'surya@balizero.com',
    role: 'Team Leader',
    department: 'setup',
    position: 'Team Leader',
    pin: '894621'
  },
  {
    id: 'damar',
    name: 'Damar',
    email: 'damar@balizero.com',
    role: 'Junior Consultant',
    department: 'setup',
    position: 'Junior Consultant',
    pin: '637519'
  },
  {
    id: 'veronika',
    name: 'Veronika',
    email: 'tax@balizero.com',
    role: 'Tax Manager',
    department: 'tax',
    position: 'Tax Manager',
    pin: '418639'
  },
  {
    id: 'olena',
    name: 'Olena',
    email: 'olena@balizero.com',
    role: 'Advisory',
    department: 'advisory',
    position: 'Advisory',
    pin: '925814'
  },
  {
    id: 'marta',
    name: 'Marta',
    email: 'marta@balizero.com',
    role: 'Advisory',
    department: 'advisory',
    position: 'Advisory',
    pin: '847325'
  },
  {
    id: 'angel',
    name: 'Angel',
    email: 'angel.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '341758'
  },
  {
    id: 'kadek',
    name: 'Kadek',
    email: 'kadek.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '786294'
  },
  {
    id: 'dewaayu',
    name: 'Dewa Ayu',
    email: 'dewa.ayu.tax@balizero.com',
    role: 'Tax Lead',
    department: 'tax',
    position: 'Tax Lead',
    pin: '259176'
  },
  {
    id: 'faisha',
    name: 'Faisha',
    email: 'faisha.tax@balizero.com',
    role: 'Tax Care',
    department: 'tax',
    position: 'Tax Care',
    pin: '673942'
  },
  {
    id: 'rina',
    name: 'Rina',
    email: 'rina@balizero.com',
    role: 'Reception',
    department: 'operations',
    position: 'Reception',
    pin: '214876'
  },
  {
    id: 'nina',
    name: 'Nina',
    email: 'nina@balizero.com',
    role: 'Marketing Advisory',
    department: 'marketing',
    position: 'Marketing Advisory',
    pin: '582931'
  },
  {
    id: 'sahira',
    name: 'Sahira',
    email: 'sahira@balizero.com',
    role: 'Marketing & Accounting',
    department: 'marketing',
    position: 'Marketing & Accounting',
    pin: '512638'
  }
];

export const getTeamMemberByEmail = (email: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.email.toLowerCase() === email.toLowerCase().trim());
};

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(m => m.id === id);
};
