/**
 * Analytics & Monitoring Module Registry
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { analyticsHandlers } from './analytics.js';
import {
  dashboardMain,
  dashboardConversations,
  dashboardServices,
  dashboardHandlers,
  dashboardHealth,
  dashboardUsers
} from './dashboard-analytics.js';
import { weeklyReportHandlers } from './weekly-report.js';
import {
  updateDailyRecap,
  getCurrentDailyRecap
} from './daily-drive-recap.js';

export function registerAnalyticsHandlers() {
  // Analytics handlers (object-based)
  if (analyticsHandlers && typeof analyticsHandlers === 'object') {
    for (const [key, handler] of Object.entries(analyticsHandlers)) {
      globalRegistry.register({
        key: `analytics.${key}`,
        handler,
        module: 'analytics',
        requiresAuth: true
      });
    }
  }

  // Dashboard handlers
  globalRegistry.registerModule('analytics', {
    'dashboard.main': dashboardMain,
    'dashboard.conversations': dashboardConversations,
    'dashboard.services': dashboardServices,
    'dashboard.handlers': dashboardHandlers,
    'dashboard.health': dashboardHealth,
    'dashboard.users': dashboardUsers
  }, { requiresAuth: true });

  // Weekly report handlers (object-based)
  if (weeklyReportHandlers && typeof weeklyReportHandlers === 'object') {
    for (const [key, handler] of Object.entries(weeklyReportHandlers)) {
      globalRegistry.register({
        key: `weekly.report.${key}`,
        handler,
        module: 'analytics',
        requiresAuth: true
      });
    }
  }

  // Daily recap handlers
  globalRegistry.registerModule('analytics', {
    'daily.recap.update': updateDailyRecap,
    'daily.recap.get': getCurrentDailyRecap
  }, { requiresAuth: true });

  logger.info('✅ Analytics handlers registered');
}

registerAnalyticsHandlers();
