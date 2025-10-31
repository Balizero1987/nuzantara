#!/usr/bin/env python3
"""
SSE Performance Audit Script
Comprehensive performance testing and monitoring for ZANTARA SSE streaming system

This script performs:
- Load testing with multiple concurrent connections
- Performance metrics collection
- Latency analysis
- Throughput measurement
- Error rate monitoring
- Memory usage tracking
- Connection stability testing

Author: ZANTARA Development Team
Date: 2025-01-27
"""

import asyncio
import aiohttp
import time
import json
import statistics
import argparse
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import psutil
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class SSEPerformanceMetrics:
    """Metrics for SSE performance testing"""
    start_time: float
    end_time: Optional[float] = None
    first_token_time: Optional[float] = None
    tokens_received: int = 0
    bytes_received: int = 0
    connection_time: float = 0
    errors: int = 0
    reconnections: int = 0
    status_code: Optional[int] = None
    
    @property
    def duration(self) -> float:
        return (self.end_time or time.time()) - self.start_time
    
    @property
    def tokens_per_second(self) -> float:
        return self.tokens_received / self.duration if self.duration > 0 else 0
    
    @property
    def time_to_first_token(self) -> float:
        return (self.first_token_time or self.start_time) - self.start_time
    
    @property
    def bytes_per_second(self) -> float:
        return self.bytes_received / self.duration if self.duration > 0 else 0


@dataclass
class LoadTestConfig:
    """Configuration for load testing"""
    base_url: str = "https://nuzantara-rag.fly.dev"
    endpoint: str = "/bali-zero/chat-stream"
    concurrent_connections: int = 10
    test_duration: int = 60  # seconds
    query: str = "Hello, please tell me about artificial intelligence and its applications in modern technology."
    user_email: Optional[str] = None
    conversation_history: Optional[List[Dict]] = None
    timeout: int = 30


