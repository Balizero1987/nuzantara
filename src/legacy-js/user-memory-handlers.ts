/**
 * User Memory Handlers for ZANTARA Custom GPT
 * Manages user profiles and conversation history in Firestore
 */

import { saveMemory, getMemory } from './memory.js';
import { BridgeError } from '../utils/errors.js';

export const userMemoryHandlers = {
  /**
   * Save or update user profile and conversation history
   */
  'user.memory.save': async (params: any) => {
    const { userId, profile_facts, summary, counters } = params;

    if (!userId) {
      throw new BridgeError(400, 'USER_ID_REQUIRED', 'userId is required');
    }

    // Normalize userId to lowercase for consistency
    const normalizedUserId = userId.toLowerCase().trim();

    // Get existing memory
    const existing = await getMemory(normalizedUserId);

    // Merge new facts with existing ones
    const mergedFacts = [
      ...(existing.profile_facts || []),
      ...(profile_facts || [])
    ];

    // Update counters
    const mergedCounters = {
      ...(existing.counters || {}),
      ...(counters || {})
    };

    // Save updated memory
    await saveMemory({
      userId: normalizedUserId,
      profile_facts: mergedFacts,
      summary: summary || existing.summary || '',
      counters: mergedCounters,
      tenant: 'bali_zero'
    });

    return {
      ok: true,
      userId: normalizedUserId,
      message: `Memory updated for ${normalizedUserId}`,
      facts_count: mergedFacts.length,
      counters: mergedCounters
    };
  },

  /**
   * Retrieve user profile and history
   */
  'user.memory.retrieve': async (params: any) => {
    const { userId } = params;

    if (!userId) {
      throw new BridgeError(400, 'USER_ID_REQUIRED', 'userId is required');
    }

    const normalizedUserId = userId.toLowerCase().trim();
    const memory = await getMemory(normalizedUserId);

    return {
      ok: true,
      userId: normalizedUserId,
      profile: {
        summary: memory.summary || `${userId} - Team member`,
        facts: memory.profile_facts || [],
        counters: memory.counters || {},
        updated_at: memory.updated_at || null
      },
      exists: (memory.profile_facts && memory.profile_facts.length > 0)
    };
  },

  /**
   * Admin function to get all users (Zero only)
   */
  'user.memory.list': async (params: any) => {
    const { adminUser } = params;

    // Only Zero can list all users
    if (!adminUser || adminUser.toLowerCase() !== 'zero') {
      throw new BridgeError(403, 'FORBIDDEN', 'Only Zero can access all users');
    }

    // This would need Firestore query implementation
    // For now, return structure example
    return {
      ok: true,
      message: "User list endpoint ready for implementation",
      note: "Requires Firestore collection query to list all users"
    };
  },

  /**
   * Update login counter
   */
  'user.memory.login': async (params: any) => {
    const { userId } = params;

    if (!userId) {
      throw new BridgeError(400, 'USER_ID_REQUIRED', 'userId is required');
    }

    const normalizedUserId = userId.toLowerCase().trim();
    const existing = await getMemory(normalizedUserId);

    const now = new Date().toISOString();
    const loginFact = `${now.split('T')[0]}: Logged in at ${now.split('T')[1].split('.')[0]}`;

    await saveMemory({
      userId: normalizedUserId,
      profile_facts: [...(existing.profile_facts || []), loginFact],
      summary: existing.summary || `${userId} - Bali Zero team member`,
      counters: {
        ...(existing.counters || {}),
        logins: ((existing.counters?.logins || 0) + 1)
      },
      tenant: 'bali_zero'
    });

    return {
      ok: true,
      userId: normalizedUserId,
      message: `Login recorded for ${normalizedUserId}`,
      login_count: (existing.counters?.logins || 0) + 1
    };
  }
};

// Team members for validation
export const BALI_ZERO_TEAM = [
  // Management
  'zero', 'zainal', 'ruslana',
  // Legal/Admin
  'amanda', 'anton', 'vino', 'krisna', 'adit', 'ari', 'dea', 'surya', 'marta',
  // Tax
  'angel', 'kadek', 'dewa', 'faisha',
  // Business Dev
  'olena', 'nina', 'sahira', 'rina'
];

export function isValidTeamMember(name: string): boolean {
  return BALI_ZERO_TEAM.includes(name.toLowerCase().trim());
}