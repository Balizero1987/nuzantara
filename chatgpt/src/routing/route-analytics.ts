import { HTTPMethod } from './unified-router.js';

/**
 * Request timing information
 */
export interface RequestTiming {
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Analytics for a single route
 */
export interface RouteAnalyticsData {
  method: HTTPMethod;
  path: string;
  requestCount: number;
  errorCount: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  statusCodes: Map<number, number>;
  lastAccessed: number;
  firstAccessed: number;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  method: HTTPMethod;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  error?: boolean;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  requestsPerSecond: number;
  uptime: number;
  routeStats: RouteAnalyticsData[];
  topRoutes: Array<{ route: string; requests: number }>;
  slowestRoutes: Array<{ route: string; avgDuration: number }>;
  errorRoutes: Array<{ route: string; errorCount: number; errorRate: number }>;
}

/**
 * RouteAnalytics - Track performance and usage metrics per endpoint
 */
export class RouteAnalytics {
  private readonly analytics: Map<string, RouteAnalyticsData> = new Map();
  private readonly startTime: number = Date.now();
  private totalRequests = 0;
  private totalErrors = 0;

  /**
   * Record a request
   */
  recordRequest(metadata: RequestMetadata): void {
    const key = this.makeKey(metadata.method, metadata.path);
    let data = this.analytics.get(key);

    if (!data) {
      data = this.createInitialData(metadata.method, metadata.path);
      this.analytics.set(key, data);
    }

    // Update counters
    data.requestCount++;
    this.totalRequests++;

    if (metadata.error || metadata.statusCode >= 400) {
      data.errorCount++;
      this.totalErrors++;
    }

    // Update timing
    data.totalDuration += metadata.duration;
    data.minDuration = Math.min(data.minDuration, metadata.duration);
    data.maxDuration = Math.max(data.maxDuration, metadata.duration);
    data.avgDuration = data.totalDuration / data.requestCount;
    data.lastAccessed = metadata.timestamp;

    // Update status codes
    const statusCount = data.statusCodes.get(metadata.statusCode) || 0;
    data.statusCodes.set(metadata.statusCode, statusCount + 1);
  }

  /**
   * Get analytics for a specific route
   */
  getRouteAnalytics(method: HTTPMethod, path: string): RouteAnalyticsData | undefined {
    return this.analytics.get(this.makeKey(method, path));
  }

  /**
   * Get all route analytics
   */
  getAllRouteAnalytics(): RouteAnalyticsData[] {
    return Array.from(this.analytics.values());
  }

  /**
   * Get analytics summary
   */
  getSummary(): AnalyticsSummary {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = uptime / 1000;

    const routeStats = this.getAllRouteAnalytics();

    // Calculate overall average response time
    const totalDuration = routeStats.reduce((sum, r) => sum + r.totalDuration, 0);
    const avgResponseTime = this.totalRequests > 0 ? totalDuration / this.totalRequests : 0;

    // Top routes by request count
    const topRoutes = [...routeStats]
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10)
      .map((r) => ({
        route: `${r.method.toUpperCase()} ${r.path}`,
        requests: r.requestCount,
      }));

    // Slowest routes
    const slowestRoutes = [...routeStats]
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)
      .map((r) => ({
        route: `${r.method.toUpperCase()} ${r.path}`,
        avgDuration: r.avgDuration,
      }));

    // Error-prone routes
    const errorRoutes = routeStats
      .filter((r) => r.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 10)
      .map((r) => ({
        route: `${r.method.toUpperCase()} ${r.path}`,
        errorCount: r.errorCount,
        errorRate: r.errorCount / r.requestCount,
      }));

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate: this.totalRequests > 0 ? this.totalErrors / this.totalRequests : 0,
      avgResponseTime,
      requestsPerSecond: uptimeSeconds > 0 ? this.totalRequests / uptimeSeconds : 0,
      uptime,
      routeStats,
      topRoutes,
      slowestRoutes,
      errorRoutes,
    };
  }

  /**
   * Get statistics for routes matching a pattern
   */
  getStatsByPattern(pattern: RegExp): RouteAnalyticsData[] {
    return Array.from(this.analytics.values()).filter((data) => {
      const routeStr = `${data.method.toUpperCase()} ${data.path}`;
      return pattern.test(routeStr);
    });
  }

  /**
   * Get slowest routes
   */
  getSlowestRoutes(limit = 10): Array<{ route: string; avgDuration: number }> {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit)
      .map((data) => ({
        route: `${data.method.toUpperCase()} ${data.path}`,
        avgDuration: data.avgDuration,
      }));
  }

  /**
   * Get most accessed routes
   */
  getMostAccessedRoutes(limit = 10): Array<{ route: string; requests: number }> {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limit)
      .map((data) => ({
        route: `${data.method.toUpperCase()} ${data.path}`,
        requests: data.requestCount,
      }));
  }

  /**
   * Get routes with highest error rates
   */
  getErrorProneRoutes(limit = 10): Array<{
    route: string;
    errorCount: number;
    errorRate: number;
  }> {
    return Array.from(this.analytics.values())
      .filter((data) => data.errorCount > 0)
      .sort((a, b) => {
        const rateA = a.errorCount / a.requestCount;
        const rateB = b.errorCount / b.requestCount;
        return rateB - rateA;
      })
      .slice(0, limit)
      .map((data) => ({
        route: `${data.method.toUpperCase()} ${data.path}`,
        errorCount: data.errorCount,
        errorRate: data.errorCount / data.requestCount,
      }));
  }

  /**
   * Get routes not accessed recently
   */
  getStaleRoutes(thresholdMs: number): Array<{ route: string; lastAccessed: number }> {
    const now = Date.now();
    return Array.from(this.analytics.values())
      .filter((data) => now - data.lastAccessed > thresholdMs)
      .map((data) => ({
        route: `${data.method.toUpperCase()} ${data.path}`,
        lastAccessed: data.lastAccessed,
      }));
  }

  /**
   * Clear all analytics
   */
  clear(): void {
    this.analytics.clear();
    this.totalRequests = 0;
    this.totalErrors = 0;
  }

  /**
   * Clear analytics for a specific route
   */
  clearRoute(method: HTTPMethod, path: string): boolean {
    const key = this.makeKey(method, path);
    const data = this.analytics.get(key);

    if (data) {
      this.totalRequests -= data.requestCount;
      this.totalErrors -= data.errorCount;
      return this.analytics.delete(key);
    }

    return false;
  }

  /**
   * Export analytics data (for logging or external systems)
   */
  export(): {
    timestamp: number;
    uptime: number;
    summary: AnalyticsSummary;
    routes: RouteAnalyticsData[];
  } {
    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      summary: this.getSummary(),
      routes: this.getAllRouteAnalytics(),
    };
  }

  /**
   * Create initial analytics data
   */
  private createInitialData(method: HTTPMethod, path: string): RouteAnalyticsData {
    return {
      method,
      path,
      requestCount: 0,
      errorCount: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      avgDuration: 0,
      statusCodes: new Map(),
      lastAccessed: Date.now(),
      firstAccessed: Date.now(),
    };
  }

  /**
   * Create unique key for route
   */
  private makeKey(method: HTTPMethod, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }
}