class SSEPerformanceAuditor:
    """Comprehensive SSE performance auditor"""
    
    def __init__(self, config: LoadTestConfig):
        self.config = config
        self.metrics: List[SSEPerformanceMetrics] = []
        self.start_time = time.time()
        self.process = psutil.Process()
        
    async def single_sse_test(self, session: aiohttp.ClientSession, test_id: int) -> SSEPerformanceMetrics:
        """Perform a single SSE connection test"""
        metrics = SSEPerformanceMetrics(start_time=time.time())
        
        try:
            # Build URL
            url = f"{self.config.base_url}{self.config.config.endpoint}"
            params = {"query": self.config.query}
            
            if self.config.user_email:
                params["user_email"] = self.config.user_email
            
            if self.config.conversation_history:
                params["conversation_history"] = json.dumps(self.config.conversation_history)
            
            logger.info(f"🧪 [Test {test_id}] Starting SSE connection to {url}")
            
            # Start SSE connection
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=self.config.timeout)) as response:
                metrics.status_code = response.status
                
                if response.status != 200:
                    logger.error(f"❌ [Test {test_id}] HTTP {response.status}: {await response.text()}")
                    metrics.errors += 1
                    return metrics
                
                # Process SSE stream
                first_token_received = False
                async for line in response.content:
                    line_str = line.decode('utf-8').strip()
                    
                    if line_str.startswith('data: '):
                        try:
                            data = json.loads(line_str[6:])  # Remove 'data: ' prefix
                            
                            # Track first token
                            if data.get('text') and not first_token_received:
                                metrics.first_token_time = time.time()
                                first_token_received = True
                                logger.info(f"⚡ [Test {test_id}] First token received in {metrics.time_to_first_token:.3f}s")
                            
                            # Count tokens and bytes
                            if data.get('text'):
                                metrics.tokens_received += 1
                                metrics.bytes_received += len(line_str)
                            
                            # Check for completion
                            if data.get('done'):
                                metrics.end_time = time.time()
                                logger.info(f"✅ [Test {test_id}] Stream completed: {metrics.tokens_received} tokens, {metrics.tokens_per_second:.1f} tokens/s")
                                break
                            
                            # Check for errors
                            if data.get('error'):
                                logger.error(f"❌ [Test {test_id}] Stream error: {data['error']}")
                                metrics.errors += 1
                                break
                                
                        except json.JSONDecodeError as e:
                            logger.warning(f"⚠️ [Test {test_id}] JSON decode error: {e}")
                            metrics.errors += 1
                
                # If we get here without 'done', mark as completed
                if not metrics.end_time:
                    metrics.end_time = time.time()
                    
        except asyncio.TimeoutError:
            logger.error(f"⏰ [Test {test_id}] Connection timeout")
            metrics.errors += 1
            metrics.end_time = time.time()
            
        except Exception as e:
            logger.error(f"❌ [Test {test_id}] Connection error: {e}")
            metrics.errors += 1
            metrics.end_time = time.time()
        
        return metrics
    
    async def run_load_test(self) -> Dict[str, Any]:
        """Run comprehensive load test"""
        logger.info(f"🚀 Starting load test: {self.config.concurrent_connections} concurrent connections for {self.config.test_duration}s")
        
        # Create HTTP session with optimized settings
        connector = aiohttp.TCPConnector(
            limit=100,
            limit_per_host=50,
            ttl_dns_cache=300,
            use_dns_cache=True,
        )
        
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # Start concurrent connections
            tasks = []
            for i in range(self.config.concurrent_connections):
                task = asyncio.create_task(self.single_sse_test(session, i + 1))
                tasks.append(task)
            
            # Wait for all tasks to complete or timeout
            try:
                self.metrics = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=self.config.test_duration
                )
            except asyncio.TimeoutError:
                logger.warning("⏰ Load test timed out, cancelling remaining tasks")
                for task in tasks:
                    task.cancel()
                self.metrics = [m for m in self.metrics if isinstance(m, SSEPerformanceMetrics)]
        
        return self.analyze_results()
    
    def analyze_results(self) -> Dict[str, Any]:
        """Analyze test results and generate performance report"""
        if not self.metrics:
            return {"error": "No metrics collected"}
        
        # Filter out exceptions and failed tests
        valid_metrics = [m for m in self.metrics if isinstance(m, SSEPerformanceMetrics) and m.duration > 0]
        
        if not valid_metrics:
            return {"error": "No valid metrics collected"}
        
        # Calculate statistics
        durations = [m.duration for m in valid_metrics]
        tokens_per_second = [m.tokens_per_second for m in valid_metrics]
        time_to_first_token = [m.time_to_first_token for m in valid_metrics if m.first_token_time]
        bytes_per_second = [m.bytes_per_second for m in valid_metrics]
        
        total_tokens = sum(m.tokens_received for m in valid_metrics)
        total_bytes = sum(m.bytes_received for m in valid_metrics)
        total_errors = sum(m.errors for m in self.metrics if isinstance(m, SSEPerformanceMetrics))
        
        # System metrics
        memory_usage = self.process.memory_info().rss / 1024 / 1024  # MB
        cpu_usage = self.process.cpu_percent()
        
        analysis = {
            "test_summary": {
                "total_tests": len(self.metrics),
                "successful_tests": len(valid_metrics),
                "failed_tests": len(self.metrics) - len(valid_metrics),
                "success_rate": len(valid_metrics) / len(self.metrics) * 100,
                "total_tokens": total_tokens,
                "total_bytes": total_bytes,
                "total_errors": total_errors
            },
            "performance_metrics": {
                "duration": {
                    "mean": statistics.mean(durations),
                    "median": statistics.median(durations),
                    "min": min(durations),
                    "max": max(durations),
                    "std_dev": statistics.stdev(durations) if len(durations) > 1 else 0
                },
                "tokens_per_second": {
                    "mean": statistics.mean(tokens_per_second),
                    "median": statistics.median(tokens_per_second),
                    "min": min(tokens_per_second),
                    "max": max(tokens_per_second),
                    "std_dev": statistics.stdev(tokens_per_second) if len(tokens_per_second) > 1 else 0
                },
                "time_to_first_token": {
                    "mean": statistics.mean(time_to_first_token) if time_to_first_token else 0,
                    "median": statistics.median(time_to_first_token) if time_to_first_token else 0,
                    "min": min(time_to_first_token) if time_to_first_token else 0,
                    "max": max(time_to_first_token) if time_to_first_token else 0,
                    "std_dev": statistics.stdev(time_to_first_token) if len(time_to_first_token) > 1 else 0
                },
                "bytes_per_second": {
                    "mean": statistics.mean(bytes_per_second),
                    "median": statistics.median(bytes_per_second),
                    "min": min(bytes_per_second),
                    "max": max(bytes_per_second),
                    "std_dev": statistics.stdev(bytes_per_second) if len(bytes_per_second) > 1 else 0
                }
            },
            "system_metrics": {
                "memory_usage_mb": memory_usage,
                "cpu_usage_percent": cpu_usage,
                "test_duration": time.time() - self.start_time
            },
            "recommendations": self.generate_recommendations(valid_metrics)
        }
        
        return analysis
    
    def generate_recommendations(self, valid_metrics: List[SSEPerformanceMetrics]) -> List[str]:
        """Generate performance recommendations based on test results"""
        recommendations = []
        
        # Check time to first token
        avg_time_to_first_token = statistics.mean([m.time_to_first_token for m in valid_metrics if m.first_token_time])
        if avg_time_to_first_token > 2.0:
            recommendations.append("⚠️ High time to first token (>2s). Consider optimizing model loading or connection setup.")
        
        # Check tokens per second
        avg_tokens_per_second = statistics.mean([m.tokens_per_second for m in valid_metrics])
        if avg_tokens_per_second < 10:
            recommendations.append("⚠️ Low token throughput (<10 tokens/s). Consider using faster models or optimizing streaming.")
        
        # Check error rate
        error_rate = sum(m.errors for m in valid_metrics) / len(valid_metrics)
        if error_rate > 0.1:
            recommendations.append("❌ High error rate (>10%). Check server stability and connection handling.")
        
        # Check duration variance
        durations = [m.duration for m in valid_metrics]
        if len(durations) > 1:
            duration_cv = statistics.stdev(durations) / statistics.mean(durations)
            if duration_cv > 0.5:
                recommendations.append("⚠️ High duration variance. Consider load balancing or connection pooling.")
        
        # Check memory usage
        if self.process.memory_info().rss > 100 * 1024 * 1024:  # 100MB
            recommendations.append("⚠️ High memory usage. Consider optimizing memory management.")
        
        if not recommendations:
            recommendations.append("✅ Performance looks good! No major issues detected.")
        
        return recommendations
    
    def print_report(self, analysis: Dict[str, Any]):
        """Print formatted performance report"""
        print("\n" + "="*80)
        print("🚀 ZANTARA SSE PERFORMANCE AUDIT REPORT")
        print("="*80)
        print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Endpoint: {self.config.base_url}{self.config.endpoint}")
        print()
        
        # Test Summary
        summary = analysis["test_summary"]
        print("📊 TEST SUMMARY")
        print("-" * 40)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Successful: {summary['successful_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate']:.1f}%")
        print(f"Total Tokens: {summary['total_tokens']:,}")
        print(f"Total Bytes: {summary['total_bytes']:,}")
        print(f"Total Errors: {summary['total_errors']}")
        print()
        
        # Performance Metrics
        perf = analysis["performance_metrics"]
        print("⚡ PERFORMANCE METRICS")
        print("-" * 40)
        print(f"Duration (s): {perf['duration']['mean']:.2f} ± {perf['duration']['std_dev']:.2f}")
        print(f"Tokens/s: {perf['tokens_per_second']['mean']:.1f} ± {perf['tokens_per_second']['std_dev']:.1f}")
        print(f"Time to First Token (s): {perf['time_to_first_token']['mean']:.3f} ± {perf['time_to_first_token']['std_dev']:.3f}")
        print(f"Bytes/s: {perf['bytes_per_second']['mean']:.0f} ± {perf['bytes_per_second']['std_dev']:.0f}")
        print()
        
        # System Metrics
        sys_metrics = analysis["system_metrics"]
        print("💻 SYSTEM METRICS")
        print("-" * 40)
        print(f"Memory Usage: {sys_metrics['memory_usage_mb']:.1f} MB")
        print(f"CPU Usage: {sys_metrics['cpu_usage_percent']:.1f}%")
        print(f"Test Duration: {sys_metrics['test_duration']:.1f}s")
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS")
        print("-" * 40)
        for i, rec in enumerate(analysis["recommendations"], 1):
            print(f"{i}. {rec}")
        print()
        
        print("="*80)


async def main():
    """Main function to run SSE performance audit"""
    parser = argparse.ArgumentParser(description="SSE Performance Audit Tool")
    parser.add_argument("--url", default="https://nuzantara-rag.fly.dev", 
                       help="Base URL for the SSE endpoint")
    parser.add_argument("--connections", type=int, default=10, 
                       help="Number of concurrent connections")
    parser.add_argument("--duration", type=int, default=60, 
                       help="Test duration in seconds")
    parser.add_argument("--query", default="Hello, please tell me about artificial intelligence and its applications in modern technology.",
                       help="Test query to send")
    parser.add_argument("--output", help="Output file for JSON report")
    
    args = parser.parse_args()
    
    # Create test configuration
    config = LoadTestConfig(
        base_url=args.url,
        concurrent_connections=args.connections,
        test_duration=args.duration,
        query=args.query
    )
    
    # Run audit
    auditor = SSEPerformanceAuditor(config)
    analysis = await auditor.run_load_test()
    
    # Print report
    auditor.print_report(analysis)
    
    # Save JSON report if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(analysis, f, indent=2)
        print(f"📄 JSON report saved to: {args.output}")


if __name__ == "__main__":
    asyncio.run(main())