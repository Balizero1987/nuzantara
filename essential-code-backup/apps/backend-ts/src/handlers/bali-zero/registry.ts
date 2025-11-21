/**
 * Bali Zero Business Services Registry
 * Auto-registers all Indonesian business service handlers
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { oracleSimulate, oracleAnalyze, oraclePredict } from './oracle.js';
import { oracleUniversalQuery, oracleCollections } from './oracle-universal.js';
import { documentPrepare, assistantRoute } from './advisory.js';
import { kbliLookup, kbliRequirements } from './kbli.js';
import { baliZeroPricing, baliZeroQuickPrice } from './bali-zero-pricing.js';
import { teamList, teamGet, teamDepartments } from './team.js';
import { teamRecentActivity } from './team-activity.js';

export function registerBaliZeroHandlers() {
  // Oracle handlers (basic)
  globalRegistry.registerModule(
    'bali-zero',
    {
      'oracle.simulate': oracleSimulate as any,
      'oracle.analyze': oracleAnalyze as any,
      'oracle.predict': oraclePredict as any,
    } as any,
    {
      requiresAuth: true,
      description: 'Business simulation and prediction',
    }
  );

  // Oracle Universal (RAG-powered)
  globalRegistry.registerModule(
    'oracle',
    {
      query: oracleUniversalQuery as any,
      collections: oracleCollections as any,
    } as any,
    {
      requiresAuth: false,
      description: 'Universal Oracle Query - Intelligent routing to tax/legal/property/visa/kbli',
    }
  );

  // Advisory handlers
  globalRegistry.registerModule(
    'bali-zero',
    {
      'document.prepare': documentPrepare as any,
      'assistant.route': assistantRoute as any,
    } as any,
    {
      requiresAuth: true,
      description: 'Business advisory services',
    }
  );

  // KBLI handlers
  globalRegistry.registerModule(
    'bali-zero',
    {
      'kbli.lookup': kbliLookup as any,
      'kbli.requirements': kbliRequirements as any,
    } as any,
    {
      requiresAuth: false,
      description: 'Indonesian business classification',
    }
  );

  // Pricing handlers
  globalRegistry.registerModule(
    'bali-zero',
    {
      'pricing.get': baliZeroPricing as any,
      'pricing.quick': baliZeroQuickPrice as any,
    } as any,
    {
      requiresAuth: false,
      description: 'Official Bali Zero pricing',
    }
  );

  // Team handlers (registered with direct keys to match router.ts expectations)
  globalRegistry.register({
    key: 'team.list',
    handler: teamList as any,
    module: 'bali-zero',
    requiresAuth: true,
    description: 'List all Bali Zero team members',
  });

  globalRegistry.register({
    key: 'team.get',
    handler: teamGet as any,
    module: 'bali-zero',
    requiresAuth: true,
    description: 'Get specific team member details',
  });

  globalRegistry.register({
    key: 'team.departments',
    handler: teamDepartments as any,
    module: 'bali-zero',
    requiresAuth: true,
    description: 'List team departments',
  });

  globalRegistry.register({
    key: 'team.recent_activity',
    handler: teamRecentActivity as any,
    module: 'bali-zero',
    requiresAuth: true,
    description: 'Get recent team activity with real-time session tracking',
  });

  logger.info('✅ Bali Zero handlers registered');
}

registerBaliZeroHandlers();
