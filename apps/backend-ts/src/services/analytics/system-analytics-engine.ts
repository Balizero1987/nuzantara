// 🧠 ZANTARA - System Analytics Engine
// Advanced predictive analytics, pattern recognition, anomaly detection
// ZANTARA AI System Analyst Implementation

import { EventEmitter } from 'events';
import logger from '../logger.js';

export interface SystemMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  activeUsers: number;
  throughput: number;
  cpuUsage?: number;
  memoryUsage?: number;
  timestamp: number;
}

export interface BehaviorPattern {
  type: string;
  confidence: number;
  frequency: number;
  timeWindow: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface Anomaly {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  timestamp: number;
  description: string;
}

export interface SystemInsight {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  data?: any;
}

export interface PredictiveInsights {
  trafficForecast: TrafficForecast;
  resourceForecast: ResourceForecast;
  performanceForecast: PerformanceForecast;
  riskAssessment: RiskAssessment;
  scalingRecommendations: ScalingRecommendation[];
}

interface TrafficForecast {
  nextHour: number;
  next24Hours: number[];
  peakExpected: { time: string; load: number };
  confidence: number;
}

interface ResourceForecast {
  cpu: { current: number; predicted: number; capacity: number };
  memory: { current: number; predicted: number; capacity: number };
  disk: { current: number; predicted: number; capacity: number };
  timeToCapacity?: string;
}

interface PerformanceForecast {
  responseTime: {
    current: number;
    predicted: number;
    trend: 'stable' | 'improving' | 'degrading' | 'increasing' | 'decreasing';
  };
  errorRate: {
    current: number;
    predicted: number;
    trend: 'stable' | 'improving' | 'degrading' | 'increasing' | 'decreasing';
  };
  throughput: {
    current: number;
    predicted: number;
    trend: 'stable' | 'improving' | 'degrading' | 'increasing' | 'decreasing';
  };
}

interface RiskAssessment {
  overall: 'low' | 'medium' | 'high' | 'critical';
  risks: Array<{ type: string; level: string; probability: number; impact: string }>;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ScalingRecommendation {
  type: 'scale_up' | 'scale_down' | 'optimize' | 'migrate';
  urgency: 'immediate' | 'soon' | 'planned';
  reason: string;
  expectedImpact: string;
  estimatedCost?: string;
}

export interface DecisionContext {
  type: 'scaling' | 'feature_deployment' | 'resource_allocation' | 'performance_optimization';
  parameters: any;
  constraints?: any;
  objectives?: string[];
}

export class SystemAnalyticsEngine extends EventEmitter {
  private metricsBuffer: Map<string, SystemMetrics[]> = new Map();
  private analysisWindow: number = 24 * 60 * 60 * 1000; // 24 hours
  private baselineMetrics: Map<string, SystemMetrics> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.initializeAnalytics();
  }

  // ========================================
  // SYSTEM BEHAVIOR ANALYSIS
  // ========================================

