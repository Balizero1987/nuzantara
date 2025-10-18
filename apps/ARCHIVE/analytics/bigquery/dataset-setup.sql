-- Zantara Bridge v4.1.0 - BigQuery Data Warehouse Setup
-- Analytics Engine - Stream D Implementation
-- Project: involuted-box-469105-r0

-- Create main analytics dataset
CREATE SCHEMA IF NOT EXISTS `involuted-box-469105-r0.zantara_analytics`
OPTIONS (
  description = "Zantara Bridge v4.1.0 Analytics Data Warehouse",
  location = "asia-southeast2"
);

-- Bridge Performance Metrics Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.bridge_performance` (
  timestamp TIMESTAMP NOT NULL,
  request_id STRING NOT NULL,
  endpoint STRING NOT NULL,
  method STRING NOT NULL,
  status_code INT64 NOT NULL,
  response_time_ms FLOAT64 NOT NULL,
  request_size_bytes INT64,
  response_size_bytes INT64,
  user_agent STRING,
  client_ip STRING,
  region STRING,
  user_id STRING,
  session_id STRING,
  cache_hit BOOLEAN,
  error_message STRING,
  trace_id STRING
)
PARTITION BY DATE(timestamp)
CLUSTER BY endpoint, status_code, region
OPTIONS (
  description = "Bridge API performance and request metrics",
  partition_expiration_days = 90
);

-- User Analytics Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.user_analytics` (
  timestamp TIMESTAMP NOT NULL,
  user_id STRING NOT NULL,
  session_id STRING NOT NULL,
  event_type STRING NOT NULL,
  endpoint STRING,
  duration_ms FLOAT64,
  data_transferred_bytes INT64,
  device_type STRING,
  browser STRING,
  os STRING,
  country STRING,
  city STRING,
  referrer STRING,
  conversion_funnel_step STRING,
  feature_flags ARRAY<STRING>
)
PARTITION BY DATE(timestamp)
CLUSTER BY user_id, event_type, country
OPTIONS (
  description = "User behavior and analytics tracking",
  partition_expiration_days = 365
);

-- System Resources Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.system_resources` (
  timestamp TIMESTAMP NOT NULL,
  instance_id STRING NOT NULL,
  cpu_usage_percent FLOAT64 NOT NULL,
  memory_usage_bytes INT64 NOT NULL,
  memory_total_bytes INT64 NOT NULL,
  disk_usage_bytes INT64,
  network_in_bytes INT64,
  network_out_bytes INT64,
  active_connections INT64,
  queue_depth INT64,
  cache_size_bytes INT64,
  cache_hit_rate FLOAT64,
  gc_collections_count INT64,
  gc_time_ms FLOAT64
)
PARTITION BY DATE(timestamp)
CLUSTER BY instance_id
OPTIONS (
  description = "System resource utilization metrics",
  partition_expiration_days = 30
);

-- Business Metrics Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.business_metrics` (
  timestamp TIMESTAMP NOT NULL,
  metric_name STRING NOT NULL,
  metric_value FLOAT64 NOT NULL,
  metric_unit STRING,
  dimensions STRUCT<
    region STRING,
    customer_segment STRING,
    product_category STRING,
    pricing_tier STRING
  >,
  tags ARRAY<STRING>,
  metadata JSON
)
PARTITION BY DATE(timestamp)
CLUSTER BY metric_name, dimensions.region
OPTIONS (
  description = "Business KPIs and financial metrics",
  partition_expiration_days = 1095
);

-- Error Analytics Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.error_analytics` (
  timestamp TIMESTAMP NOT NULL,
  error_id STRING NOT NULL,
  error_type STRING NOT NULL,
  error_message STRING NOT NULL,
  stack_trace STRING,
  endpoint STRING,
  method STRING,
  status_code INT64,
  user_id STRING,
  session_id STRING,
  request_id STRING,
  severity STRING,
  component STRING,
  environment STRING,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_time_hours FLOAT64
)
PARTITION BY DATE(timestamp)
CLUSTER BY error_type, severity, component
OPTIONS (
  description = "Error tracking and analytics",
  partition_expiration_days = 180
);

-- Real-time Streaming Table
CREATE OR REPLACE TABLE `involuted-box-469105-r0.zantara_analytics.realtime_events` (
  timestamp TIMESTAMP NOT NULL,
  event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  source STRING NOT NULL,
  payload JSON NOT NULL,
  processed_at TIMESTAMP,
  processing_duration_ms FLOAT64,
  enrichment_data JSON,
  anomaly_score FLOAT64,
  alert_triggered BOOLEAN DEFAULT FALSE
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, source
OPTIONS (
  description = "Real-time event streaming and processing",
  partition_expiration_days = 7
);

-- Views for Analytics

-- Daily Performance Summary View
CREATE OR REPLACE VIEW `involuted-box-469105-r0.zantara_analytics.daily_performance_summary` AS
SELECT 
  DATE(timestamp) as date,
  endpoint,
  COUNT(*) as total_requests,
  AVG(response_time_ms) as avg_response_time,
  PERCENTILE_CONT(response_time_ms, 0.95) OVER() as p95_response_time,
  SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as error_5xx_count,
  SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as error_4xx_count,
  AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) as cache_hit_rate,
  SUM(request_size_bytes) as total_request_bytes,
  SUM(response_size_bytes) as total_response_bytes
FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp), endpoint
ORDER BY date DESC, total_requests DESC;

-- User Engagement Analytics View
CREATE OR REPLACE VIEW `involuted-box-469105-r0.zantara_analytics.user_engagement_analytics` AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(DISTINCT session_id) as daily_sessions,
  AVG(duration_ms) as avg_session_duration,
  COUNT(*) as total_events,
  COUNT(DISTINCT country) as countries_served,
  SUM(data_transferred_bytes) as total_data_transferred
FROM `involuted-box-469105-r0.zantara_analytics.user_analytics`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- System Health Dashboard View
CREATE OR REPLACE VIEW `involuted-box-469105-r0.zantara_analytics.system_health_dashboard` AS
SELECT 
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
  AVG(cpu_usage_percent) as avg_cpu_usage,
  AVG(memory_usage_bytes / memory_total_bytes * 100) as avg_memory_usage_percent,
  AVG(active_connections) as avg_active_connections,
  AVG(cache_hit_rate * 100) as avg_cache_hit_rate_percent,
  MAX(queue_depth) as max_queue_depth,
  SUM(gc_time_ms) as total_gc_time
FROM `involuted-box-469105-r0.zantara_analytics.system_resources`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY TIMESTAMP_TRUNC(timestamp, HOUR)
ORDER BY hour DESC;