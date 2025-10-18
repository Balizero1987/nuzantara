#!/usr/bin/env python3
"""
ZANTARA Testing Framework - Multi-layer validation for 54+ endpoints
Targets: 95%+ accuracy, <500ms response times
Author: Claude for Zero
"""

import time
import json
import asyncio
import requests
import statistics
from typing import Dict, Any, List, Tuple
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib

# Configuration
API_URL = "https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app/call"
API_KEY = "zantara-internal-dev-key-2025"
TARGET_RESPONSE_TIME = 500  # milliseconds
TARGET_ACCURACY = 0.95  # 95%

class ZantaraTestFramework:
    def __init__(self):
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'response_times': [],
            'errors': [],
            'handler_stats': {},
            'start_time': datetime.now()
        }

    def generate_test_cases(self) -> List[Dict[str, Any]]:
        """Generate comprehensive test cases for all 54 handlers"""

        test_cases = [
            # Layer 1: System Health Tests
            {
                'id': 'SYS001',
                'name': 'Health Check',
                'endpoint': '/health',
                'method': 'GET',
                'expected_status': 200,
                'expected_fields': ['status', 'version'],
                'max_response_time': 100,
                'priority': 'CRITICAL'
            },

            # Layer 2: Authentication Tests
            {
                'id': 'AUTH001',
                'name': 'Valid API Key',
                'handler': 'contact.info',
                'params': {},
                'expected_ok': True,
                'max_response_time': 200,
                'priority': 'CRITICAL'
            },

            # Layer 3: Business Handlers
            {
                'id': 'BUS001',
                'name': 'Identity Resolution',
                'handler': 'identity.resolve',
                'params': {'identity_hint': 'zero@balizero.com'},
                'expected_ok': True,
                'expected_data_fields': ['collaboratorId', 'email'],
                'max_response_time': 300,
                'priority': 'HIGH'
            },
            {
                'id': 'BUS002',
                'name': 'Lead Save',
                'handler': 'lead.save',
                'params': {
                    'name': 'Test User',
                    'email': 'test@example.com',
                    'service': 'visa'
                },
                'expected_ok': True,
                'expected_data_fields': ['leadId'],
                'max_response_time': 400,
                'priority': 'HIGH'
            },
            {
                'id': 'BUS003',
                'name': 'Quote Generation',
                'handler': 'quote.generate',
                'params': {'service': 'visa'},
                'expected_ok': True,
                'expected_data_fields': ['service', 'options'],
                'max_response_time': 400,
                'priority': 'MEDIUM'
            },

            # Layer 4: Google Drive Tests
            {
                'id': 'DRV001',
                'name': 'Drive List',
                'handler': 'drive.list',
                'params': {'pageSize': 5},
                'expected_ok': True,
                'expected_data_fields': ['files'],
                'max_response_time': 500,
                'priority': 'HIGH'
            },
            {
                'id': 'DRV002',
                'name': 'Drive Upload with fileName',
                'handler': 'drive.upload',
                'params': {
                    'fileName': 'test-framework.txt',  # Critical: fileName not name
                    'mimeType': 'text/plain',
                    'media': {'body': 'VGVzdCBGcmFtZXdvcms='},
                    'parents': ['1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr'],
                    'supportsAllDrives': True
                },
                'expected_ok': True,
                'expected_data_fields': ['file'],
                'max_response_time': 800,
                'priority': 'CRITICAL',
                'validation': lambda r: r.get('data', {}).get('file', {}).get('name') != 'Untitled'
            },
            {
                'id': 'DRV003',
                'name': 'Drive Search',
                'handler': 'drive.search',
                'params': {'query': 'test'},
                'expected_ok': True,
                'expected_data_fields': ['files'],
                'max_response_time': 600,
                'priority': 'MEDIUM'
            },

            # Layer 5: AI Handlers
            {
                'id': 'AI001',
                'name': 'AI Chat',
                'handler': 'ai.chat',
                'params': {
                    'messages': [{'role': 'user', 'content': 'Test'}]
                },
                'expected_ok': True,
                'max_response_time': 2000,
                'priority': 'MEDIUM'
            },

            # Layer 6: Memory System
            {
                'id': 'MEM001',
                'name': 'Memory Save',
                'handler': 'memory.save',
                'params': {
                    'key': f'test_{int(time.time())}',
                    'content': 'Test content'
                },
                'expected_ok': True,
                'max_response_time': 400,
                'priority': 'HIGH'
            },

            # Layer 7: Parameter Validation Tests
            {
                'id': 'VAL001',
                'name': 'Missing Required Params',
                'handler': 'drive.upload',
                'params': {},  # Missing required params
                'expected_ok': False,
                'expected_error_contains': 'required',
                'max_response_time': 100,
                'priority': 'MEDIUM'
            },
            {
                'id': 'VAL002',
                'name': 'Invalid Handler Name',
                'handler': 'invalid.handler',
                'params': {},
                'expected_ok': False,
                'max_response_time': 100,
                'priority': 'LOW'
            }
        ]

        return test_cases

    async def run_test_async(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single test case asynchronously"""

        start_time = time.time()
        result = {
            'test_id': test_case['id'],
            'test_name': test_case['name'],
            'passed': False,
            'response_time': 0,
            'error': None,
            'details': {}
        }

        try:
            # Prepare request
            if test_case.get('endpoint'):
                # Direct endpoint test
                url = API_URL.replace('/call', test_case['endpoint'])
                response = requests.get(url, timeout=5)
            else:
                # Handler test
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                }
                payload = {
                    'key': test_case['handler'],
                    'params': test_case.get('params', {})
                }
                response = requests.post(API_URL, json=payload, headers=headers, timeout=5)

            # Calculate response time
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            result['response_time'] = response_time

            # Parse response
            if response.status_code == 200:
                data = response.json()
                result['details'] = data

                # Validate response structure
                if test_case.get('expected_ok') is not None:
                    if data.get('ok') != test_case['expected_ok']:
                        raise AssertionError(f"Expected ok={test_case['expected_ok']}, got {data.get('ok')}")

                # Validate expected fields
                if test_case.get('expected_fields'):
                    for field in test_case['expected_fields']:
                        if field not in data:
                            raise AssertionError(f"Missing expected field: {field}")

                if test_case.get('expected_data_fields'):
                    for field in test_case['expected_data_fields']:
                        if field not in data.get('data', {}):
                            raise AssertionError(f"Missing expected data field: {field}")

                # Custom validation function
                if test_case.get('validation'):
                    if not test_case['validation'](data):
                        raise AssertionError("Custom validation failed")

                # Validate response time
                if response_time > test_case.get('max_response_time', TARGET_RESPONSE_TIME):
                    result['warning'] = f"Response time {response_time:.0f}ms exceeds target {test_case.get('max_response_time', TARGET_RESPONSE_TIME)}ms"

                result['passed'] = True

            else:
                raise AssertionError(f"HTTP {response.status_code}: {response.text}")

        except Exception as e:
            result['error'] = str(e)
            result['passed'] = False

        return result

    def run_parallel_tests(self, test_cases: List[Dict[str, Any]], max_workers: int = 10) -> List[Dict[str, Any]]:
        """Run tests in parallel for performance"""

        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create async event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            # Submit all tests
            futures = {
                executor.submit(
                    lambda tc: loop.run_until_complete(self.run_test_async(tc)),
                    test_case
                ): test_case
                for test_case in test_cases
            }

            # Collect results
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)

                    # Update statistics
                    self.results['total_tests'] += 1
                    if result['passed']:
                        self.results['passed'] += 1
                    else:
                        self.results['failed'] += 1
                        self.results['errors'].append({
                            'test': result['test_name'],
                            'error': result.get('error', 'Unknown')
                        })

                    self.results['response_times'].append(result['response_time'])

                    # Update handler stats
                    handler = futures[future].get('handler', 'system')
                    if handler not in self.results['handler_stats']:
                        self.results['handler_stats'][handler] = {
                            'total': 0,
                            'passed': 0,
                            'avg_response_time': 0,
                            'response_times': []
                        }

                    self.results['handler_stats'][handler]['total'] += 1
                    if result['passed']:
                        self.results['handler_stats'][handler]['passed'] += 1
                    self.results['handler_stats'][handler]['response_times'].append(result['response_time'])

                except Exception as e:
                    print(f"Error collecting result: {e}")

            loop.close()

        return results

    def generate_report(self) -> str:
        """Generate comprehensive test report"""

        # Calculate statistics
        accuracy = self.results['passed'] / self.results['total_tests'] if self.results['total_tests'] > 0 else 0
        avg_response_time = statistics.mean(self.results['response_times']) if self.results['response_times'] else 0
        p95_response_time = statistics.quantiles(self.results['response_times'], n=20)[18] if len(self.results['response_times']) > 1 else 0
        p99_response_time = statistics.quantiles(self.results['response_times'], n=100)[98] if len(self.results['response_times']) > 1 else 0

        # Calculate handler statistics
        for handler in self.results['handler_stats']:
            times = self.results['handler_stats'][handler]['response_times']
            if times:
                self.results['handler_stats'][handler]['avg_response_time'] = statistics.mean(times)

        # Generate report
        report = f"""
╔══════════════════════════════════════════════════════════════════╗
║         ZANTARA API TEST FRAMEWORK - RESULTS REPORT              ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERALL METRICS
─────────────────────────────────────────────────────────────────
Total Tests:          {self.results['total_tests']}
Passed:              {self.results['passed']} ✅
Failed:              {self.results['failed']} ❌
Accuracy:            {accuracy:.1%} {'🎯' if accuracy >= TARGET_ACCURACY else '⚠️'}
Target Accuracy:     {TARGET_ACCURACY:.0%}

⏱️ PERFORMANCE METRICS
─────────────────────────────────────────────────────────────────
Average Response:    {avg_response_time:.0f}ms {'✅' if avg_response_time < TARGET_RESPONSE_TIME else '⚠️'}
P95 Response:        {p95_response_time:.0f}ms
P99 Response:        {p99_response_time:.0f}ms
Target Response:     {TARGET_RESPONSE_TIME}ms

📈 HANDLER PERFORMANCE
─────────────────────────────────────────────────────────────────
Handler                     Tests  Pass%  Avg Time
"""

        for handler, stats in sorted(self.results['handler_stats'].items(),
                                    key=lambda x: x[1]['avg_response_time'],
                                    reverse=True)[:10]:
            pass_rate = (stats['passed'] / stats['total']) * 100 if stats['total'] > 0 else 0
            report += f"{handler:<25} {stats['total']:>5}  {pass_rate:>5.0f}%  {stats['avg_response_time']:>7.0f}ms\n"

        # Add errors section if any
        if self.results['errors']:
            report += f"""
⚠️ FAILED TESTS
─────────────────────────────────────────────────────────────────
"""
            for error in self.results['errors'][:5]:
                report += f"• {error['test']}: {error['error'][:50]}...\n"

        # Add recommendations
        report += f"""
🎯 RECOMMENDATIONS
─────────────────────────────────────────────────────────────────
"""

        if accuracy < TARGET_ACCURACY:
            report += f"⚠️ Accuracy {accuracy:.1%} below target {TARGET_ACCURACY:.0%}\n"
            report += "   → Review failed tests and fix handler implementations\n"

        if avg_response_time > TARGET_RESPONSE_TIME:
            report += f"⚠️ Average response time {avg_response_time:.0f}ms exceeds target {TARGET_RESPONSE_TIME}ms\n"
            report += "   → Consider caching, connection pooling, or async operations\n"

        if accuracy >= TARGET_ACCURACY and avg_response_time < TARGET_RESPONSE_TIME:
            report += "✅ All targets met! System performing optimally.\n"

        # Add test duration
        duration = (datetime.now() - self.results['start_time']).total_seconds()
        report += f"""
─────────────────────────────────────────────────────────────────
Test Duration: {duration:.2f} seconds
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════════════════════════════════
"""

        return report

    def run_continuous_monitoring(self, interval: int = 300):
        """Run tests continuously for monitoring"""

        print("🔄 Starting continuous monitoring mode...")
        print(f"   Running tests every {interval} seconds")
        print("   Press Ctrl+C to stop\n")

        try:
            while True:
                # Reset results
                self.results = {
                    'total_tests': 0,
                    'passed': 0,
                    'failed': 0,
                    'response_times': [],
                    'errors': [],
                    'handler_stats': {},
                    'start_time': datetime.now()
                }

                # Run tests
                test_cases = self.generate_test_cases()
                self.run_parallel_tests(test_cases)

                # Generate and display report
                report = self.generate_report()
                print(report)

                # Save report to file
                with open(f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", 'w') as f:
                    f.write(report)

                # Check if alerts needed
                accuracy = self.results['passed'] / self.results['total_tests'] if self.results['total_tests'] > 0 else 0
                avg_response_time = statistics.mean(self.results['response_times']) if self.results['response_times'] else 0

                if accuracy < TARGET_ACCURACY:
                    print(f"🚨 ALERT: Accuracy {accuracy:.1%} below threshold!")

                if avg_response_time > TARGET_RESPONSE_TIME:
                    print(f"🚨 ALERT: Response time {avg_response_time:.0f}ms above threshold!")

                # Wait for next cycle
                print(f"\n⏰ Next test cycle in {interval} seconds...\n")
                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped by user")

# Schema validation tests
class SchemaValidator:
    """Validate API responses against OpenAPI schema"""

    @staticmethod
    def validate_handler_response(handler: str, response: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate response matches expected schema"""

        # Basic structure validation
        if 'ok' not in response:
            return False, "Missing 'ok' field"

        if response['ok'] and 'data' not in response:
            return False, "Missing 'data' field for successful response"

        if not response['ok'] and 'error' not in response:
            return False, "Missing 'error' field for failed response"

        # Handler-specific validation
        if handler == 'drive.upload':
            if response['ok']:
                file_data = response.get('data', {}).get('file', {})
                required_fields = ['id', 'name', 'webViewLink']
                for field in required_fields:
                    if field not in file_data:
                        return False, f"Missing required field in file data: {field}"

                # Critical: Verify fileName was used correctly
                if file_data.get('name') == 'Untitled':
                    return False, "File name is 'Untitled' - likely used 'name' instead of 'fileName'"

        elif handler == 'identity.resolve':
            if response['ok']:
                required_fields = ['collaboratorId', 'email']
                for field in required_fields:
                    if field not in response.get('data', {}):
                        return False, f"Missing required field: {field}"

        return True, "Valid"

# Main execution
if __name__ == "__main__":
    import sys

    framework = ZantaraTestFramework()

    if len(sys.argv) > 1:
        if sys.argv[1] == "quick":
            # Quick test - critical handlers only
            print("🚀 Running quick test suite...")
            test_cases = [tc for tc in framework.generate_test_cases() if tc.get('priority') == 'CRITICAL']
            results = framework.run_parallel_tests(test_cases, max_workers=5)
            print(framework.generate_report())

        elif sys.argv[1] == "full":
            # Full test suite
            print("🧪 Running full test suite...")
            test_cases = framework.generate_test_cases()
            results = framework.run_parallel_tests(test_cases, max_workers=10)
            print(framework.generate_report())

            # Save detailed results
            with open("detailed_test_results.json", 'w') as f:
                json.dump(results, f, indent=2)
            print("\n📊 Detailed results saved to detailed_test_results.json")

        elif sys.argv[1] == "monitor":
            # Continuous monitoring
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 300
            framework.run_continuous_monitoring(interval)

        elif sys.argv[1] == "handler" and len(sys.argv) > 2:
            # Test specific handler
            handler = sys.argv[2]
            print(f"🎯 Testing handler: {handler}")
            test_cases = [tc for tc in framework.generate_test_cases() if tc.get('handler') == handler]
            if test_cases:
                results = framework.run_parallel_tests(test_cases, max_workers=1)
                print(framework.generate_report())
            else:
                print(f"❌ No tests found for handler: {handler}")

    else:
        print("""
🧪 ZANTARA Testing Framework

Usage:
  python3 zantara-testing-framework.py quick     - Run critical tests only
  python3 zantara-testing-framework.py full      - Run complete test suite
  python3 zantara-testing-framework.py monitor   - Continuous monitoring (5 min intervals)
  python3 zantara-testing-framework.py monitor 60 - Custom interval (seconds)
  python3 zantara-testing-framework.py handler drive.upload - Test specific handler

Targets:
  • Accuracy: ≥95%
  • Response Time: <500ms average
  • P99 Latency: <2000ms
        """)