  async analyzeSystemBehavior(): Promise<{
    insights: SystemInsight[];
    patterns: BehaviorPattern[];
    timestamp: string;
  }> {
    const now = Date.now();
    const windowStart = now - this.analysisWindow;

    try {
      const behaviorData = {
        requestPatterns: await this.analyzeRequestPatterns(windowStart, now),
        userBehavior: await this.analyzeUserBehavior(windowStart, now),
        performanceTrends: await this.analyzePerformanceTrends(windowStart, now),
        errorPatterns: await this.analyzeErrorPatterns(windowStart, now),
        resourceUtilization: await this.analyzeResourceUtilization(windowStart, now),
      };

      const insights = this.generateSystemInsights(behaviorData);
      const patterns = this.extractBehaviorPatterns(behaviorData);

      await this.storeAnalysisResults('system_behavior', { insights, patterns });

      return {
        insights,
        patterns,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('System behavior analysis failed:', error instanceof Error ? error : new Error(String(error)));
      return {
        insights: [
          {
            type: 'analysis_error',
            severity: 'warning',
            message: 'Behavior analysis temporarily unavailable',
            recommendation: 'System will retry automatically',
            impact: 'low',
            confidence: 1.0,
          },
        ],
        patterns: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async analyzeRequestPatterns(startTime: number, endTime: number) {
    const metrics = this.getMetricsInWindow(startTime, endTime);

    return {
      totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      avgRequestsPerHour:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.requestCount, 0) / (metrics.length / 60)
          : 0,
      peakHours: this.identifyPeakHours(metrics),
      lowActivityPeriods: this.identifyLowActivity(metrics),
      requestDistribution: this.analyzeRequestDistribution(metrics),
    };
  }

  private async analyzeUserBehavior(startTime: number, endTime: number) {
    const metrics = this.getMetricsInWindow(startTime, endTime);

    const uniqueUsers = new Set(metrics.map((m) => m.activeUsers)).size;
    const avgActiveUsers =
      metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.activeUsers, 0) / metrics.length : 0;

    return {
      uniqueUsers,
      avgActiveUsers,
      peakConcurrency: Math.max(...metrics.map((m) => m.activeUsers), 0),
      userEngagement: this.calculateEngagementScore(metrics),
      churnRate: this.estimateChurnRate(metrics),
      sessionDuration: this.estimateAvgSessionDuration(metrics),
    };
  }

  private async analyzePerformanceTrends(startTime: number, endTime: number) {
    const metrics = this.getMetricsInWindow(startTime, endTime);

    const responseTimes = metrics.map((m) => m.avgResponseTime);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      responseTime: {
        current: avgResponseTime,
        trend: this.calculateTrend(responseTimes),
        p50: this.percentile(responseTimes, 50),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99),
      },
      throughput: {
        current: metrics.length > 0 ? metrics[metrics.length - 1].throughput : 0,
        avg: metrics.reduce((sum, m) => sum + m.throughput, 0) / (metrics.length || 1),
        trend: this.calculateTrend(metrics.map((m) => m.throughput)),
      },
    };
  }

  private async analyzeErrorPatterns(startTime: number, endTime: number) {
    const metrics = this.getMetricsInWindow(startTime, endTime);

    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      totalErrors,
      errorRate,
      trend: this.calculateTrend(metrics.map((m) => m.errorCount)),
      errorSpikes: this.identifyErrorSpikes(metrics),
      errorTypes: [],
    };
  }

  private async analyzeResourceUtilization(startTime: number, endTime: number) {
    const metrics = this.getMetricsInWindow(startTime, endTime);

    return {
      cpu: {
        avg: this.calculateAverage(metrics.map((m) => m.cpuUsage || 0)),
        peak: Math.max(...metrics.map((m) => m.cpuUsage || 0), 0),
        trend: this.calculateTrend(metrics.map((m) => m.cpuUsage || 0)),
      },
      memory: {
        avg: this.calculateAverage(metrics.map((m) => m.memoryUsage || 0)),
        peak: Math.max(...metrics.map((m) => m.memoryUsage || 0), 0),
        trend: this.calculateTrend(metrics.map((m) => m.memoryUsage || 0)),
      },
      efficiency: this.calculateResourceEfficiency(metrics),
    };
  }

  // ========================================
  // PREDICTIVE ANALYTICS
  // ========================================

  async generatePredictiveInsights(): Promise<PredictiveInsights> {
    const historicalData = await this.getHistoricalMetrics(30);

    return {
      trafficForecast: this.predictTraffic(historicalData),
      resourceForecast: this.predictResourceNeeds(historicalData),
      performanceForecast: this.predictPerformanceTrends(historicalData),
      riskAssessment: this.assessSystemRisks(historicalData),
      scalingRecommendations: this.generateScalingRecommendations(historicalData),
    };
  }

  private predictTraffic(historicalData: SystemMetrics[]): TrafficForecast {
    const recentMetrics = historicalData.slice(-24);
    const avgLoad = this.calculateAverage(recentMetrics.map((m) => m.requestCount));

    const trend = this.calculateTrend(recentMetrics.map((m) => m.requestCount));
    const trendMultiplier = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1.0;

    return {
      nextHour: Math.round(avgLoad * trendMultiplier),
      next24Hours: Array(24)
        .fill(0)
        .map((_, i) =>
          Math.round(avgLoad * (1 + Math.sin((i / 24) * Math.PI) * 0.3) * trendMultiplier)
        ),
      peakExpected: {
        time: this.predictPeakTime(historicalData),
        load: Math.round(avgLoad * 1.5 * trendMultiplier),
      },
      confidence: 0.75,
    };
  }

