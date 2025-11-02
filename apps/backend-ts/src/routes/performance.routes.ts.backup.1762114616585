/**
 * Performance Monitoring Routes
 *
 * RESTful API endpoints for performance metrics and health monitoring:
 * - Real-time performance metrics
 * - Prometheus metrics export
 * - Health checks with performance data
 * - Alert management
 *
 * @author ZANTARA Performance Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import {
  performanceMetricsRoute,
  prometheusMetricsRoute,
  performanceHealthRoute
} from '../middleware/performance-middleware.js';
import { performanceMonitor } from '../services/monitoring/performance-monitor.js';
import logger from '../services/logger.js';

const router = Router();

/**
 * GET /performance/metrics
 * Get comprehensive performance metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  performanceMetricsRoute(req, res);
});

/**
 * GET /performance/prometheus
 * Export metrics in Prometheus format
 */
router.get('/prometheus', (req: Request, res: Response) => {
  prometheusMetricsRoute(req, res);
});

/**
 * GET /performance/health
 * Health check with performance status
 */
router.get('/health', (req: Request, res: Response) => {
  performanceHealthRoute(req, res);
});

/**
 * GET /performance/alerts
 * Get active performance alerts
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const alerts = performanceMonitor.getActiveAlerts();

    res.json({
      ok: true,
      data: {
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        lastUpdated: new Date().toISOString()
      },
      meta: {
        service: 'zantara-performance-alerts',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Performance alerts error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get performance alerts',
      details: error.message
    });
  }
});

/**
 * GET /performance/summary
 * Get detailed performance summary
 */
router.get('/summary', (req: Request, res: Response) => {
  try {
    const { timeWindow = 60 } = req.query;
    const timeWindowMinutes = parseInt(timeWindow as string) || 60;

    const summary = performanceMonitor.getPerformanceSummary(timeWindowMinutes);

    res.json({
      ok: true,
      data: summary,
      meta: {
        timeWindowMinutes,
        service: 'zantara-performance-summary',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Performance summary error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get performance summary',
      details: error.message
    });
  }
});

/**
 * GET /performance/cleanup
 * Clean up old metrics (admin only)
 */
router.post('/cleanup', (req: Request, res: Response) => {
  try {
    const { olderThan = 1440 } = req.body; // Default 24 hours
    const olderThanMinutes = parseInt(olderThan) || 1440;

    performanceMonitor.clearMetrics(olderThanMinutes);

    res.json({
      ok: true,
      data: {
        message: `Cleaned up metrics older than ${olderThanMinutes} minutes`,
        olderThanMinutes,
        timestamp: new Date().toISOString()
      },
      meta: {
        service: 'zantara-performance-cleanup',
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Performance cleanup error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to cleanup performance metrics',
      details: error.message
    });
  }
});

/**
 * GET /performance/dashboard
 * Get dashboard-ready performance data
 */
router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const { timeWindow = 60 } = req.query;
    const timeWindowMinutes = parseInt(timeWindow as string) || 60;

    // Get comprehensive data for dashboard
    const summary = performanceMonitor.getPerformanceSummary(timeWindowMinutes);
    const v3Metrics = performanceMonitor.getV3Metrics(timeWindowMinutes);
    const alerts = performanceMonitor.getActiveAlerts();

    // Prepare dashboard data
    const dashboardData = {
      overview: {
        healthScore: summary.health,
        totalRequests: summary.summary.totalRequests,
        averageResponseTime: summary.summary.averageResponseTime,
        cacheHitRate: summary.summary.cacheHitRate,
        errorRate: summary.summary.errorRate,
        requestsPerMinute: summary.summary.requestsPerMinute,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length
      },
      endpoints: Object.entries(v3Metrics).map(([endpoint, metrics]) => ({
        endpoint,
        requests: metrics.totalRequests,
        avgResponseTime: Math.round(metrics.averageResponseTime),
        p95ResponseTime: Math.round(metrics.p95ResponseTime),
        cacheHitRate: Math.round(metrics.cacheHitRate * 100),
        errorRate: Math.round(metrics.errorRate * 100),
        requestsPerMinute: Math.round(metrics.requestsPerMinute * 10) / 10,
        health: metrics.averageResponseTime < 1000 && metrics.errorRate < 0.05 ? 'good' :
              metrics.averageResponseTime < 5000 && metrics.errorRate < 0.1 ? 'warning' : 'critical'
      })),
      alerts: alerts.slice(0, 20), // Top 20 alerts
      domainPerformance: summary.domainPerformance,
      trends: {
        // Calculate simple trends (would be enhanced in real implementation)
        responseTimeTrend: calculateTrend(v3Metrics, 'averageResponseTime'),
        cacheHitTrend: calculateTrend(v3Metrics, 'cacheHitRate'),
        errorRateTrend: calculateTrend(v3Metrics, 'errorRate')
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      ok: true,
      data: dashboardData,
      meta: {
        timeWindowMinutes,
        service: 'zantara-performance-dashboard',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Performance dashboard error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get performance dashboard',
      details: error.message
    });
  }
});

/**
 * Calculate simple trend for metrics
 * This is a placeholder - real implementation would use historical data
 */
function calculateTrend(metrics: any, field: string): string {
  const values = Object.values(metrics).map((m: any) => m[field]);
  if (values.length < 2) return 'stable';

  const avg = values.reduce((sum: number, val: any) => sum + val, 0) / values.length;
  const latest = values[values.length - 1];

  if (latest > avg * 1.1) return 'improving';
  if (latest < avg * 0.9) return 'degrading';
  return 'stable';
}

export default router;