/**
 * ZANTARA Collaborative Intelligence Registry
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import {
  zantaraEmotionalProfileAdvanced,
  zantaraConflictPrediction,
  zantaraMultiProjectOrchestration,
  zantaraClientRelationshipIntelligence,
  zantaraCulturalIntelligenceAdaptation,
  zantaraPerformanceOptimization,
} from './zantara-simple.js';
import { getZantaraKnowledge, getSystemHealth } from './knowledge.js';

export function registerZantaraHandlers() {
  // ZANTARA v2 Advanced
  globalRegistry.registerModule(
    'zantara',
    {
      'emotional.profile.advanced': zantaraEmotionalProfileAdvanced,
      'conflict.prediction': zantaraConflictPrediction,
      'multi.project.orchestration': zantaraMultiProjectOrchestration,
      'client.relationship.intelligence': zantaraClientRelationshipIntelligence,
      'cultural.intelligence.adaptation': zantaraCulturalIntelligenceAdaptation,
      'performance.optimization': zantaraPerformanceOptimization,
    },
    { requiresAuth: true, description: 'Advanced Emotional AI' }
  );

  // ZANTARA Knowledge & Health
  globalRegistry.registerModule(
    'zantara',
    {
      knowledge: getZantaraKnowledge,
      health: getSystemHealth,
    },
    { requiresAuth: false, description: 'System Knowledge & Health' }
  );

  logger.info('✅ ZANTARA handlers registered');
}

registerZantaraHandlers();