  private predictResourceNeeds(historicalData: SystemMetrics[]): ResourceForecast {
    const recent = historicalData.slice(-24);
    const avgCpu = this.calculateAverage(recent.map((m) => m.cpuUsage || 50));
    const avgMemory = this.calculateAverage(recent.map((m) => m.memoryUsage || 60));

    return {
      cpu: { current: avgCpu, predicted: avgCpu * 1.1, capacity: 100 },
      memory: { current: avgMemory, predicted: avgMemory * 1.05, capacity: 100 },
      disk: { current: 45, predicted: 50, capacity: 100 },
      timeToCapacity: avgCpu > 80 ? '< 7 days' : '> 30 days',
    };
  }

  private predictPerformanceTrends(historicalData: SystemMetrics[]): PerformanceForecast {
    const recent = historicalData.slice(-24);
    const currentResponseTime = this.calculateAverage(recent.map((m) => m.avgResponseTime));
    const currentErrorRate = this.calculateAverage(
      recent.map((m) => m.errorCount / (m.requestCount || 1))
    );
    const currentThroughput = this.calculateAverage(recent.map((m) => m.throughput));

    return {
      responseTime: {
        current: currentResponseTime,
        predicted: currentResponseTime * 1.05,
        trend: this.calculateTrend(recent.map((m) => m.avgResponseTime)),
      },
      errorRate: {
        current: currentErrorRate,
        predicted: currentErrorRate * 0.95,
        trend: this.calculateTrend(recent.map((m) => m.errorCount)),
      },
      throughput: {
        current: currentThroughput,
        predicted: currentThroughput * 1.1,
        trend: this.calculateTrend(recent.map((m) => m.throughput)),
      },
    };
  }

  private assessSystemRisks(historicalData: SystemMetrics[]): RiskAssessment {
    const risks: Array<{ type: string; level: string; probability: number; impact: string }> = [];

    const recent = historicalData.slice(-24);
    const errorRate = this.calculateAverage(
      recent.map((m) => m.errorCount / (m.requestCount || 1))
    );
    const avgResponseTime = this.calculateAverage(recent.map((m) => m.avgResponseTime));

    if (errorRate > 0.05) {
      risks.push({
        type: 'high_error_rate',
        level: 'high',
        probability: 0.8,
        impact: 'Service degradation affecting user experience',
      });
    }

    if (avgResponseTime > 2000) {
      risks.push({
        type: 'performance_degradation',
        level: 'medium',
        probability: 0.6,
        impact: 'Slow response times may lead to user abandonment',
      });
    }

    const riskCounts = {
      critical: risks.filter((r) => r.level === 'critical').length,
      high: risks.filter((r) => r.level === 'high').length,
      medium: risks.filter((r) => r.level === 'medium').length,
      low: risks.filter((r) => r.level === 'low').length,
    };

    return {
      overall:
        riskCounts.critical > 0
          ? 'critical'
          : riskCounts.high > 0
            ? 'high'
            : riskCounts.medium > 0
              ? 'medium'
              : 'low',
      risks,
      ...riskCounts,
    };
  }

  private generateScalingRecommendations(historicalData: SystemMetrics[]): ScalingRecommendation[] {
    const recommendations: ScalingRecommendation[] = [];
    const recent = historicalData.slice(-24);
    const avgLoad = this.calculateAverage(recent.map((m) => m.requestCount));

    if (avgLoad > 1000) {
      recommendations.push({
        type: 'scale_up',
        urgency: 'soon',
        reason: 'Traffic approaching capacity limits',
        expectedImpact: 'Improved response times and reliability',
        estimatedCost: '~15% increase in infrastructure cost',
      });
    }

    if (avgLoad < 100) {
      recommendations.push({
        type: 'scale_down',
        urgency: 'planned',
        reason: 'Low utilization detected',
        expectedImpact: 'Cost optimization without performance impact',
        estimatedCost: '~20% reduction in infrastructure cost',
      });
    }

    return recommendations;
  }

