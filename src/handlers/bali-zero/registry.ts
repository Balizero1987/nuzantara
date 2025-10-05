/**
 * Bali Zero Business Services Registry
 * Auto-registers all Indonesian business service handlers
 */

import { globalRegistry } from '../../core/handler-registry.js';
import { oracleSimulate, oracleAnalyze, oraclePredict } from './oracle.js';
import { documentPrepare, assistantRoute } from './advisory.js';
import { kbliLookup, kbliRequirements } from './kbli.js';
import { baliZeroPricing, baliZeroQuickPrice } from './bali-zero-pricing.js';
import { teamList, teamGet, teamDepartments } from './team.js';

export function registerBaliZeroHandlers() {
  // Oracle handlers
  globalRegistry.registerModule('bali-zero', {
    'oracle.simulate': oracleSimulate as any,
    'oracle.analyze': oracleAnalyze as any,
    'oracle.predict': oraclePredict as any
  } as any, {
    requiresAuth: true,
    description: 'Business simulation and prediction'
  });

  // Advisory handlers
  globalRegistry.registerModule('bali-zero', {
    'document.prepare': documentPrepare as any,
    'assistant.route': assistantRoute as any
  } as any, {
    requiresAuth: true,
    description: 'Business advisory services'
  });

  // KBLI handlers
  globalRegistry.registerModule('bali-zero', {
    'kbli.lookup': kbliLookup as any,
    'kbli.requirements': kbliRequirements as any
  } as any, {
    requiresAuth: false,
    description: 'Indonesian business classification'
  });

  // Pricing handlers
  globalRegistry.registerModule('bali-zero', {
    'pricing.get': baliZeroPricing as any,
    'pricing.quick': baliZeroQuickPrice as any
  } as any, {
    requiresAuth: false,
    description: 'Official Bali Zero pricing'
  });

  // Team handlers
  globalRegistry.registerModule('bali-zero', {
    'team.list': teamList as any,
    'team.get': teamGet as any,
    'team.departments': teamDepartments as any
  } as any, {
    requiresAuth: true,
    description: 'Team management'
  });

  console.log('✅ Bali Zero handlers registered');
}

registerBaliZeroHandlers();
