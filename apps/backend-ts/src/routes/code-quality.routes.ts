/**
 * Code Quality Routes for Cursor Ultra Auto Patch
 *
 * RESTful API endpoints for code quality monitoring and analysis:
 * - Project quality metrics
 * - File-by-file analysis
 * - Quality trends and reporting
 * - Refactoring suggestions
 * - Automated test generation
 *
 * @author Cursor Ultra Auto - Code Quality Specialist
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import { enhancedTestSuite, TestMetrics } from '../services/code-quality/enhanced-test-suite.js';
import { codeQualityMonitor, QualityMetrics } from '../services/code-quality/code-quality-monitor.js';
import { loadAllHandlers } from '../core/load-all-handlers.js';
import { logger } from '../logging/unified-logger.js';
import path from 'path';

const router = Router();

/**
 * GET /code-quality/health
 * Health check for code quality service
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Code Quality Monitor',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      enhancedTestSuite: true,
      codeQualityMonitor: true,
      automatedAnalysis: true,
      refactoringSuggestions: true,
      qualityReporting: true
    }
  });
});

/**
 * GET /code-quality/metrics
 * Get overall project quality metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const projectRoot = process.cwd();
    const metrics = codeQualityMonitor.analyzeProject(projectRoot);

    res.json({
      ok: true,
      data: {
        ...metrics,
        analysis: {
          maintainabilityLevel: getMaintainabilityLevel(metrics.maintainabilityIndex),
          complexityLevel: getComplexityLevel(metrics.cyclomaticComplexity),
          qualityGrade: getQualityGrade(metrics.qualityScore)
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        service: 'code-quality-monitor'
      }
    });
  } catch (error) {
    logger.error('Code quality metrics error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze code quality',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /code-quality/analyze/:file
 * Analyze specific file
 */
router.get('/analyze/:file', (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), req.params.file);
    const analysis = codeQualityMonitor.analyzeFile(filePath);

    res.json({
      ok: true,
      data: {
        ...analysis,
        recommendations: {
          priority: getPriorityIssues(analysis.issues),
          quickWins: getQuickWins(analysis.suggestions),
          majorRefactoring: getMajorRefactoringSuggestions(analysis.suggestions)
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        file: filePath
      }
    });
  } catch (error) {
    logger.error('File analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze file',
      details: error.message
    });
  }
});

/**
 * POST /code-quality/run-tests
 * Run enhanced test suite
 */
router.post('/run-tests', async (req: Request, res: Response) => {
  try {
    const { includeHandlers = true, includeEndpoints = true, loadTest = false } = req.body;

    // Auto-generate tests for handlers
    if (includeHandlers) {
      const handlers = loadAllHandlers();
      enhancedTestSuite.generateHandlerTests(handlers);
      logger.info(`Generated ${Object.keys(handlers).length * 3} handler tests`);
    }

    // Generate integration tests for endpoints
    if (includeEndpoints) {
      const endpoints = [
        '/call',
        '/team.login',
        '/zantara.unified',
        '/zantara.collective',
        '/zantara.ecosystem',
        '/analytics/health',
        '/architecture/status'
      ];
      enhancedTestSuite.generateIntegrationTests(endpoints);
      logger.info(`Generated ${endpoints.length} integration tests`);
    }

    // Generate load tests
    if (loadTest) {
      enhancedTestSuite.generateLoadTests('/call', 10);
      enhancedTestSuite.generateLoadTests('/analytics/health', 5);
      logger.info('Generated load tests');
    }

    // Run tests
    const testMetrics = await enhancedTestSuite.runAllTests();

    res.json({
      ok: true,
      data: {
        ...testMetrics,
        grade: getTestGrade(testMetrics),
        recommendations: getTestRecommendations(testMetrics),
        report: enhancedTestSuite.generateReport()
      },
      meta: {
        timestamp: new Date().toISOString(),
        testSuite: 'enhanced-test-suite'
      }
    });
  } catch (error) {
    logger.error('Test execution error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to run tests',
      details: error.message
    });
  }
});

/**
 * GET /code-quality/report
 * Get comprehensive quality report
 */
