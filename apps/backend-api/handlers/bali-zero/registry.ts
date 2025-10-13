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
    'oracle.simulate': oracleSimulate,
    'oracle.analyze': oracleAnalyze,
    'oracle.predict': oraclePredict
  }, {
    requiresAuth: true,
    description: 'Business simulation and prediction'
  });

  // Advisory handlers
  globalRegistry.registerModule('bali-zero', {
    'document.prepare': documentPrepare,
    'assistant.route': assistantRoute
  }, {
    requiresAuth: true,
    description: 'Business advisory services'
  });

  // KBLI handlers
  globalRegistry.registerModule('bali-zero', {
    'kbli.lookup': kbliLookup,
    'kbli.requirements': kbliRequirements
  }, {
    requiresAuth: false,
    description: 'Indonesian business classification'
  });

  // Pricing handlers
  globalRegistry.registerModule('bali-zero', {
    'pricing.get': baliZeroPricing,
    'pricing.quick': baliZeroQuickPrice
  }, {
    requiresAuth: false,
    description: 'Official Bali Zero pricing'
  });

  // Team handlers
  globalRegistry.registerModule('bali-zero', {
    'team.list': teamList,
    'team.get': teamGet,
    'team.departments': teamDepartments
  }, {
    requiresAuth: true,
    description: 'Team management'
  });

  console.log('✅ Bali Zero handlers registered');
}

registerBaliZeroHandlers();