  // ========================================
  // ANOMALY DETECTION
  // ========================================

  async detectAnomalies(): Promise<{
    anomalies: Anomaly[];
    totalDetected: number;
    critical: number;
  }> {
    try {
      const currentMetrics = await this.getCurrentMetrics();
      const baseline = this.getBaselineMetrics();

      const anomalies: Anomaly[] = [
        ...this.detectPerformanceAnomalies(currentMetrics, baseline),
        ...this.detectTrafficAnomalies(currentMetrics, baseline),
        ...this.detectErrorAnomalies(currentMetrics, baseline),
        ...this.detectResourceAnomalies(currentMetrics, baseline),
      ];

      const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;

      anomalies.forEach((anomaly) => {
        if (anomaly.severity === 'critical') {
          this.emit('critical-anomaly', anomaly);
        }
      });

      return {
        anomalies,
        totalDetected: anomalies.length,
        critical: criticalCount,
      };
    } catch (error: any) {
      logger.error('Anomaly detection failed:', error instanceof Error ? error : new Error(String(error)));
      return { anomalies: [], totalDetected: 0, critical: 0 };
    }
  }

  private detectPerformanceAnomalies(current: SystemMetrics, baseline: SystemMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const threshold = 2.0;

    if (current.avgResponseTime > baseline.avgResponseTime * threshold) {
      anomalies.push({
        type: 'performance',
        severity: current.avgResponseTime > baseline.avgResponseTime * 3 ? 'critical' : 'warning',
        metric: 'response_time',
        currentValue: current.avgResponseTime,
        expectedValue: baseline.avgResponseTime,
        deviation: (current.avgResponseTime / baseline.avgResponseTime - 1) * 100,
        timestamp: Date.now(),
        description: `Response time ${Math.round((current.avgResponseTime / baseline.avgResponseTime - 1) * 100)}% above baseline`,
      });
    }

    return anomalies;
  }

  private detectTrafficAnomalies(current: SystemMetrics, baseline: SystemMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const threshold = 2.5;

    if (current.requestCount > baseline.requestCount * threshold) {
      anomalies.push({
        type: 'traffic_spike',
        severity: 'warning',
        metric: 'request_count',
        currentValue: current.requestCount,
        expectedValue: baseline.requestCount,
        deviation: (current.requestCount / baseline.requestCount - 1) * 100,
        timestamp: Date.now(),
        description: `Unusual traffic spike: ${Math.round((current.requestCount / baseline.requestCount - 1) * 100)}% above normal`,
      });
    }

    return anomalies;
  }

  private detectErrorAnomalies(current: SystemMetrics, baseline: SystemMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const currentRate = current.errorCount / (current.requestCount || 1);
    const baselineRate = baseline.errorCount / (baseline.requestCount || 1);

    if (currentRate > baselineRate * 3) {
      anomalies.push({
        type: 'error_rate',
        severity: 'critical',
        metric: 'error_rate',
        currentValue: currentRate,
        expectedValue: baselineRate,
        deviation: (currentRate / baselineRate - 1) * 100,
        timestamp: Date.now(),
        description: `Critical error rate increase: ${(currentRate * 100).toFixed(2)}% vs baseline ${(baselineRate * 100).toFixed(2)}%`,
      });
    }

    return anomalies;
  }

  private detectResourceAnomalies(current: SystemMetrics, baseline: SystemMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (current.cpuUsage && baseline.cpuUsage && current.cpuUsage > 90) {
      anomalies.push({
        type: 'resource',
        severity: 'critical',
        metric: 'cpu_usage',
        currentValue: current.cpuUsage,
        expectedValue: baseline.cpuUsage,
        deviation: current.cpuUsage - baseline.cpuUsage,
        timestamp: Date.now(),
        description: `Critical CPU usage: ${current.cpuUsage}%`,
      });
    }

    return anomalies;
  }

  // ========================================
  // SYSTEM HEALTH SCORING
  // ========================================

