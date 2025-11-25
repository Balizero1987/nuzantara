/**
 * Team Members Configuration Module
 * Provides database queries for team member data
 */

import { getDatabasePool } from '../services/connection-pool.js';
import logger from '../services/logger.js';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position?: string;
  language?: string;
  personalized_response?: string;
  is_active: boolean;
  last_login?: Date;
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  try {
    const db = getDatabasePool();
    const result = await db.query(
      'SELECT id, name, email, role, department, language, personalized_response, is_active, last_login FROM team_members WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as TeamMember;
  } catch (error) {
    logger.error('Failed to get team member by ID:', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get team member by email
 */
export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  try {
    const db = getDatabasePool();
    const result = await db.query(
      'SELECT id, name, email, role, department, language, personalized_response, is_active, last_login FROM team_members WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as TeamMember;
  } catch (error) {
    logger.error('Failed to get team member by email:', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Get all active team members
 */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const db = getDatabasePool();
    const result = await db.query(
      'SELECT id, name, email, role, department, language, personalized_response, is_active, last_login FROM team_members WHERE is_active = true ORDER BY name'
    );

    return result.rows as TeamMember[];
  } catch (error) {
    logger.error('Failed to get all team members:', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

