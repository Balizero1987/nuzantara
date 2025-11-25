/**
 * Team Members Configuration (Stub)
 * Recreated to fix missing file error during build
 */

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  position?: string;
}

// Default admin user for bootstrap
const defaultAdmin: TeamMember = {
  id: 'admin',
  email: 'admin@zantara.ai',
  name: 'Admin User',
  role: 'Admin',
  department: 'Management',
  position: 'System Administrator'
};

export const teamMembers: TeamMember[] = [defaultAdmin];

export function getTeamMemberById(id: string): TeamMember | undefined {
  return teamMembers.find(m => m.id === id);
}

export function getTeamMemberByEmail(email: string): TeamMember | undefined {
  return teamMembers.find(m => m.email === email);
}