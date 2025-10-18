#!/usr/bin/env python3
"""
Zantara Bridge v4.1.0 - ML Predictive Analytics Pipeline
Analytics Engine - Stream D Implementation
Advanced Machine Learning for Business Intelligence
"""

import os
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import joblib
from pathlib import Path

# ML and Data Science Libraries
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, accuracy_score, classification_report
from sklearn.pipeline import Pipeline
import xgboost as xgb
from scipy import stats

# Google Cloud Libraries
from google.cloud import bigquery, aiplatform
from google.cloud.aiplatform import gapic as aip

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ZantaraPredictiveAnalytics:
    """Advanced Predictive Analytics Pipeline for Zantara Bridge"""
    
    def __init__(self, project_id: str = "involuted-box-469105-r0"):
        self.project_id = project_id
        self.dataset_id = "zantara_analytics"
        self.region = "asia-southeast2"
        
        # Initialize clients
        self.bq_client = bigquery.Client(project=project_id)
        
        # Model storage
        self.models_path = Path("models")
        self.models_path.mkdir(exist_ok=True)
        
        # Feature engineering parameters
        self.feature_windows = [1, 6, 24, 168]  # 1h, 6h, 24h, 1week
        
        logger.info("Zantara Predictive Analytics Pipeline initialized")
    
    def extract_features(self, hours_back: int = 168) -> pd.DataFrame:
        """Extract and engineer features for ML models"""
        
        logger.info(f"Extracting features for last {hours_back} hours")
        
        # Query to get comprehensive performance data
        query = f"""
        WITH performance_base AS (
          SELECT 
            timestamp,
            endpoint,
            method,
            status_code,
            response_time_ms,
            request_size_bytes,
            response_size_bytes,
            region,
            user_id,
            cache_hit,
            EXTRACT(HOUR FROM timestamp) as hour_of_day,
            EXTRACT(DAYOFWEEK FROM timestamp) as day_of_week,
            EXTRACT(WEEK FROM timestamp) as week_of_year,
            EXTRACT(MONTH FROM timestamp) as month
          FROM `{self.project_id}.{self.dataset_id}.bridge_performance`
          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {hours_back} HOUR)
            AND response_time_ms IS NOT NULL
            AND response_time_ms > 0
        ),
        feature_enriched AS (
          SELECT *,
            -- Moving averages
            AVG(response_time_ms) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              ROWS BETWEEN 60 PRECEDING AND 1 PRECEDING
            ) as avg_response_time_1h,
            
            AVG(response_time_ms) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              ROWS BETWEEN 360 PRECEDING AND 1 PRECEDING
            ) as avg_response_time_6h,
            
            -- Error rates
            AVG(CASE WHEN status_code >= 500 THEN 1.0 ELSE 0.0 END) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              ROWS BETWEEN 60 PRECEDING AND 1 PRECEDING
            ) as error_rate_1h,
            
            -- Traffic patterns
            COUNT(*) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              RANGE BETWEEN INTERVAL 1 HOUR PRECEDING AND CURRENT ROW
            ) as requests_per_hour,
            
            -- User behavior
            COUNT(DISTINCT user_id) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              RANGE BETWEEN INTERVAL 1 HOUR PRECEDING AND CURRENT ROW
            ) as unique_users_per_hour,
            
            -- Cache performance
            AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) OVER (
              PARTITION BY endpoint 
              ORDER BY timestamp 
              ROWS BETWEEN 60 PRECEDING AND 1 PRECEDING
            ) as cache_hit_rate_1h
            
          FROM performance_base
        )
        SELECT * FROM feature_enriched
        ORDER BY timestamp
        """
        
        df = self.bq_client.query(query).to_dataframe()
        logger.info(f"Extracted {len(df)} records with features")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Prepare and encode features for ML models"""
        
        logger.info("Preparing features for ML models")
        
        # Create feature engineering metadata
        feature_metadata = {
            'categorical_features': ['endpoint', 'method', 'region'],
            'numerical_features': [],
            'encoders': {},
            'scalers': {},
            'feature_names': []
        }
        
        # Handle missing values
        df = df.fillna(method='ffill').fillna(0)
        
        # Encode categorical features
        for col in feature_metadata['categorical_features']:
            if col in df.columns:
                encoder = LabelEncoder()
                df[f'{col}_encoded'] = encoder.fit_transform(df[col].astype(str))
                feature_metadata['encoders'][col] = encoder
        
        # Select numerical features
        numerical_cols = [
            'response_time_ms', 'request_size_bytes', 'response_size_bytes',
            'hour_of_day', 'day_of_week', 'week_of_year', 'month',
            'avg_response_time_1h', 'avg_response_time_6h', 'error_rate_1h',
            'requests_per_hour', 'unique_users_per_hour', 'cache_hit_rate_1h'
        ]
        
        # Add encoded categorical features
        encoded_cols = [f'{col}_encoded' for col in feature_metadata['categorical_features'] if col in df.columns]
        numerical_cols.extend(encoded_cols)
        
        # Filter available columns
        available_numerical_cols = [col for col in numerical_cols if col in df.columns]
        feature_metadata['numerical_features'] = available_numerical_cols
        
        # Create feature matrix
        X = df[available_numerical_cols].copy()
        
        # Handle any remaining NaN values
        X = X.fillna(X.mean())
        
        # Create derived features
        if 'response_time_ms' in X.columns and 'avg_response_time_1h' in X.columns:
            X['response_time_ratio'] = X['response_time_ms'] / (X['avg_response_time_1h'] + 1)
        
        if 'requests_per_hour' in X.columns:
            X['traffic_load'] = X['requests_per_hour'] / X['requests_per_hour'].quantile(0.95)
        
        # Update feature names
        feature_metadata['feature_names'] = list(X.columns)
        
        logger.info(f"Prepared {len(X.columns)} features for ML models")
        return X, feature_metadata
    
    def train_response_time_predictor(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Train response time prediction model"""
        
        logger.info("Training response time prediction model")
        
        X, feature_metadata = self.prepare_features(df)
        y = df['response_time_ms'].copy()
        
        # Remove target from features if present
        if 'response_time_ms' in X.columns:
            X = X.drop('response_time_ms', axis=1)
            feature_metadata['feature_names'] = list(X.columns)
        
        # Time series split for validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        # XGBoost model for response time prediction
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        
        # Training pipeline with scaling
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('model', model)
        ])
        
        # Cross-validation scores
        cv_scores = []
        for train_idx, val_idx in tscv.split(X):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            pipeline.fit(X_train, y_train)
            y_pred = pipeline.predict(X_val)
            mae = mean_absolute_error(y_val, y_pred)
            cv_scores.append(mae)
        
        # Train on full dataset
        pipeline.fit(X, y)
        
        # Feature importance
        feature_importance = pd.DataFrame({\n            'feature': feature_metadata['feature_names'],\n            'importance': pipeline.named_steps['model'].feature_importances_\n        }).sort_values('importance', ascending=False)\n        \n        # Save model\n        model_path = self.models_path / 'response_time_predictor.joblib'\n        joblib.dump({\n            'pipeline': pipeline,\n            'feature_metadata': feature_metadata,\n            'feature_importance': feature_importance,\n            'cv_scores': cv_scores\n        }, model_path)\n        \n        results = {\n            'model_type': 'response_time_predictor',\n            'cv_mean_mae': np.mean(cv_scores),\n            'cv_std_mae': np.std(cv_scores),\n            'feature_importance': feature_importance.to_dict('records')[:10],\n            'model_path': str(model_path)\n        }\n        \n        logger.info(f\"Response time predictor trained with MAE: {results['cv_mean_mae']:.2f}ms\")\n        return results\n    \n    def train_anomaly_detector(self, df: pd.DataFrame) -> Dict[str, Any]:\n        \"\"\"Train anomaly detection model\"\"\"\n        \n        logger.info(\"Training anomaly detection model\")\n        \n        X, feature_metadata = self.prepare_features(df)\n        \n        # Use Isolation Forest for anomaly detection\n        from sklearn.ensemble import IsolationForest\n        \n        # Filter normal behavior (status codes < 400)\n        normal_data = df[df['status_code'] < 400]\n        X_normal, _ = self.prepare_features(normal_data)\n        \n        if 'response_time_ms' in X_normal.columns:\n            X_normal = X_normal.drop('response_time_ms', axis=1)\n        \n        # Train isolation forest\n        anomaly_model = IsolationForest(\n            contamination=0.1,  # Expect 10% anomalies\n            random_state=42,\n            n_estimators=100\n        )\n        \n        # Pipeline with scaling\n        pipeline = Pipeline([\n            ('scaler', StandardScaler()),\n            ('anomaly_detector', anomaly_model)\n        ])\n        \n        pipeline.fit(X_normal)\n        \n        # Test on recent data\n        if 'response_time_ms' in X.columns:\n            X_test = X.drop('response_time_ms', axis=1)\n        else:\n            X_test = X\n            \n        anomaly_scores = pipeline.decision_function(X_test)\n        anomaly_labels = pipeline.predict(X_test)\n        \n        # Save model\n        model_path = self.models_path / 'anomaly_detector.joblib'\n        joblib.dump({\n            'pipeline': pipeline,\n            'feature_metadata': feature_metadata,\n            'anomaly_threshold': np.percentile(anomaly_scores, 10)\n        }, model_path)\n        \n        results = {\n            'model_type': 'anomaly_detector',\n            'anomaly_rate': (anomaly_labels == -1).mean(),\n            'anomaly_threshold': np.percentile(anomaly_scores, 10),\n            'model_path': str(model_path)\n        }\n        \n        logger.info(f\"Anomaly detector trained with {results['anomaly_rate']:.2%} anomaly rate\")\n        return results\n    \n    def train_user_churn_predictor(self) -> Dict[str, Any]:\n        \"\"\"Train user churn prediction model\"\"\"\n        \n        logger.info(\"Training user churn prediction model\")\n        \n        # Query user behavior data\n        query = f\"\"\"\n        WITH user_features AS (\n          SELECT\n            user_id,\n            COUNT(*) as total_events,\n            COUNT(DISTINCT DATE(timestamp)) as active_days,\n            AVG(duration_ms) as avg_session_duration,\n            SUM(data_transferred_bytes) as total_data_usage,\n            COUNT(DISTINCT endpoint) as unique_endpoints_used,\n            MAX(timestamp) as last_activity,\n            MIN(timestamp) as first_activity,\n            -- Feature: Days since last activity\n            DATE_DIFF(CURRENT_DATE(), DATE(MAX(timestamp)), DAY) as days_since_last_activity,\n            -- Feature: Activity trend\n            COUNTIF(timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)) as recent_activity,\n            COUNTIF(timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY) \n                   AND timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)) as previous_activity\n          FROM `{self.project_id}.{self.dataset_id}.user_analytics`\n          WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 60 DAY)\n          GROUP BY user_id\n        )\n        SELECT\n          total_events,\n          active_days,\n          avg_session_duration,\n          total_data_usage,\n          unique_endpoints_used,\n          days_since_last_activity,\n          recent_activity,\n          previous_activity,\n          CASE \n            WHEN recent_activity > 0 THEN SAFE_DIVIDE(recent_activity, NULLIF(previous_activity, 0))\n            ELSE 0 \n          END as activity_trend_ratio,\n          -- Label: User will churn if no activity in last 14 days\n          CASE \n            WHEN days_since_last_activity > 14 THEN 1 \n            ELSE 0 \n          END as will_churn\n        FROM user_features\n        WHERE first_activity < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)\n        \"\"\"\n        \n        df = self.bq_client.query(query).to_dataframe()\n        \n        if len(df) < 100:\n            logger.warning(\"Insufficient data for churn prediction model\")\n            return {'model_type': 'user_churn_predictor', 'error': 'Insufficient data'}\n        \n        # Prepare features\n        feature_cols = [\n            'total_events', 'active_days', 'avg_session_duration', 'total_data_usage',\n            'unique_endpoints_used', 'days_since_last_activity', 'recent_activity',\n            'previous_activity', 'activity_trend_ratio'\n        ]\n        \n        X = df[feature_cols].fillna(0)\n        y = df['will_churn']\n        \n        # Train-test split\n        X_train, X_test, y_train, y_test = train_test_split(\n            X, y, test_size=0.2, random_state=42, stratify=y\n        )\n        \n        # Gradient Boosting Classifier\n        model = GradientBoostingClassifier(\n            n_estimators=100,\n            learning_rate=0.1,\n            max_depth=5,\n            random_state=42\n        )\n        \n        # Pipeline with scaling\n        pipeline = Pipeline([\n            ('scaler', StandardScaler()),\n            ('classifier', model)\n        ])\n        \n        pipeline.fit(X_train, y_train)\n        \n        # Evaluate\n        y_pred = pipeline.predict(X_test)\n        accuracy = accuracy_score(y_test, y_pred)\n        \n        # Feature importance\n        feature_importance = pd.DataFrame({\n            'feature': feature_cols,\n            'importance': pipeline.named_steps['classifier'].feature_importances_\n        }).sort_values('importance', ascending=False)\n        \n        # Save model\n        model_path = self.models_path / 'user_churn_predictor.joblib'\n        joblib.dump({\n            'pipeline': pipeline,\n            'feature_cols': feature_cols,\n            'feature_importance': feature_importance\n        }, model_path)\n        \n        results = {\n            'model_type': 'user_churn_predictor',\n            'accuracy': accuracy,\n            'feature_importance': feature_importance.to_dict('records'),\n            'model_path': str(model_path)\n        }\n        \n        logger.info(f\"Churn predictor trained with accuracy: {accuracy:.3f}\")\n        return results\n    \n    def generate_business_insights(self) -> Dict[str, Any]:\n        \"\"\"Generate business insights using trained models\"\"\"\n        \n        logger.info(\"Generating business insights\")\n        \n        insights = {\n            'timestamp': datetime.utcnow().isoformat(),\n            'performance_insights': {},\n            'business_insights': {},\n            'predictions': {},\n            'recommendations': []\n        }\n        \n        try:\n            # Query recent performance data\n            query = f\"\"\"\n            SELECT \n              AVG(response_time_ms) as avg_response_time,\n              PERCENTILE_CONT(response_time_ms, 0.95) OVER() as p95_response_time,\n              SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) / COUNT(*) * 100 as error_rate,\n              AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END) * 100 as cache_hit_rate,\n              COUNT(*) as total_requests,\n              COUNT(DISTINCT user_id) as unique_users\n            FROM `{self.project_id}.{self.dataset_id}.bridge_performance`\n            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)\n            \"\"\"\n            \n            perf_data = self.bq_client.query(query).to_dataframe().iloc[0]\n            \n            insights['performance_insights'] = {\n                'avg_response_time_ms': float(perf_data['avg_response_time']),\n                'p95_response_time_ms': float(perf_data['p95_response_time']),\n                'error_rate_percent': float(perf_data['error_rate']),\n                'cache_hit_rate_percent': float(perf_data['cache_hit_rate']),\n                'total_requests': int(perf_data['total_requests']),\n                'unique_users': int(perf_data['unique_users'])\n            }\n            \n            # Business metrics query\n            biz_query = f\"\"\"\n            SELECT \n              SUM(CASE WHEN metric_name = 'hourly_revenue' THEN metric_value ELSE 0 END) as total_revenue,\n              SUM(CASE WHEN metric_name = 'api_calls_billable' THEN metric_value ELSE 0 END) as billable_calls,\n              SUM(CASE WHEN metric_name = 'new_users' THEN metric_value ELSE 0 END) as new_users\n            FROM `{self.project_id}.{self.dataset_id}.business_metrics`\n            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)\n            \"\"\"\n            \n            biz_data = self.bq_client.query(biz_query).to_dataframe().iloc[0]\n            \n            insights['business_insights'] = {\n                'revenue_24h_usd': float(biz_data['total_revenue']),\n                'billable_api_calls_24h': float(biz_data['billable_calls']),\n                'new_users_24h': float(biz_data['new_users'])\n            }\n            \n            # Generate recommendations based on insights\n            recommendations = []\n            \n            if insights['performance_insights']['error_rate_percent'] > 1:\n                recommendations.append({\n                    'type': 'PERFORMANCE',\n                    'priority': 'HIGH',\n                    'message': f\"Error rate is {insights['performance_insights']['error_rate_percent']:.2f}% - investigate error causes\"\n                })\n            \n            if insights['performance_insights']['cache_hit_rate_percent'] < 80:\n                recommendations.append({\n                    'type': 'PERFORMANCE',\n                    'priority': 'MEDIUM',\n                    'message': f\"Cache hit rate is {insights['performance_insights']['cache_hit_rate_percent']:.1f}% - optimize caching strategy\"\n                })\n            \n            if insights['performance_insights']['p95_response_time_ms'] > 2000:\n                recommendations.append({\n                    'type': 'PERFORMANCE',\n                    'priority': 'HIGH',\n                    'message': f\"P95 response time is {insights['performance_insights']['p95_response_time_ms']:.0f}ms - investigate bottlenecks\"\n                })\n            \n            insights['recommendations'] = recommendations\n            \n        except Exception as e:\n            logger.error(f\"Error generating insights: {e}\")\n            insights['error'] = str(e)\n        \n        return insights\n    \n    def run_ml_pipeline(self) -> Dict[str, Any]:\n        \"\"\"Run the complete ML pipeline\"\"\"\n        \n        pipeline_start = datetime.utcnow()\n        results = {\n            'pipeline_start': pipeline_start.isoformat(),\n            'models_trained': [],\n            'errors': [],\n            'insights': {}\n        }\n        \n        try:\n            # Extract features\n            logger.info(\"Starting ML pipeline...\")\n            df = self.extract_features(hours_back=168)  # 1 week of data\n            \n            if len(df) < 1000:\n                logger.warning(\"Insufficient data for ML training\")\n                results['errors'].append(\"Insufficient data for ML training\")\n                return results\n            \n            # Train response time predictor\n            try:\n                response_time_results = self.train_response_time_predictor(df)\n                results['models_trained'].append(response_time_results)\n                logger.info(\"Response time predictor trained successfully\")\n            except Exception as e:\n                error_msg = f\"Response time predictor training failed: {str(e)}\"\n                logger.error(error_msg)\n                results['errors'].append(error_msg)\n            \n            # Train anomaly detector\n            try:\n                anomaly_results = self.train_anomaly_detector(df)\n                results['models_trained'].append(anomaly_results)\n                logger.info(\"Anomaly detector trained successfully\")\n            except Exception as e:\n                error_msg = f\"Anomaly detector training failed: {str(e)}\"\n                logger.error(error_msg)\n                results['errors'].append(error_msg)\n            \n            # Train churn predictor\n            try:\n                churn_results = self.train_user_churn_predictor()\n                results['models_trained'].append(churn_results)\n                logger.info(\"Churn predictor trained successfully\")\n            except Exception as e:\n                error_msg = f\"Churn predictor training failed: {str(e)}\"\n                logger.error(error_msg)\n                results['errors'].append(error_msg)\n            \n            # Generate business insights\n            try:\n                insights = self.generate_business_insights()\n                results['insights'] = insights\n                logger.info(\"Business insights generated successfully\")\n            except Exception as e:\n                error_msg = f\"Insight generation failed: {str(e)}\"\n                logger.error(error_msg)\n                results['errors'].append(error_msg)\n            \n        except Exception as e:\n            error_msg = f\"ML pipeline error: {str(e)}\"\n            logger.error(error_msg)\n            results['errors'].append(error_msg)\n        \n        results['pipeline_end'] = datetime.utcnow().isoformat()\n        results['duration_seconds'] = (datetime.utcnow() - pipeline_start).total_seconds()\n        \n        logger.info(f\"ML pipeline completed in {results['duration_seconds']:.1f} seconds\")\n        return results\n\ndef main():\n    \"\"\"Main ML pipeline execution function\"\"\"\n    \n    logger.info(\"Starting Zantara Bridge ML Predictive Analytics Pipeline\")\n    \n    ml_pipeline = ZantaraPredictiveAnalytics()\n    results = ml_pipeline.run_ml_pipeline()\n    \n    logger.info(\"ML Pipeline Results:\")\n    logger.info(json.dumps(results, indent=2, default=str))\n    \n    return results\n\nif __name__ == \"__main__\":\n    main()"