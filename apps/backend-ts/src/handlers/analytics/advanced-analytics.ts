// 🎯 ZANTARA v3 Ω - Advanced Analytics Handlers
// System behavior analysis, predictive insights, decision support
// Claude Sonnet 4.5 - System Analyst Implementation

import { Request, Response } from 'express';
import { ok } from '../../utils/response.js';
import {
  analyticsEngine,
  SystemMetrics,
} from '../../services/analytics/system-analytics-engine.js';
import logger from '../../services/logger.js';

// ========================================
// SYSTEM BEHAVIOR ANALYSIS
// ========================================

export async function analyzeSystemBehavior(_req: Request, res: Response) {
  try {
    const result = await analyticsEngine.analyzeSystemBehavior();

    return res.json(
      ok({
        service: 'System Behavior Analysis',
        ...result,
        summary: {
          totalInsights: result.insights.length,
          criticalInsights: result.insights.filter((i) => i.severity === 'critical').length,
          patterns: result.patterns.length,
        },
      })
    );
  } catch (error: any) {
    logger.error('System behavior analysis failed:', error);
    return res.status(500).json(
      ok({
        error: 'Analysis failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// PREDICTIVE ANALYTICS
// ========================================

export async function generatePredictiveInsights(_req: Request, res: Response) {
  try {
    const predictions = await analyticsEngine.generatePredictiveInsights();

    return res.json(
      ok({
        service: 'Predictive Analytics',
        predictions,
        summary: {
          trafficTrend: predictions.trafficForecast.confidence > 0.7 ? 'Reliable' : 'Uncertain',
          resourceStatus: predictions.resourceForecast.timeToCapacity,
          riskLevel: predictions.riskAssessment.overall,
          scalingNeeded: predictions.scalingRecommendations.length > 0,
        },
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    logger.error('Predictive insights generation failed:', error);
    return res.status(500).json(
      ok({
        error: 'Prediction failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// ANOMALY DETECTION
// ========================================

export async function detectSystemAnomalies(_req: Request, res: Response) {
  try {
    const result = await analyticsEngine.detectAnomalies();

    return res.json(
      ok({
        service: 'Anomaly Detection',
        ...result,
        status:
          result.critical > 0
            ? 'Critical anomalies detected'
            : result.totalDetected > 0
              ? 'Anomalies detected'
              : 'System normal',
        severity: result.critical > 0 ? 'critical' : result.totalDetected > 0 ? 'warning' : 'info',
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    logger.error('Anomaly detection failed:', error);
    return res.status(500).json(
      ok({
        error: 'Detection failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// SYSTEM HEALTH SCORING
// ========================================

export async function calculateSystemHealth(_req: Request, res: Response) {
  try {
    const healthScore = await analyticsEngine.calculateSystemHealthScore();

    return res.json(
      ok({
        service: 'System Health Scoring',
        ...healthScore,
        status:
          healthScore.overall >= 80
            ? 'Healthy'
            : healthScore.overall >= 60
              ? 'Fair'
              : 'Needs Attention',
        actionRequired: healthScore.recommendations.length > 0,
      })
    );
  } catch (error: any) {
    logger.error('Health scoring failed:', error);
    return res.status(500).json(
      ok({
        error: 'Scoring failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// DECISION SUPPORT
// ========================================

export async function getDecisionSupport(req: Request, res: Response) {
  try {
    const { context } = req.body;

    if (!context || !context.type) {
      return res.status(400).json(
        ok({
          error: 'Decision context required',
          example: {
            type: 'scaling',
            parameters: { currentLoad: 1000 },
            objectives: ['cost_optimization', 'performance'],
          },
        })
      );
    }

    const decision = await analyticsEngine.getDecisionSupport(context);

    return res.json(
      ok({
        service: 'Decision Support System',
        ...decision,
        executionRecommendation:
          decision.confidence > 0.7 ? 'Proceed with confidence' : 'Review alternatives',
      })
    );
  } catch (error: any) {
    logger.error('Decision support failed:', error);
    return res.status(500).json(
      ok({
        error: 'Decision analysis failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// METRICS RECORDING
// ========================================

export async function recordSystemMetrics(req: Request, res: Response) {
  try {
    const metrics: SystemMetrics = req.body.metrics;

    if (!metrics || !metrics.timestamp) {
      return res.status(400).json(
        ok({
          error: 'Valid metrics required',
          example: {
            requestCount: 150,
            errorCount: 2,
            avgResponseTime: 250,
            activeUsers: 25,
            throughput: 75,
            cpuUsage: 55,
            memoryUsage: 65,
            timestamp: Date.now(),
          },
        })
      );
    }

    analyticsEngine.recordMetric(metrics);

    return res.json(
      ok({
        service: 'Metrics Recording',
        recorded: true,
        timestamp: new Date().toISOString(),
        message: 'Metrics recorded successfully',
      })
    );
  } catch (error: any) {
    logger.error('Metrics recording failed:', error);
    return res.status(500).json(
      ok({
        error: 'Recording failed',
        message: error.message,
      })
    );
  }
}

// ========================================
// COMPREHENSIVE ANALYTICS DASHBOARD
// ========================================

export async function getAnalyticsDashboard(_req: Request, res: Response) {
  try {
    const [behavior, predictions, anomalies, health] = await Promise.all([
      analyticsEngine.analyzeSystemBehavior(),
      analyticsEngine.generatePredictiveInsights(),
      analyticsEngine.detectAnomalies(),
      analyticsEngine.calculateSystemHealthScore(),
    ]);

    return res.json(
      ok({
        service: 'Analytics Dashboard',
        timestamp: new Date().toISOString(),
        sections: {
          systemHealth: {
            score: health.overall,
            grade: health.grade,
            components: health.components,
            status: health.overall >= 80 ? 'Healthy' : health.overall >= 60 ? 'Fair' : 'Critical',
          },
          behavior: {
            insights: behavior.insights,
            patterns: behavior.patterns,
            criticalIssues: behavior.insights.filter((i) => i.severity === 'critical').length,
          },
          predictions: {
            traffic: predictions.trafficForecast,
            performance: predictions.performanceForecast,
            risks: predictions.riskAssessment,
            scaling: predictions.scalingRecommendations,
          },
          anomalies: {
            total: anomalies.totalDetected,
            critical: anomalies.critical,
            recent: anomalies.anomalies.slice(0, 5),
          },
        },
        summary: {
          overallStatus:
            health.overall >= 80 ? 'Excellent' : health.overall >= 60 ? 'Good' : 'Needs Attention',
          criticalAlerts:
            behavior.insights.filter((i) => i.severity === 'critical').length + anomalies.critical,
          activeRecommendations:
            health.recommendations.length + predictions.scalingRecommendations.length,
          predictedTrend: predictions.performanceForecast.responseTime.trend,
        },
        recommendations: [
          ...health.recommendations,
          ...predictions.scalingRecommendations.map((r) => `${r.type}: ${r.reason}`),
        ],
      })
    );
  } catch (error: any) {
    logger.error('Dashboard generation failed:', error);
    return res.status(500).json(
      ok({
        error: 'Dashboard unavailable',
        message: error.message,
      })
    );
  }
}

// ========================================
// EXECUTIVE SUMMARY
// ========================================

export async function getExecutiveSummary(_req: Request, res: Response) {
  try {
    const [health, predictions, behavior] = await Promise.all([
      analyticsEngine.calculateSystemHealthScore(),
      analyticsEngine.generatePredictiveInsights(),
      analyticsEngine.analyzeSystemBehavior(),
    ]);

    const criticalIssues = behavior.insights.filter((i) => i.severity === 'critical');
    const highRisks = predictions.riskAssessment.risks.filter(
      (r) => r.level === 'high' || r.level === 'critical'
    );

    return res.json(
      ok({
        service: 'Executive Summary',
        timestamp: new Date().toISOString(),

        kpis: {
          systemHealth: {
            score: health.overall,
            grade: health.grade,
            trend: predictions.performanceForecast.responseTime.trend,
          },
          performance: {
            currentResponseTime: predictions.performanceForecast.responseTime.current,
            predictedResponseTime: predictions.performanceForecast.responseTime.predicted,
            trend: predictions.performanceForecast.responseTime.trend,
          },
          reliability: {
            errorRate: predictions.performanceForecast.errorRate.current,
            availability: health.components.availability,
            trend: predictions.performanceForecast.errorRate.trend,
          },
          capacity: {
            utilizationLevel: predictions.resourceForecast.cpu.current,
            timeToCapacity: predictions.resourceForecast.timeToCapacity,
            scalingNeeded: predictions.scalingRecommendations.length > 0,
          },
        },

        alerts: {
          critical: criticalIssues.length,
          highPriority: highRisks.length,
          total: criticalIssues.length + highRisks.length,
          items: [
            ...criticalIssues.map((i) => ({
              type: 'insight',
              severity: 'critical',
              message: i.message,
            })),
            ...highRisks.map((r) => ({ type: 'risk', severity: r.level, message: r.impact })),
          ].slice(0, 5),
        },

        recommendations: {
          immediate: predictions.scalingRecommendations.filter((r) => r.urgency === 'immediate'),
          planned: predictions.scalingRecommendations.filter((r) => r.urgency === 'planned'),
          strategic: health.recommendations,
        },

        forecast: {
          nextHour: {
            traffic: predictions.trafficForecast.nextHour,
            expectedPeak: predictions.trafficForecast.peakExpected,
          },
          next24Hours: {
            trend: predictions.performanceForecast.responseTime.trend,
            riskLevel: predictions.riskAssessment.overall,
            scalingRecommendations: predictions.scalingRecommendations.length,
          },
        },

        insights: behavior.insights.slice(0, 3).map((i) => ({
          message: i.message,
          recommendation: i.recommendation,
          impact: i.impact,
        })),
      })
    );
  } catch (error: any) {
    logger.error('Executive summary generation failed:', error);
    return res.status(500).json(
      ok({
        error: 'Summary unavailable',
        message: error.message,
      })
    );
  }
}

// ========================================
// REAL-TIME MONITORING
// ========================================

export async function getRealTimeMetrics(_req: Request, res: Response) {
  try {
    const [anomalies, health] = await Promise.all([
      analyticsEngine.detectAnomalies(),
      analyticsEngine.calculateSystemHealthScore(),
    ]);

    return res.json(
      ok({
        service: 'Real-Time Monitoring',
        timestamp: new Date().toISOString(),
        realtime: {
          systemHealth: health.overall,
          anomalyStatus:
            anomalies.critical > 0
              ? 'Critical'
              : anomalies.totalDetected > 0
                ? 'Warning'
                : 'Normal',
          activeAlerts: anomalies.critical,
          performance: {
            score: health.components.performance,
            status: health.components.performance >= 80 ? 'Good' : 'Degraded',
          },
        },
        alerts: anomalies.anomalies.filter((a) => a.severity === 'critical').slice(0, 3),
        recommendations: health.recommendations.slice(0, 3),
      })
    );
  } catch (error: any) {
    logger.error('Real-time monitoring failed:', error);
    return res.status(500).json(
      ok({
        error: 'Monitoring unavailable',
        message: error.message,
      })
    );
  }
}

// ========================================
// ANALYTICS API INFO
// ========================================

export async function getAnalyticsInfo(_req: Request, res: Response) {
  return res.json(
    ok({
      service: 'ZANTARA v3 Ω Analytics Engine',
      version: '1.0.0',
      description: 'Advanced system analytics with predictive capabilities',
      capabilities: [
        'System behavior analysis',
        'Predictive insights generation',
        'Anomaly detection',
        'System health scoring',
        'Decision support',
        'Executive summaries',
      ],
      endpoints: {
        behavior: '/analytics/behavior - Analyze system behavior patterns',
        predictions: '/analytics/predictions - Generate predictive insights',
        anomalies: '/analytics/anomalies - Detect system anomalies',
        health: '/analytics/health - Calculate system health score',
        decision: '/analytics/decision - Get decision support',
        dashboard: '/analytics/dashboard - Comprehensive analytics view',
        executive: '/analytics/executive - Executive summary',
        realtime: '/analytics/realtime - Real-time monitoring',
      },
      features: {
        pattern_recognition: 'Identifies traffic patterns and trends',
        predictive_analytics: 'Forecasts system behavior and resource needs',
        anomaly_detection: 'Real-time detection of system anomalies',
        health_scoring: 'Multi-dimensional system health assessment',
        decision_support: 'AI-powered recommendations for operations',
      },
    })
  );
}
