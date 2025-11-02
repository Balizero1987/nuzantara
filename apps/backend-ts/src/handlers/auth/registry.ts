/**
 * Authentication Module Registry
 *
 * Registers team authentication handlers for ZANTARA/Bali Zero
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { teamLogin } from './team-login.js';

export function registerAuthHandlers() {
  // Team authentication handlers
  globalRegistry.registerModule('team', {
    'login': teamLogin
  }, {
    requiresAuth: false,
    description: 'Team authentication for Bali Zero/ZANTARA'
  });

  logger.info('✅ Auth handlers registered');
}

registerAuthHandlers();