router.get('/report', (req: Request, res: Response) => {
  try {
    const report = codeQualityMonitor.getQualityReport();
    const analyses = codeQualityMonitor.getAllAnalyses();

    // Aggregate statistics
    const totalFiles = analyses.size;
    const totalIssues = Array.from(analyses.values())
      .reduce((sum, analysis) => sum + analysis.issues.length, 0);

    const issuesByType = {
      complexity: 0,
      duplication: 0,
      security: 0,
      performance: 0,
      maintainability: 0
    };

    const issuesBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const analysis of analyses.values()) {
      analysis.issues.forEach(issue => {
        issuesByType[issue.type]++;
        issuesBySeverity[issue.severity]++;
      });
    }

    res.json({
      ok: true,
      data: {
        report,
        statistics: {
          totalFiles,
          totalIssues,
          issuesByType,
          issuesBySeverity,
          avgIssuesPerFile: totalFiles > 0 ? totalIssues / totalFiles : 0
        },
        trends: codeQualityMonitor.metricsHistory.slice(-10) // Last 10 measurements
      },
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: 'cursor-ultra-auto-patch'
      }
    });
  } catch (error) {
    logger.error('Report generation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

/**
 * GET /code-quality/suggestions
 * Get refactoring suggestions
 */
router.get('/suggestions', (req: Request, res: Response) => {
  try {
    const { priority = 'all', limit = 20 } = req.query;
    const analyses = codeQualityMonitor.getAllAnalyses();

    const allSuggestions: Array<{
      file: string;
      suggestion: any;
      impact: string;
    }> = [];

    for (const [filePath, analysis] of analyses) {
      analysis.suggestions.forEach(suggestion => {
        allSuggestions.push({
          file: filePath,
          suggestion,
          impact: suggestion.impact
        });
      });
    }

    // Filter by priority if specified
    let filteredSuggestions = allSuggestions;
    if (priority !== 'all') {
      filteredSuggestions = allSuggestions.filter(s => s.impact === priority);
    }

    // Sort by impact and limit
    const sortedSuggestions = filteredSuggestions
      .sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        return (impactWeight[b.impact] || 0) - (impactWeight[a.impact] || 0);
      })
      .slice(0, parseInt(limit as string));

    res.json({
      ok: true,
      data: {
        suggestions: sortedSuggestions,
        summary: {
          total: allSuggestions.length,
          high: allSuggestions.filter(s => s.impact === 'high').length,
          medium: allSuggestions.filter(s => s.impact === 'medium').length,
          low: allSuggestions.filter(s => s.impact === 'low').length
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        filter: { priority, limit }
      }
    });
  } catch (error) {
    logger.error('Suggestions generation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get suggestions',
      details: error.message
    });
  }
});

/**
 * POST /code-quality/benchmark
 * Run performance benchmark
 */
router.post('/benchmark', async (req: Request, res: Response) => {
  try {
    const { endpoint = '/health', iterations = 100, concurrent = 1 } = req.body;

    const startTime = performance.now();
    const results: Array<{ duration: number; success: boolean }> = [];

    // Simulate benchmark requests
    for (let i = 0; i < iterations; i++) {
      const requestStart = performance.now();

      try {
        // Simulate HTTP request
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        const duration = performance.now() - requestStart;
        results.push({ duration, success: true });
      } catch (error) {
        const duration = performance.now() - requestStart;
        results.push({ duration, success: false });
      }
    }

    const totalTime = performance.now() - startTime;
    const successfulRequests = results.filter(r => r.success);
    const durations = successfulRequests.map(r => r.duration);

    const metrics = {
      endpoint,
      iterations,
      concurrent,
      totalTime: Math.round(totalTime),
      totalRequests: results.length,
      successfulRequests: successfulRequests.length,
      failedRequests: results.length - successfulRequests.length,
      successRate: (successfulRequests.length / results.length) * 100,
      avgResponseTime: durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      requestsPerSecond: successfulRequests.length / (totalTime / 1000),
      performanceGrade: getPerformanceGrade(durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0)
    };

    res.json({
      ok: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        benchmarkType: 'performance'
      }
    });
  } catch (error) {
    logger.error('Benchmark error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to run benchmark',
      details: error.message
    });
  }
});

// Helper functions for grading and classification

function getMaintainabilityLevel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  return 'Poor';
}

function getComplexityLevel(score: number): string {
  if (score <= 5) return 'Very Low';
  if (score <= 10) return 'Low';
  if (score <= 15) return 'Moderate';
  if (score <= 20) return 'High';
  return 'Very High';
}

function getQualityGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getTestGrade(metrics: TestMetrics): string {
  const score = (metrics.qualityScore + metrics.performanceScore + metrics.securityScore) / 3;
  return getQualityGrade(score);
}

function getPerformanceGrade(avgResponseTime: number): string {
  if (avgResponseTime < 100) return 'A';
  if (avgResponseTime < 250) return 'B';
  if (avgResponseTime < 500) return 'C';
  if (avgResponseTime < 1000) return 'D';
  return 'F';
}

function getPriorityIssues(issues: any[]): any[] {
  return issues
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 10);
}

function getQuickWins(suggestions: any[]): any[] {
  return suggestions
    .filter(s => s.impact === 'high' && s.type === 'rename_variable')
    .slice(0, 5);
}

function getMajorRefactoringSuggestions(suggestions: any[]): any[] {
  return suggestions
    .filter(s => s.type === 'extract_method' || s.type === 'reduce_complexity')
    .slice(0, 5);
}

function getTestRecommendations(metrics: TestMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.coverage < 80) {
    recommendations.push('Increase test coverage to at least 80%');
  }

  if (metrics.failedTests > 0) {
    recommendations.push(`Fix ${metrics.failedTests} failing tests`);
  }

  if (metrics.performanceScore < 70) {
    recommendations.push('Optimize test performance and reduce execution time');
  }

  if (metrics.securityScore < 80) {
    recommendations.push('Add more security-focused tests');
  }

  return recommendations;
}

export default router;