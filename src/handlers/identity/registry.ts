/**
 * Identity & Onboarding Module Registry
 */

import { globalRegistry } from '../../core/handler-registry.ts';
import { identityResolve, onboardingStart } from './identity.ts';

export function registerIdentityHandlers() {
  // Identity handlers
  globalRegistry.registerModule('identity', {
    'resolve': identityResolve,
    'onboarding.start': onboardingStart,
    'onboarding.ambaradam.start': onboardingStart // Alias
  }, { requiresAuth: false, description: 'AMBARADAM identity system' });

  console.log('✅ Identity handlers registered');
}

registerIdentityHandlers();
