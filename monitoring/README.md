# ZANTARA Monitoring Stack - Complete Documentation

## 📊 Overview

Enterprise-grade monitoring solution for ZANTARA AI system providing real-time visibility, proactive alerting, and performance analysis.

### Stack Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notification
- **Node Exporter**: System-level metrics
- **Blackbox Exporter**: Uptime monitoring

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/monitoring

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `zantara2025` (change in production!)
  
- **Prometheus**: http://localhost:9090
  
- **Alertmanager**: http://localhost:9093

### 3. Configure Data Source in Grafana

1. Login to Grafana (http://localhost:3000)
2. Go to Configuration → Data Sources
3. Prometheus should be auto-configured
4. Test connection

### 4. Import Dashboards

1. Go to Dashboards → Import
2. Upload `grafana/dashboards/zantara-overview.json`
3. Select Prometheus data source
4. Save

---

## 📈 Available Metrics

### HTTP Metrics

```promql
# Total requests
zantara_http_requests_total{method="POST", endpoint="/api/chat", status="200"}

# Request duration (P50, P95, P99)
histogram_quantile(0.95, sum(rate(zantara_request_duration_seconds_bucket[5m])) by (le))

# Error rate
rate(zantara_http_requests_total{status=~"5.."}[5m])
```

### AI Metrics

```promql
# AI requests by model
sum(rate(zantara_ai_requests_total[5m])) by (model)

# AI latency
histogram_quantile(0.95, sum(rate(zantara_ai_latency_seconds_bucket[5m])) by (le, model))

# Token usage
sum(rate(zantara_ai_tokens_used_total[5m])) by (model)
```

### Cache Metrics

```promql
# Cache hit rate
sum(rate(zantara_cache_hits_total[5m])) / 
(sum(rate(zantara_cache_hits_total[5m])) + sum(rate(zantara_cache_misses_total[5m])))

# Cache operations
rate(zantara_cache_set_operations_total[5m])
```

### System Metrics

```promql
# Memory usage
zantara_memory_usage_mb

# CPU usage
zantara_cpu_usage_percent

# Active sessions
zantara_active_sessions_total

# Database connections
zantara_db_connections_active
```

### Oracle Query Metrics

```promql
# Oracle queries by collection
sum(rate(zantara_oracle_queries_total[5m])) by (collection)

# Oracle query latency
histogram_quantile(0.95, sum(rate(zantara_oracle_query_duration_seconds_bucket[5m])) by (le, collection))
```

---

## 🚨 Alert Rules

### Critical Alerts (Immediate Action Required)

1. **ServiceDown**
   - Trigger: Service unavailable for 1+ minute
   - Severity: Critical
   - Action: Check service logs, restart if needed

2. **HighErrorRate**
   - Trigger: Error rate > 5% for 5 minutes
   - Severity: Critical
   - Action: Check error logs, investigate root cause

3. **AIServiceFailure**
   - Trigger: No AI requests for 3+ minutes with active traffic
   - Severity: Critical
   - Action: Check Claude API status, verify API key

4. **DatabaseConnectionPoolExhausted**
   - Trigger: ≥95 active connections
   - Severity: Critical
   - Action: Scale database pool, check for connection leaks

5. **MemoryUsageCritical**
   - Trigger: Memory > 1800MB for 5 minutes
   - Severity: Critical
   - Action: Check for memory leaks, consider scaling

6. **FrontendDown**
   - Trigger: Frontend unreachable for 2+ minutes
   - Severity: Critical
   - Action: Check CDN, verify DNS, restart if needed

### Warning Alerts (Attention Required)

1. **SlowResponseTime**
   - Trigger: P95 > 2s for 10 minutes
   - Severity: Warning
   - Action: Check database queries, optimize slow endpoints

2. **LowCacheHitRate**
   - Trigger: Hit rate < 50% for 15 minutes
   - Severity: Warning
   - Action: Review cache strategy, warm cache

3. **AITokenUsageSpike**
   - Trigger: > 10,000 tokens in 5 minutes
   - Severity: Warning
   - Action: Check for unusual queries, verify pricing

4. **RedisLatencyHigh**
   - Trigger: Latency > 100ms for 5 minutes
   - Severity: Warning
   - Action: Check Redis health, consider scaling

---

## 📊 Dashboard Usage Guide

### Main Production Dashboard

**Panels Overview:**

1. **Service Health Status** (Top Left)
   - Green = UP, Red = DOWN
   - Shows all ZANTARA services
   - Real-time status

2. **Request Rate** (Top Center)
   - Requests per second by service
   - Trend over time
   - Normal range: 5-50 req/s

3. **Error Rate** (Top Right)
   - Percentage of 5xx errors
   - Target: < 1%
   - Alert threshold: 5%

4. **Response Time (P50/P95/P99)** (Middle)
   - Latency percentiles
   - P95 target: < 1.5s
   - P99 target: < 2s

5. **AI Requests by Model** (Bottom Left)
   - Haiku usage breakdown
   - Cost monitoring

6. **AI Token Usage Rate** (Bottom Center)
   - Tokens consumed per second
   - Cost projection

7. **Cache Hit Rate** (Bottom Right)
   - Percentage of cache hits
   - Target: > 70%

8. **Memory & CPU Usage**
   - System resource utilization
   - Memory limit: 2048MB
   - CPU target: < 80%

9. **Active Sessions & DB Connections**
   - Concurrent users
   - Database load

### Custom Query Examples

```promql
# Top 5 slowest endpoints
topk(5, sum(rate(zantara_request_duration_seconds_sum[5m])) by (endpoint) /
         sum(rate(zantara_request_duration_seconds_count[5m])) by (endpoint))

# Error breakdown by endpoint
sum(rate(zantara_http_requests_total{status=~"5.."}[5m])) by (endpoint)

# Most expensive AI queries (by tokens)
topk(10, sum(rate(zantara_ai_tokens_used_total[5m])) by (model))
```

---

## 🔔 Alert Configuration

### Alertmanager Routes

```yaml
# monitoring/alertmanager/alertmanager.yml

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'alerts@zantara.com'
        from: 'monitoring@zantara.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'monitoring@zantara.com'
        auth_password: 'password'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'

  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#zantara-alerts'
        title: 'ZANTARA Alert'
        text: '{{ .CommonAnnotations.description }}'
```

---

## 🛠️ Maintenance Tasks

### Daily

- Check dashboard for anomalies
- Review alert history
- Verify all services UP

### Weekly

- Review error rate trends
- Analyze slow queries
- Check disk space usage

### Monthly

- Review retention policies
- Optimize slow dashboards
- Update alert thresholds based on trends

---

## 🐛 Troubleshooting

### Prometheus not scraping targets

```bash
# Check Prometheus logs
docker-compose logs prometheus

# Verify targets in Prometheus UI
# Go to Status → Targets

# Test connectivity
curl https://nuzantara-rag.fly.dev/metrics
```

### Grafana dashboard shows "No data"

1. Verify Prometheus data source is connected
2. Check query syntax in panel editor
3. Verify time range is appropriate
4. Check Prometheus has data: http://localhost:9090

### Alerts not firing

```bash
# Check Alertmanager logs
docker-compose logs alertmanager

# Verify alert rules loaded
# Go to Prometheus → Status → Rules

# Test alert manually
# Go to Alertmanager UI → Silence
```

### High memory usage in Prometheus

```bash
# Reduce retention period
# Edit prometheus.yml:
# --storage.tsdb.retention.time=15d

# Restart Prometheus
docker-compose restart prometheus
```

---

## 📦 Production Deployment

### Fly.io Deployment

```bash
# Create monitoring app
fly apps create zantara-monitoring

# Deploy Prometheus
fly deploy --config monitoring/fly-prometheus.toml

# Deploy Grafana
fly deploy --config monitoring/fly-grafana.toml

# Set secrets
fly secrets set GRAFANA_PASSWORD=your-secure-password
```

### Cloud Deployment (AWS/GCP)

1. Use managed Prometheus (AWS Managed Prometheus / GCP Cloud Monitoring)
2. Use managed Grafana (AWS Managed Grafana / GCP Grafana)
3. Configure VPC peering for metrics collection
4. Set up IAM roles for service access

---

## 🔐 Security Best Practices

1. **Change default passwords**
   - Grafana admin password
   - Alertmanager auth

2. **Enable HTTPS**
   - Use reverse proxy (nginx/Caddy)
   - Configure TLS certificates

3. **Restrict access**
   - Use IP whitelisting
   - Implement OAuth/SSO for Grafana

4. **Secure secrets**
   - Use environment variables
   - Store in secrets manager (Vault/AWS Secrets Manager)

---

## 📞 Support

- Documentation: https://docs.zantara.com/monitoring
- Runbooks: https://docs.zantara.com/runbooks
- Team: platform@zantara.com

---

**Last Updated:** 2025-11-02  
**Version:** 1.0  
**Maintained by:** Platform Team
