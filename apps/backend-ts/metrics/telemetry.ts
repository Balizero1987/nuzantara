/**
 * ZANTARA Telemetry System - Layer 16
 * Provides Prometheus-compatible metrics for all subsystems
 */

import { zantaraStateHub, GlobalZantaraState } from '../services/state_hub';

interface PrometheusMetric {
  name: string;
  type: 'gauge' | 'counter' | 'histogram';
  help: string;
  value: number;
  labels?: Record<string, string>;
}

class ZantaraTelemetry {
  private port: number = 9090;
  private metrics: Map<string, PrometheusMetric> = new Map();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // System-wide metrics
    this.setMetric('zantara_fusion_index', 'gauge', 'ZANTARA cognitive fusion index score', 0);
    this.setMetric(
      'zantara_overall_health',
      'gauge',
      'Overall system health status (1=healthy, 0.5=degraded, 0=critical)',
      1
    );
    this.setMetric('zantara_active_subsystems', 'gauge', 'Number of active subsystems', 0);

    // Heartbeat metrics
    this.setMetric('zantara_heartbeat_uptime', 'gauge', 'Heartbeat system uptime percentage', 0);
    this.setMetric(
      'zantara_heartbeat_success_rate',
      'gauge',
      'Heartbeat success rate percentage',
      0
    );
    this.setMetric('zantara_heartbeat_interval', 'gauge', 'Heartbeat interval in seconds', 0);
    this.setMetric(
      'zantara_heartbeat_active_modules',
      'gauge',
      'Number of active heartbeat modules',
      0
    );

    // Watcher metrics
    this.setMetric('zantara_watcher_uptime', 'gauge', 'Watcher system uptime percentage', 0);
    this.setMetric('zantara_watcher_success_rate', 'gauge', 'Watcher success rate percentage', 0);
    this.setMetric(
      'zantara_watcher_interval',
      'gauge',
      'Watcher monitoring interval in seconds',
      0
    );
    this.setMetric(
      'zantara_watcher_response_time',
      'gauge',
      'Watcher average response time in seconds',
      0
    );

    // Queue metrics
    this.setMetric(
      'zantara_queue_throughput',
      'gauge',
      'Queue system throughput (messages/second)',
      0
    );
    this.setMetric('zantara_queue_active_jobs', 'gauge', 'Number of active jobs in queue', 0);
    this.setMetric('zantara_queue_failed_jobs', 'gauge', 'Number of failed jobs', 0);

    // Alert metrics
    this.setMetric('zantara_alerts_total', 'gauge', 'Total number of active alerts', 0);
    this.setMetric('zantara_critical_alerts_total', 'gauge', 'Number of critical alerts', 0);
    this.setMetric('zantara_warning_alerts_total', 'gauge', 'Number of warning alerts', 0);

