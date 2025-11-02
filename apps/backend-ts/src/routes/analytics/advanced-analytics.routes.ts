// 🧠 ZANTARA v3 Ω - Advanced Analytics Routes
// System behavior, predictive insights, decision support
// Claude Sonnet 4.5 - System Analyst Implementation

import { Router } from 'express';
import {
  analyzeSystemBehavior,
  generatePredictiveInsights,
  detectSystemAnomalies,
  calculateSystemHealth,
  getDecisionSupport,
  recordSystemMetrics,
  getAnalyticsDashboard,
  getExecutiveSummary,
  getRealTimeMetrics,
  getAnalyticsInfo
} from '../../handlers/analytics/advanced-analytics.js';

const router = Router();

/**
 * 🧠 ZANTARA v3 Ω Analytics Engine
 * 
 * Advanced system analytics with predictive capabilities:
 * - System behavior analysis
 * - Predictive insights
 * - Anomaly detection
 * - Health scoring
 * - Decision support
 * - Executive dashboards
 */

// API Info
router.get('/', getAnalyticsInfo);

// System Behavior Analysis
router.get('/behavior', analyzeSystemBehavior);

// Predictive Analytics
router.get('/predictions', generatePredictiveInsights);

// Anomaly Detection
router.get('/anomalies', detectSystemAnomalies);

// System Health Scoring
router.get('/health', calculateSystemHealth);

// Decision Support
router.post('/decision', getDecisionSupport);

// Metrics Recording
router.post('/metrics', recordSystemMetrics);

// Comprehensive Dashboard
router.get('/dashboard', getAnalyticsDashboard);

// Executive Summary
router.get('/executive', getExecutiveSummary);

// Real-Time Monitoring
router.get('/realtime', getRealTimeMetrics);

export default router;
