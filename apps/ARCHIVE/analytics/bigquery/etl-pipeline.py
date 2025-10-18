#!/usr/bin/env python3
"""
Zantara Bridge v4.1.0 - BigQuery ETL Pipeline
Analytics Engine - Stream D Implementation
Project: involuted-box-469105-r0
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from google.cloud import bigquery, logging as cloud_logging, storage
from google.cloud.logging import Client as LoggingClient
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ZantaraBridgeETL:
    """ETL Pipeline for Zantara Bridge Analytics"""
    
    def __init__(self, project_id: str = "involuted-box-469105-r0"):
        self.project_id = project_id
        self.dataset_id = "zantara_analytics"
        self.bq_client = bigquery.Client(project=project_id)
        self.storage_client = storage.Client(project=project_id)
        self.logging_client = LoggingClient(project=project_id)
        
        # Initialize dataset
        self._ensure_dataset_exists()
    
    def _ensure_dataset_exists(self) -> None:
        """Ensure the analytics dataset exists"""
        dataset_ref = self.bq_client.dataset(self.dataset_id)
        
        try:
            self.bq_client.get_dataset(dataset_ref)
            logger.info(f"Dataset {self.dataset_id} already exists")
        except Exception:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "asia-southeast2"
            dataset.description = "Zantara Bridge v4.1.0 Analytics Data Warehouse"
            
            self.bq_client.create_dataset(dataset)
            logger.info(f"Created dataset {self.dataset_id}")
    
    def extract_cloud_run_logs(self, hours_back: int = 1) -> List[Dict[str, Any]]:
        """Extract Cloud Run logs for performance analytics"""
        
        # Time range for log extraction
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours_back)
        
        # Log filter for Zantara Bridge service
        filter_str = f'''
        resource.type="cloud_run_revision"
        resource.labels.service_name="zantara-bridge-v2-prod"
        timestamp >= "{start_time.isoformat()}Z"
        timestamp <= "{end_time.isoformat()}Z"
        '''
        
        logger.info(f"Extracting logs from {start_time} to {end_time}")
        
        entries = []
        for entry in self.logging_client.list_entries(filter_=filter_str):
            try:
                # Parse log entry for analytics
                log_data = {
                    'timestamp': entry.timestamp.isoformat(),
                    'request_id': entry.labels.get('request_id', ''),
                    'method': entry.http_request.request_method if entry.http_request else '',
                    'endpoint': entry.http_request.request_url if entry.http_request else '',
                    'status_code': entry.http_request.status if entry.http_request else 0,
                    'response_time_ms': entry.labels.get('response_time_ms', 0),
                    'user_agent': entry.http_request.user_agent if entry.http_request else '',
                    'client_ip': entry.http_request.remote_ip if entry.http_request else '',
                    'request_size_bytes': entry.http_request.request_size if entry.http_request else 0,
                    'response_size_bytes': entry.http_request.response_size if entry.http_request else 0,
                    'cache_hit': entry.labels.get('cache_hit', 'false').lower() == 'true',
                    'trace_id': entry.trace or '',
                    'severity': entry.severity.name if entry.severity else 'INFO'
                }
                
                entries.append(log_data)
                
            except Exception as e:
                logger.warning(f"Error parsing log entry: {e}")
                continue
        
        logger.info(f"Extracted {len(entries)} log entries")
        return entries
    
    def transform_performance_data(self, raw_logs: List[Dict[str, Any]]) -> pd.DataFrame:
        """Transform raw logs into performance analytics format"""
        
        df = pd.DataFrame(raw_logs)
        
        if df.empty:
            logger.warning("No data to transform")
            return df
        
        # Data cleaning and transformation
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['response_time_ms'] = pd.to_numeric(df['response_time_ms'], errors='coerce').fillna(0)
        df['status_code'] = pd.to_numeric(df['status_code'], errors='coerce').fillna(0)
        df['request_size_bytes'] = pd.to_numeric(df['request_size_bytes'], errors='coerce').fillna(0)
        df['response_size_bytes'] = pd.to_numeric(df['response_size_bytes'], errors='coerce').fillna(0)
        
        # Extract region from IP (simplified)
        df['region'] = df['client_ip'].apply(self._extract_region)
        
        # Extract user info from user agent
        df['device_type'] = df['user_agent'].apply(self._extract_device_type)
        df['browser'] = df['user_agent'].apply(self._extract_browser)
        
        # Generate synthetic user and session IDs for demo
        df['user_id'] = df['client_ip'].apply(lambda x: f"user_{hash(x) % 10000}")
        df['session_id'] = df.apply(lambda row: f"session_{hash(row['client_ip'] + str(row['timestamp'].date())) % 100000}", axis=1)
        
        logger.info(f"Transformed {len(df)} records")
        return df
    
    def _extract_region(self, ip: str) -> str:
        """Extract region from IP address (simplified implementation)"""
        if not ip:
            return 'unknown'
        
        # Simplified region mapping based on IP ranges
        ip_parts = ip.split('.')
        if len(ip_parts) >= 2:
            first_octet = int(ip_parts[0]) if ip_parts[0].isdigit() else 0
            
            if 1 <= first_octet <= 126:
                return 'asia-southeast'
            elif 128 <= first_octet <= 191:
                return 'us-central'
            elif 192 <= first_octet <= 223:
                return 'europe-west'
            else:
                return 'global'
        
        return 'unknown'
    
    def _extract_device_type(self, user_agent: str) -> str:
        """Extract device type from user agent"""
        if not user_agent:
            return 'unknown'
        
        user_agent_lower = user_agent.lower()
        
        if 'mobile' in user_agent_lower or 'android' in user_agent_lower or 'iphone' in user_agent_lower:
            return 'mobile'
        elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
            return 'tablet'
        else:
            return 'desktop'
    
    def _extract_browser(self, user_agent: str) -> str:
        """Extract browser from user agent"""
        if not user_agent:
            return 'unknown'
        
        user_agent_lower = user_agent.lower()
        
        if 'chrome' in user_agent_lower:
            return 'chrome'
        elif 'firefox' in user_agent_lower:
            return 'firefox'
        elif 'safari' in user_agent_lower:
            return 'safari'
        elif 'edge' in user_agent_lower:
            return 'edge'
        else:
            return 'other'
    
    def load_to_bigquery(self, df: pd.DataFrame, table_name: str) -> None:
        """Load transformed data to BigQuery"""
        
        if df.empty:
            logger.warning(f"No data to load to {table_name}")
            return
        
        table_ref = self.bq_client.dataset(self.dataset_id).table(table_name)
        
        # Configure load job
        job_config = bigquery.LoadJobConfig(
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            schema_update_options=[bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION],
            time_partitioning=bigquery.TimePartitioning(
                type_=bigquery.TimePartitioningType.DAY,
                field="timestamp"
            )
        )
        
        # Load data
        job = self.bq_client.load_table_from_dataframe(
            df, table_ref, job_config=job_config
        )
        
        job.result()  # Wait for job completion
        
        logger.info(f"Loaded {len(df)} rows to {table_name}")
    
    def generate_synthetic_business_metrics(self) -> pd.DataFrame:
        """Generate synthetic business metrics for demo purposes"""
        
        current_time = datetime.utcnow()
        
        metrics_data = []
        
        # Generate various business metrics
        for i in range(24):  # Last 24 hours
            timestamp = current_time - timedelta(hours=i)
            
            # Revenue metrics
            metrics_data.append({
                'timestamp': timestamp,
                'metric_name': 'hourly_revenue',
                'metric_value': np.random.normal(5000, 1000),
                'metric_unit': 'USD',
                'dimensions': {
                    'region': np.random.choice(['asia-southeast', 'us-central', 'europe-west']),
                    'customer_segment': np.random.choice(['enterprise', 'sme', 'startup']),
                    'product_category': 'api_bridge',
                    'pricing_tier': np.random.choice(['basic', 'premium', 'enterprise'])
                },
                'tags': ['revenue', 'business'],
                'metadata': json.dumps({'source': 'billing_system', 'version': 'v4.1.0'})
            })
            
            # User acquisition metrics
            metrics_data.append({
                'timestamp': timestamp,
                'metric_name': 'new_users',
                'metric_value': np.random.poisson(50),
                'metric_unit': 'count',
                'dimensions': {
                    'region': np.random.choice(['asia-southeast', 'us-central', 'europe-west']),
                    'customer_segment': np.random.choice(['enterprise', 'sme', 'startup']),
                    'product_category': 'api_bridge',
                    'pricing_tier': 'trial'
                },
                'tags': ['acquisition', 'growth'],
                'metadata': json.dumps({'source': 'user_registration', 'campaign': 'q1_2025'})
            })
            
            # API usage metrics
            metrics_data.append({
                'timestamp': timestamp,
                'metric_name': 'api_calls_billable',
                'metric_value': np.random.normal(100000, 20000),
                'metric_unit': 'calls',
                'dimensions': {
                    'region': np.random.choice(['asia-southeast', 'us-central', 'europe-west']),
                    'customer_segment': np.random.choice(['enterprise', 'sme', 'startup']),
                    'product_category': 'api_bridge',
                    'pricing_tier': np.random.choice(['basic', 'premium', 'enterprise'])
                },
                'tags': ['usage', 'billing'],
                'metadata': json.dumps({'source': 'api_gateway', 'rate_limit_tier': 'standard'})
            })
        
        return pd.DataFrame(metrics_data)
    
    def run_etl_pipeline(self) -> Dict[str, Any]:
        """Run the complete ETL pipeline"""
        
        pipeline_start = datetime.utcnow()
        results = {
            'pipeline_start': pipeline_start.isoformat(),
            'tables_processed': [],
            'records_processed': 0,
            'errors': []
        }
        
        try:
            # Extract and load performance data
            logger.info("Starting performance data ETL...")
            raw_logs = self.extract_cloud_run_logs(hours_back=1)
            
            if raw_logs:
                performance_df = self.transform_performance_data(raw_logs)
                self.load_to_bigquery(performance_df, 'bridge_performance')
                
                results['tables_processed'].append('bridge_performance')
                results['records_processed'] += len(performance_df)
            
            # Generate and load business metrics
            logger.info("Generating synthetic business metrics...")
            business_metrics_df = self.generate_synthetic_business_metrics()
            self.load_to_bigquery(business_metrics_df, 'business_metrics')
            
            results['tables_processed'].append('business_metrics')
            results['records_processed'] += len(business_metrics_df)
            
            # Generate system resource metrics (synthetic for demo)
            logger.info("Generating system resource metrics...")
            system_metrics = self._generate_system_metrics()
            self.load_to_bigquery(system_metrics, 'system_resources')
            
            results['tables_processed'].append('system_resources')
            results['records_processed'] += len(system_metrics)
            
        except Exception as e:
            error_msg = f"ETL pipeline error: {str(e)}"
            logger.error(error_msg)
            results['errors'].append(error_msg)
        
        results['pipeline_end'] = datetime.utcnow().isoformat()
        results['duration_seconds'] = (datetime.utcnow() - pipeline_start).total_seconds()
        
        logger.info(f"ETL pipeline completed. Processed {results['records_processed']} records")
        return results
    
    def _generate_system_metrics(self) -> pd.DataFrame:
        """Generate synthetic system resource metrics"""
        
        current_time = datetime.utcnow()
        metrics_data = []
        
        # Generate metrics for multiple instances
        for instance_id in ['zantara-bridge-prod-1', 'zantara-bridge-prod-2', 'zantara-bridge-prod-3']:
            for i in range(60):  # Last 60 minutes
                timestamp = current_time - timedelta(minutes=i)
                
                metrics_data.append({
                    'timestamp': timestamp,
                    'instance_id': instance_id,
                    'cpu_usage_percent': np.random.normal(45, 15),
                    'memory_usage_bytes': int(np.random.normal(2 * 1024**3, 500 * 1024**2)),  # ~2GB
                    'memory_total_bytes': 4 * 1024**3,  # 4GB
                    'disk_usage_bytes': int(np.random.normal(10 * 1024**3, 1024**3)),  # ~10GB
                    'network_in_bytes': int(np.random.exponential(1024**2)),  # ~1MB
                    'network_out_bytes': int(np.random.exponential(2 * 1024**2)),  # ~2MB
                    'active_connections': np.random.poisson(100),
                    'queue_depth': np.random.poisson(5),
                    'cache_size_bytes': int(np.random.normal(512 * 1024**2, 100 * 1024**2)),  # ~512MB
                    'cache_hit_rate': np.random.beta(9, 1),  # High cache hit rate
                    'gc_collections_count': np.random.poisson(2),
                    'gc_time_ms': np.random.exponential(50)
                })
        
        return pd.DataFrame(metrics_data)

def main():
    """Main ETL execution function"""
    
    logger.info("Starting Zantara Bridge ETL Pipeline")
    
    etl = ZantaraBridgeETL()
    results = etl.run_etl_pipeline()
    
    logger.info("ETL Pipeline Results:")
    logger.info(json.dumps(results, indent=2))
    
    return results

if __name__ == "__main__":
    main()