    // API metrics
    this.setMetric(
      'zantara_metrics_requests_total',
      'counter',
      'Total number of metrics endpoint requests',
      0
    );
  }

  private setMetric(
    name: string,
    type: 'gauge' | 'counter' | 'histogram',
    help: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    this.metrics.set(name, {
      name,
      type,
      help,
      value,
      labels,
    });
  }

  async updateMetricsFromGlobalState(): Promise<void> {
    const state = zantaraStateHub.getGlobalState();

    // System-wide metrics
    this.setMetric(
      'zantara_fusion_index',
      'gauge',
      'ZANTARA cognitive fusion index score',
      state.fusion_index
    );
    const healthValue =
      state.overall_status === 'healthy' ? 1 : state.overall_status === 'degraded' ? 0.5 : 0;
    this.setMetric('zantara_overall_health', 'gauge', 'Overall system health status', healthValue);

    const activeSubsystems = Object.values(state.subsystems).filter(
      (sub) => sub.status === 'operational'
    ).length;
    this.setMetric(
      'zantara_active_subsystems',
      'gauge',
      'Number of active subsystems',
      activeSubsystems
    );

    // Heartbeat metrics
    const heartbeat = state.subsystems.heartbeat;
    this.setMetric(
      'zantara_heartbeat_uptime',
      'gauge',
      'Heartbeat system uptime percentage',
      heartbeat.uptime_pct || 0
    );
    this.setMetric(
      'zantara_heartbeat_success_rate',
      'gauge',
      'Heartbeat success rate percentage',
      heartbeat.success_rate || 0
    );
    this.setMetric(
      'zantara_heartbeat_interval',
      'gauge',
      'Heartbeat interval in seconds',
      heartbeat.metrics?.interval || 0
    );
    this.setMetric(
      'zantara_heartbeat_active_modules',
      'gauge',
      'Number of active heartbeat modules',
      heartbeat.metrics?.active_modules || 0
    );

    // Watcher metrics
    const watcher = state.subsystems.watcher;
    this.setMetric(
      'zantara_watcher_uptime',
      'gauge',
      'Watcher system uptime percentage',
      watcher.uptime_pct || 0
    );
    this.setMetric(
      'zantara_watcher_success_rate',
      'gauge',
      'Watcher success rate percentage',
      watcher.success_rate || 0
    );
    this.setMetric(
      'zantara_watcher_interval',
      'gauge',
      'Watcher monitoring interval in seconds',
      watcher.metrics?.interval || 0
    );
    this.setMetric(
      'zantara_watcher_response_time',
      'gauge',
      'Watcher average response time in seconds',
      watcher.metrics?.avg_response_time || 0
    );

    // Queue metrics
    const queue = state.subsystems.queue;
    this.setMetric(
      'zantara_queue_throughput',
      'gauge',
      'Queue system throughput (messages/second)',
      queue.metrics?.throughput || 0
    );
    this.setMetric(
      'zantara_queue_active_jobs',
      'gauge',
      'Number of active jobs in queue',
      queue.metrics?.active_jobs || 0
    );
    this.setMetric(
      'zantara_queue_failed_jobs',
      'gauge',
      'Number of failed jobs',
      queue.metrics?.failed_jobs || 0
    );

    // Alert metrics
    this.setMetric(
      'zantara_alerts_total',
      'gauge',
      'Total number of active alerts',
      state.alerts.length
    );
    const criticalAlerts = state.alerts.filter((alert) => alert.severity === 'critical').length;
    const warningAlerts = state.alerts.filter((alert) => alert.severity === 'warning').length;
    this.setMetric(
      'zantara_critical_alerts_total',
      'gauge',
      'Number of critical alerts',
      criticalAlerts
    );
    this.setMetric(
      'zantara_warning_alerts_total',
      'gauge',
      'Number of warning alerts',
      warningAlerts
    );
  }

  generatePrometheusOutput(): string {
    let output = '';

    // Group metrics by type for better organization
    const gaugeMetrics = Array.from(this.metrics.values()).filter((m) => m.type === 'gauge');
    const counterMetrics = Array.from(this.metrics.values()).filter((m) => m.type === 'counter');

    // Add HELP and TYPE metadata first
    this.metrics.forEach((metric) => {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
    });

    // Add metric values
    this.metrics.forEach((metric) => {
      let labelsStr = '';
      if (metric.labels && Object.keys(metric.labels).length > 0) {
        const labelPairs = Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`);
        labelsStr = `{${labelPairs.join(',')}}`;
      }
      output += `${metric.name}${labelsStr} ${metric.value}\n`;
    });

    return output;
  }

  async startTelemetryServer(): Promise<void> {
    try {
      const { createServer } = await import('http');

      const server = createServer(async (req, res) => {
        if (req.url === '/metrics') {
          try {
            // Update metrics before serving
            await this.updateMetricsFromGlobalState();

            // Increment request counter
            const currentRequests = this.metrics.get('zantara_metrics_requests_total');
            if (currentRequests) {
              currentRequests.value++;
            }

            res.writeHead(200, {
              'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
              'Cache-Control': 'no-cache',
            });
            res.end(this.generatePrometheusOutput());
          } catch (error) {
            console.error('Error generating metrics:', error);
            res.writeHead(500);
            res.end('Error generating metrics\n');
          }
        } else if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'healthy', service: 'zantara-telemetry' }));
        } else {
          res.writeHead(404);
          res.end('Not Found\n');
        }
      });

      server.listen(this.port, () => {
        console.log(`ZANTARA Telemetry server running on port ${this.port}`);
        console.log(`Metrics available at: http://localhost:${this.port}/metrics`);
        console.log(`Health check at: http://localhost:${this.port}/health`);
      });

      // Handle graceful shutdown
      process.on('SIGTERM', () => {
        console.log('Shutting down telemetry server...');
        server.close(() => {
          console.log('Telemetry server stopped');
        });
      });
    } catch (error) {
      console.error('Failed to start telemetry server:', error);
      throw error;
    }
  }
}

// Global telemetry instance
export const zantaraTelemetry = new ZantaraTelemetry();

// Export for standalone execution
export async function startTelemetryService(): Promise<void> {
  await zantaraTelemetry.startTelemetryServer();
}
