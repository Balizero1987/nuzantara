-- Zantara Bridge v4.1.0 - BigQuery ML Models
-- Analytics Engine - Stream D Implementation
-- Predictive Analytics and Machine Learning Models

-- 1. Response Time Prediction Model
CREATE OR REPLACE MODEL `involuted-box-469105-r0.zantara_analytics.response_time_predictor`
OPTIONS (
  model_type = 'LINEAR_REG',
  input_label_cols = ['response_time_ms'],
  data_split_method = 'AUTO_SPLIT',
  data_split_eval_fraction = 0.2,
  data_split_col = 'timestamp',
  optimize_strategy = 'BATCH_GRADIENT_DESCENT',
  learn_rate = 0.1,
  l1_reg = 0.01,
  l2_reg = 0.01,
  max_iterations = 100
) AS
SELECT
  EXTRACT(HOUR FROM timestamp) as hour_of_day,
  EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week,
  endpoint,
  method,
  region,
  request_size_bytes,
  CASE WHEN cache_hit THEN 1 ELSE 0 END as cache_hit_flag,
  LAG(response_time_ms, 1) OVER (PARTITION BY endpoint ORDER BY timestamp) as prev_response_time,
  AVG(response_time_ms) OVER (
    PARTITION BY endpoint 
    ORDER BY timestamp 
    ROWS BETWEEN 10 PRECEDING AND 1 PRECEDING
  ) as avg_recent_response_time,
  response_time_ms
FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND response_time_ms IS NOT NULL
  AND response_time_ms > 0
  AND response_time_ms < 30000; -- Filter outliers

-- 2. Error Rate Prediction Model
CREATE OR REPLACE MODEL `involuted-box-469105-r0.zantara_analytics.error_rate_predictor`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['is_error'],
  data_split_method = 'AUTO_SPLIT',
  data_split_eval_fraction = 0.2,
  max_iterations = 50,
  learn_rate = 0.1,
  l1_reg = 0.01,
  l2_reg = 0.01
) AS
SELECT
  EXTRACT(HOUR FROM timestamp) as hour_of_day,
  EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week,
  endpoint,
  method,
  region,
  request_size_bytes,
  response_time_ms,
  CASE WHEN cache_hit THEN 1 ELSE 0 END as cache_hit_flag,
  LAG(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END, 1) 
    OVER (PARTITION BY endpoint ORDER BY timestamp) as prev_error,
  AVG(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) OVER (
    PARTITION BY endpoint 
    ORDER BY timestamp 
    ROWS BETWEEN 10 PRECEDING AND 1 PRECEDING
  ) as recent_error_rate,
  CASE WHEN status_code >= 500 THEN 1 ELSE 0 END as is_error
FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND status_code IS NOT NULL;

-- 3. User Churn Prediction Model
CREATE OR REPLACE MODEL `involuted-box-469105-r0.zantara_analytics.user_churn_predictor`
OPTIONS (
  model_type = 'LOGISTIC_REG',
  input_label_cols = ['will_churn'],
  data_split_method = 'AUTO_SPLIT',
  data_split_eval_fraction = 0.2,
  max_iterations = 50,
  learn_rate = 0.1
) AS
WITH user_features AS (
  SELECT
    user_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    AVG(duration_ms) as avg_session_duration,
    SUM(data_transferred_bytes) as total_data_usage,
    COUNT(DISTINCT endpoint) as unique_endpoints_used,
    MAX(timestamp) as last_activity,
    MIN(timestamp) as first_activity,
    COUNT(DISTINCT device_type) as device_diversity,
    COUNT(DISTINCT country) as geographic_diversity,
    -- Feature: Days since last activity
    DATE_DIFF(CURRENT_DATE(), DATE(MAX(timestamp)), DAY) as days_since_last_activity,
    -- Feature: Activity trend (last 7 days vs previous 7 days)
    COUNTIF(timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)) as recent_activity,
    COUNTIF(timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY) 
           AND timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)) as previous_activity
  FROM `involuted-box-469105-r0.zantara_analytics.user_analytics`
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 60 DAY)
  GROUP BY user_id
)
SELECT
  total_events,
  active_days,
  avg_session_duration,
  total_data_usage,
  unique_endpoints_used,
  device_diversity,
  geographic_diversity,
  days_since_last_activity,
  recent_activity,
  previous_activity,
  CASE 
    WHEN recent_activity > 0 THEN SAFE_DIVIDE(recent_activity, NULLIF(previous_activity, 0))
    ELSE 0 
  END as activity_trend_ratio,
  -- Label: User will churn if no activity in last 14 days
  CASE 
    WHEN days_since_last_activity > 14 THEN 1 
    ELSE 0 
  END as will_churn
FROM user_features
WHERE first_activity < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY); -- Only users with enough history

-- 4. Traffic Forecasting Model (Time Series)
CREATE OR REPLACE MODEL `involuted-box-469105-r0.zantara_analytics.traffic_forecaster`
OPTIONS (
  model_type = 'ARIMA_PLUS',
  time_series_timestamp_col = 'hour',
  time_series_data_col = 'request_count',
  auto_arima = TRUE,
  data_frequency = 'HOURLY',
  holiday_region = 'GLOBAL'
) AS
SELECT
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
  COUNT(*) as request_count
FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY TIMESTAMP_TRUNC(timestamp, HOUR)
ORDER BY hour;

