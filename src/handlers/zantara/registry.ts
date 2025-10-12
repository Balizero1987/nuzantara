/**
 * ZANTARA Collaborative Intelligence Registry
 */

import { globalRegistry } from '../../core/handler-registry.js';
import {
  zantaraPersonalityProfile,
  zantaraAttune,
  zantaraSynergyMap,
  zantaraAnticipateNeeds,
  zantaraCommunicationAdapt,
  zantaraLearnTogether,
  zantaraMoodSync,
  zantaraConflictMediate,
  zantaraGrowthTrack,
  zantaraCelebrationOrchestrate
} from './zantara-test.js';
import {
  zantaraEmotionalProfileAdvanced,
  zantaraConflictPrediction,
  zantaraMultiProjectOrchestration,
  zantaraClientRelationshipIntelligence,
  zantaraCulturalIntelligenceAdaptation,
  zantaraPerformanceOptimization
} from './zantara-v2-simple.js';
import {
  zantaraDashboardOverview,
  zantaraTeamHealthMonitor,
  zantaraPerformanceAnalytics,
  zantaraSystemDiagnostics
} from './zantara-dashboard.js';

export function registerZantaraHandlers() {
  // ZANTARA Test Framework
  globalRegistry.registerModule('zantara', {
    'personality.profile': zantaraPersonalityProfile,
    'attune': zantaraAttune,
    'synergy.map': zantaraSynergyMap,
    'anticipate.needs': zantaraAnticipateNeeds,
    'communication.adapt': zantaraCommunicationAdapt,
    'learn.together': zantaraLearnTogether,
    'mood.sync': zantaraMoodSync,
    'conflict.mediate': zantaraConflictMediate,
    'growth.track': zantaraGrowthTrack,
    'celebration.orchestrate': zantaraCelebrationOrchestrate
  }, { requiresAuth: true, description: 'Collaborative Intelligence' });

  // ZANTARA v2 Advanced
  globalRegistry.registerModule('zantara', {
    'emotional.profile.advanced': zantaraEmotionalProfileAdvanced,
    'conflict.prediction': zantaraConflictPrediction,
    'multi.project.orchestration': zantaraMultiProjectOrchestration,
    'client.relationship.intelligence': zantaraClientRelationshipIntelligence,
    'cultural.intelligence.adaptation': zantaraCulturalIntelligenceAdaptation,
    'performance.optimization': zantaraPerformanceOptimization
  }, { requiresAuth: true, description: 'Advanced Emotional AI' });

  // ZANTARA Dashboard
  globalRegistry.registerModule('zantara', {
    'dashboard.overview': zantaraDashboardOverview,
    'team.health.monitor': zantaraTeamHealthMonitor,
    'performance.analytics': zantaraPerformanceAnalytics,
    'system.diagnostics': zantaraSystemDiagnostics
  }, { requiresAuth: true, description: 'Real-time Monitoring' });

  console.log('✅ ZANTARA handlers registered');
}

registerZantaraHandlers();