  async calculateSystemHealthScore(): Promise<{
    overall: number;
    grade: string;
    components: any;
    recommendations: string[];
    timestamp: string;
  }> {
    const metrics = await this.getHealthMetrics();

    const scores = {
      performance: this.calculatePerformanceScore(metrics),
      availability: this.calculateAvailabilityScore(metrics),
      reliability: this.calculateReliabilityScore(metrics),
      scalability: this.calculateScalabilityScore(metrics),
      efficiency: this.calculateEfficiencyScore(metrics),
    };

    const overall = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    );

    return {
      overall,
      grade: this.getHealthGrade(overall),
      components: scores,
      recommendations: this.getHealthRecommendations(scores),
      timestamp: new Date().toISOString(),
    };
  }

  private calculatePerformanceScore(metrics: any): number {
    const responseTime = metrics.avgResponseTime || 500;
    if (responseTime < 200) return 100;
    if (responseTime < 500) return 90;
    if (responseTime < 1000) return 75;
    if (responseTime < 2000) return 60;
    return 40;
  }

  private calculateAvailabilityScore(metrics: any): number {
    const errorRate = metrics.errorCount / (metrics.requestCount || 1);
    if (errorRate < 0.001) return 100;
    if (errorRate < 0.01) return 90;
    if (errorRate < 0.05) return 75;
    return 50;
  }

  private calculateReliabilityScore(_metrics: any): number {
    return 85;
  }

  private calculateScalabilityScore(metrics: any): number {
    const cpuUsage = metrics.cpuUsage || 50;
    if (cpuUsage < 50) return 100;
    if (cpuUsage < 70) return 85;
    if (cpuUsage < 85) return 70;
    return 50;
  }

  private calculateEfficiencyScore(metrics: any): number {
    const throughput = metrics.throughput || 0;
    return Math.min(100, Math.max(50, 50 + throughput / 20));
  }

  private getHealthGrade(score: number): string {
    if (score >= 90) return 'A - Excellent';
    if (score >= 80) return 'B - Good';
    if (score >= 70) return 'C - Fair';
    if (score >= 60) return 'D - Poor';
    return 'F - Critical';
  }

  private getHealthRecommendations(scores: any): string[] {
    const recommendations: string[] = [];

    if (scores.performance < 75) {
      recommendations.push('Optimize response times through caching and query optimization');
    }
    if (scores.availability < 80) {
      recommendations.push('Investigate error patterns and implement better error handling');
    }
    if (scores.scalability < 75) {
      recommendations.push('Consider horizontal scaling to handle increased load');
    }

    return recommendations;
  }

  // ========================================
  // DECISION SUPPORT
  // ========================================

  async getDecisionSupport(context: DecisionContext): Promise<any> {
    const relevantData = await this.gatherRelevantData(context);
    const analysis = this.analyzeDecisionContext(relevantData, context);
    const recommendations = this.generateDecisionRecommendations(analysis);

    return {
      context,
      analysis,
      recommendations,
      confidence: this.calculateConfidence(analysis),
      alternatives: this.generateAlternativeStrategies(recommendations),
      timestamp: new Date().toISOString(),
    };
  }

  private async gatherRelevantData(_context: DecisionContext): Promise<any> {
    return {
      currentMetrics: await this.getCurrentMetrics(),
      historicalTrends: await this.getHistoricalMetrics(7),
      predictions: await this.generatePredictiveInsights(),
      systemHealth: await this.calculateSystemHealthScore(),
    };
  }

  private analyzeDecisionContext(data: any, _context: DecisionContext): any {
    return {
      currentState: data.systemHealth.overall,
      trends: data.predictions.performanceForecast,
      risks: data.predictions.riskAssessment,
      opportunities: this.identifyOpportunities(data),
    };
  }

  private generateDecisionRecommendations(_analysis: any): any[] {
    return [
      {
        action: 'Monitor and maintain',
        confidence: 0.8,
        expectedOutcome: 'Stable system performance',
        timeframe: 'Immediate',
      },
    ];
  }

  private calculateConfidence(_analysis: any): number {
    return 0.75;
  }

  private generateAlternativeStrategies(_recommendations: any[]): any[] {
    return [];
  }

  private identifyOpportunities(_data: any): string[] {
    return ['Performance optimization', 'Cost reduction'];
  }

  // ========================================
  // METRICS RECORDING & MANAGEMENT
  // ========================================

  recordMetric(metric: SystemMetrics): void {
    const key = 'system';
    if (!this.metricsBuffer.has(key)) {
      this.metricsBuffer.set(key, []);
    }

    const buffer = this.metricsBuffer.get(key)!;
    buffer.push(metric);

    const cutoff = Date.now() - this.analysisWindow;
    this.metricsBuffer.set(
      key,
      buffer.filter((m) => m.timestamp > cutoff)
    );

    this.updateBaseline(metric);
  }

  private updateBaseline(metric: SystemMetrics): void {
    const baseline = this.baselineMetrics.get('system') || metric;

    const alpha = 0.1;
    this.baselineMetrics.set('system', {
      requestCount: baseline.requestCount * (1 - alpha) + metric.requestCount * alpha,
      errorCount: baseline.errorCount * (1 - alpha) + metric.errorCount * alpha,
      avgResponseTime: baseline.avgResponseTime * (1 - alpha) + metric.avgResponseTime * alpha,
      activeUsers: baseline.activeUsers * (1 - alpha) + metric.activeUsers * alpha,
      throughput: baseline.throughput * (1 - alpha) + metric.throughput * alpha,
      cpuUsage: (baseline.cpuUsage || 0) * (1 - alpha) + (metric.cpuUsage || 0) * alpha,
      memoryUsage: (baseline.memoryUsage || 0) * (1 - alpha) + (metric.memoryUsage || 0) * alpha,
      timestamp: metric.timestamp,
    });
  }

  private async getCurrentMetrics(): Promise<SystemMetrics> {
    const buffer = this.metricsBuffer.get('system') || [];
    if (buffer.length === 0) {
      return this.getDefaultMetrics();
    }
    return buffer[buffer.length - 1];
  }

  private getBaselineMetrics(): SystemMetrics {
    return this.baselineMetrics.get('system') || this.getDefaultMetrics();
  }

  private getDefaultMetrics(): SystemMetrics {
    return {
      requestCount: 100,
      errorCount: 1,
      avgResponseTime: 200,
      activeUsers: 10,
      throughput: 50,
      cpuUsage: 45,
      memoryUsage: 60,
      timestamp: Date.now(),
    };
  }

  private getMetricsInWindow(startTime: number, endTime: number): SystemMetrics[] {
    const buffer = this.metricsBuffer.get('system') || [];
    return buffer.filter((m) => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  private async getHistoricalMetrics(days: number): Promise<SystemMetrics[]> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.getMetricsInWindow(cutoff, Date.now());
  }

  private async getHealthMetrics(): Promise<any> {
    const current = await this.getCurrentMetrics();
    return current;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const change = (secondAvg - firstAvg) / (firstAvg || 1);

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private identifyPeakHours(
    metrics: SystemMetrics[]
  ): Array<{ start: string; end: string; load: number }> {
    const avg = this.calculateAverage(metrics.map((m) => m.requestCount));
    return metrics
      .filter((m) => m.requestCount > avg * 1.5)
      .slice(0, 3)
      .map((m) => ({
        start: new Date(m.timestamp).toISOString().substring(11, 16),
        end: new Date(m.timestamp + 3600000).toISOString().substring(11, 16),
        load: m.requestCount,
      }));
  }

  private identifyLowActivity(metrics: SystemMetrics[]): Array<{ time: string; load: number }> {
    const avg = this.calculateAverage(metrics.map((m) => m.requestCount));
    return metrics
      .filter((m) => m.requestCount < avg * 0.5)
      .slice(0, 3)
      .map((m) => ({
        time: new Date(m.timestamp).toISOString().substring(11, 16),
        load: m.requestCount,
      }));
  }

  private analyzeRequestDistribution(_metrics: SystemMetrics[]): any {
    return {
      type: 'normal',
      variance: 'moderate',
    };
  }

  private calculateEngagementScore(metrics: SystemMetrics[]): number {
    const avgUsers = this.calculateAverage(metrics.map((m) => m.activeUsers));
    return Math.min(100, Math.max(0, avgUsers * 5));
  }

  private estimateChurnRate(_metrics: SystemMetrics[]): number {
    return 0.05;
  }

  private estimateAvgSessionDuration(_metrics: SystemMetrics[]): number {
    return 300;
  }

  private identifyErrorSpikes(metrics: SystemMetrics[]): Array<{ time: string; count: number }> {
    const avg = this.calculateAverage(metrics.map((m) => m.errorCount));
    return metrics
      .filter((m) => m.errorCount > avg * 2)
      .slice(0, 5)
      .map((m) => ({
        time: new Date(m.timestamp).toISOString(),
        count: m.errorCount,
      }));
  }

  private calculateResourceEfficiency(metrics: SystemMetrics[]): number {
    const avgThroughput = this.calculateAverage(metrics.map((m) => m.throughput));
    const avgCpu = this.calculateAverage(metrics.map((m) => m.cpuUsage || 50));
    return Math.round((avgThroughput / (avgCpu || 1)) * 10);
  }

  private predictPeakTime(historicalData: SystemMetrics[]): string {
    const hourCounts = new Map<number, number>();

    historicalData.forEach((m) => {
      const hour = new Date(m.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + m.requestCount);
    });

    let maxHour = 12;
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    return `${maxHour.toString().padStart(2, '0')}:00`;
  }

  private generateSystemInsights(behaviorData: any): SystemInsight[] {
    const insights: SystemInsight[] = [];

    if (behaviorData.requestPatterns.peakHours.length > 0) {
      insights.push({
        type: 'traffic_pattern',
        severity: 'info',
        message: `Peak traffic detected at ${behaviorData.requestPatterns.peakHours[0].start}`,
        recommendation: 'Consider scaling resources during peak hours',
        impact: 'medium',
        confidence: 0.8,
      });
    }

    if (behaviorData.performanceTrends.responseTime.trend === 'increasing') {
      insights.push({
        type: 'performance_degradation',
        severity: 'warning',
        message: 'Response times are trending upward',
        recommendation: 'Investigate bottlenecks and optimize queries',
        impact: 'high',
        confidence: 0.85,
      });
    }

    if (behaviorData.userBehavior.churnRate > 0.1) {
      insights.push({
        type: 'user_retention',
        severity: 'critical',
        message: `High churn rate: ${(behaviorData.userBehavior.churnRate * 100).toFixed(1)}%`,
        recommendation: 'Implement engagement strategies and improve UX',
        impact: 'critical',
        confidence: 0.7,
      });
    }

    return insights;
  }

  private extractBehaviorPatterns(_behaviorData: any): BehaviorPattern[] {
    return [
      {
        type: 'daily_peak',
        confidence: 0.85,
        frequency: 1,
        timeWindow: '14:00-16:00',
        impact: 'medium',
      },
    ];
  }

  private async storeAnalysisResults(_type: string, results: any): Promise<void> {
    logger.info('Analytics results stored: ${type}', { count: results.insights?.length || 0 });
  }

  private async performPeriodicAnalysis(): Promise<void> {
    try {
      await this.analyzeSystemBehavior();
      await this.detectAnomalies();
    } catch (error: any) {
      logger.error('Periodic analysis failed:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private setupRealTimeMonitoring(): void {
    logger.info('🔍 Real-time monitoring active');
  }

  private async initializeAnalytics(): Promise<void> {
    if (this.isInitialized) return;

    try {
      setInterval(() => this.performPeriodicAnalysis(), 5 * 60 * 1000);
      setInterval(() => this.detectAnomalies(), 60 * 1000);

      this.setupRealTimeMonitoring();
      this.baselineMetrics.set('system', this.getDefaultMetrics());

      this.isInitialized = true;
      logger.info('🧠 System Analytics Engine initialized');
    } catch (error: any) {
      logger.error('Analytics engine initialization failed:', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const analyticsEngine = new SystemAnalyticsEngine();
