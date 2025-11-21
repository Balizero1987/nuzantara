/**
 * Identity & Onboarding Module Registry
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { identityResolve, onboardingStart } from './identity.js';

export function registerIdentityHandlers() {
  // Identity handlers
  globalRegistry.registerModule(
    'identity',
    {
      resolve: identityResolve,
      'onboarding.start': onboardingStart,
      'onboarding.ambaradam.start': onboardingStart, // Alias
    },
    { requiresAuth: false, description: 'AMBARADAM identity system' }
  );

  logger.info('✅ Identity handlers registered');
}

registerIdentityHandlers();