-- 5. Anomaly Detection Model
CREATE OR REPLACE MODEL `involuted-box-469105-r0.zantara_analytics.anomaly_detector`
OPTIONS (
  model_type = 'AUTOENCODER',
  hidden_units = [32, 16, 8, 16, 32],
  batch_size = 32,
  max_iterations = 100,
  learn_rate = 0.001,
  dropout = 0.2
) AS
SELECT
  response_time_ms,
  request_size_bytes,
  response_size_bytes,
  CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END as cache_hit_numeric,
  EXTRACT(HOUR FROM timestamp) as hour,
  EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week
FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
  AND status_code < 400; -- Only normal behavior for training

-- Prediction and Insights Functions

-- Function: Get Response Time Predictions
CREATE OR REPLACE TABLE FUNCTION `involuted-box-469105-r0.zantara_analytics.predict_response_times`(
  prediction_hour INT64,
  prediction_day_of_week INT64,
  input_endpoint STRING,
  input_method STRING,
  input_region STRING,
  input_request_size INT64
)
AS (
  SELECT 
    predicted_response_time_ms,
    prediction_interval_lower_bound,
    prediction_interval_upper_bound
  FROM ML.PREDICT(
    MODEL `involuted-box-469105-r0.zantara_analytics.response_time_predictor`,
    (SELECT 
      prediction_hour as hour_of_day,
      prediction_day_of_week as day_of_week,
      input_endpoint as endpoint,
      input_method as method,
      input_region as region,
      input_request_size as request_size_bytes,
      1 as cache_hit_flag,
      1000.0 as prev_response_time,
      1000.0 as avg_recent_response_time
    )
  )
);

-- Function: Detect Anomalies
CREATE OR REPLACE TABLE FUNCTION `involuted-box-469105-r0.zantara_analytics.detect_anomalies`(
  start_timestamp TIMESTAMP,
  end_timestamp TIMESTAMP
)
AS (
  WITH predictions AS (
    SELECT 
      timestamp,
      endpoint,
      response_time_ms,
      predicted_response_time_ms,
      reconstruction_loss
    FROM ML.DETECT_ANOMALIES(
      MODEL `involuted-box-469105-r0.zantara_analytics.anomaly_detector`,
      (SELECT 
        timestamp,
        endpoint,
        response_time_ms,
        request_size_bytes,
        response_size_bytes,
        CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END as cache_hit_numeric,
        EXTRACT(HOUR FROM timestamp) as hour,
        EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week
       FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
       WHERE timestamp BETWEEN start_timestamp AND end_timestamp
      ),
      STRUCT(0.02 as contamination)
    )
  )
  SELECT 
    timestamp,
    endpoint,
    response_time_ms,
    predicted_response_time_ms,
    reconstruction_loss,
    CASE WHEN reconstruction_loss > 0.95 THEN 'HIGH_ANOMALY'
         WHEN reconstruction_loss > 0.85 THEN 'MEDIUM_ANOMALY'
         ELSE 'NORMAL' END as anomaly_level
  FROM predictions
  ORDER BY reconstruction_loss DESC
);

-- Function: Traffic Forecast
CREATE OR REPLACE TABLE FUNCTION `involuted-box-469105-r0.zantara_analytics.forecast_traffic`(
  forecast_hours INT64
)
AS (
  SELECT
    forecast_timestamp,
    forecast_value as predicted_request_count,
    standard_error,
    confidence_level,
    prediction_interval_lower_bound,
    prediction_interval_upper_bound,
    confidence_interval_lower_bound,
    confidence_interval_upper_bound
  FROM ML.FORECAST(
    MODEL `involuted-box-469105-r0.zantara_analytics.traffic_forecaster`,
    STRUCT(forecast_hours as horizon, 0.8 as confidence_level)
  )
);

-- Analytics Dashboard Queries

-- Real-time Performance Insights
CREATE OR REPLACE VIEW `involuted-box-469105-r0.zantara_analytics.realtime_insights` AS
WITH current_metrics AS (
  SELECT 
    COUNT(*) as current_requests,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(response_time_ms, 0.95) OVER() as p95_response_time,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) / COUNT(*) * 100 as error_rate,
    AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate
  FROM `involuted-box-469105-r0.zantara_analytics.bridge_performance`
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
),
predictions AS (
  SELECT 
    AVG(predicted_response_time_ms) as predicted_avg_response_time
  FROM ML.PREDICT(
    MODEL `involuted-box-469105-r0.zantara_analytics.response_time_predictor`,
    (SELECT 
      EXTRACT(HOUR FROM CURRENT_TIMESTAMP()) as hour_of_day,
      EXTRACT(DAYOFWEEK FROM CURRENT_TIMESTAMP()) as day_of_week,
      '/api/v1/bridge' as endpoint,
      'POST' as method,
      'asia-southeast' as region,
      1024 as request_size_bytes,
      1 as cache_hit_flag,
      1000.0 as prev_response_time,
      1000.0 as avg_recent_response_time
    )
  )
)
SELECT 
  current_requests,
  avg_response_time,
  p95_response_time,
  error_rate,
  cache_hit_rate,
  predicted_avg_response_time,
  CASE 
    WHEN avg_response_time > predicted_avg_response_time * 1.5 THEN 'PERFORMANCE_DEGRADED'
    WHEN error_rate > 5 THEN 'HIGH_ERROR_RATE'
    WHEN cache_hit_rate < 70 THEN 'LOW_CACHE_EFFICIENCY'
    ELSE 'HEALTHY'
  END as system_status
FROM current_metrics, predictions;