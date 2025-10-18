#!/usr/bin/env python3
"""
ZANTARA Simple Test Suite - Quick validation for Custom GPT
Target: 95%+ accuracy, <500ms response
"""

import time
import json
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

API_URL = "https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app"
API_KEY = "zantara-internal-dev-key-2025"

def test_handler(test_name, handler, params={}, check_fields=[], max_time=500):
    """Test a single handler"""
    start = time.time()
    result = {'name': test_name, 'handler': handler, 'passed': False, 'time': 0}

    try:
        if handler == 'health':
            response = requests.get(f"{API_URL}/health", timeout=5)
        else:
            headers = {'Content-Type': 'application/json', 'x-api-key': API_KEY}
            payload = {'key': handler, 'params': params}
            response = requests.post(f"{API_URL}/call", json=payload, headers=headers, timeout=5)

        result['time'] = int((time.time() - start) * 1000)
        data = response.json()

        # Check response
        if handler == 'health':
            result['passed'] = data.get('status') == 'healthy'
        else:
            result['passed'] = data.get('ok', False)

        # Check required fields
        for field in check_fields:
            if field not in data.get('data', {}):
                result['passed'] = False
                result['error'] = f"Missing field: {field}"

        # Check response time
        if result['time'] > max_time:
            result['warning'] = f"Slow: {result['time']}ms > {max_time}ms"

    except Exception as e:
        result['error'] = str(e)[:50]
        result['time'] = int((time.time() - start) * 1000)

    return result

def run_test_suite():
    """Run complete test suite"""

    print("\n🧪 ZANTARA API TEST SUITE v5.2.0")
    print("=" * 60)

    # Define test cases
    tests = [
        # Critical System Tests
        ('Health Check', 'health', {}, [], 100),
        ('Contact Info', 'contact.info', {}, [], 200),

        # Business Handlers
        ('Identity Resolve', 'identity.resolve', {'identity_hint': 'zero@balizero.com'}, ['collaboratorId'], 300),
        ('Lead Save', 'lead.save', {'name': 'Test', 'email': 'test@test.com', 'service': 'visa'}, ['leadId'], 400),
        ('Quote Generate', 'quote.generate', {'service': 'visa'}, ['service', 'options'], 400),

        # Google Drive - CRITICAL fileName test
        ('Drive List', 'drive.list', {'pageSize': 5}, ['files'], 500),
        ('Drive Upload (fileName)', 'drive.upload', {
            'fileName': 'test.txt',  # CRITICAL: Must use fileName not name
            'mimeType': 'text/plain',
            'media': {'body': 'VGVzdA=='},
            'supportsAllDrives': True
        }, ['file'], 800),
        ('Drive Search', 'drive.search', {'query': 'test'}, ['files'], 600),

        # Memory System
        ('Memory Save', 'memory.save', {'key': f'test_{int(time.time())}', 'content': 'test'}, [], 400),
        ('Memory Search', 'memory.search', {'query': 'test'}, [], 500),
    ]

    # Run tests in parallel
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(test_handler, *test): test for test in tests}

        for future in as_completed(futures):
            result = future.result()
            results.append(result)

            # Print result immediately
            status = "✅" if result['passed'] else "❌"
            warning = f" ⚠️ {result.get('warning', '')}" if 'warning' in result else ""
            error = f" Error: {result.get('error', '')}" if 'error' in result else ""
            print(f"{status} {result['name']:<25} {result['time']:>4}ms{warning}{error}")

    # Calculate statistics
    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r['passed'])
    total = len(results)
    accuracy = (passed/total)*100 if total > 0 else 0
    avg_time = sum(r['time'] for r in results) // total if total > 0 else 0

    print(f"📊 RESULTS")
    print(f"   Passed:      {passed}/{total} ({accuracy:.0f}%)")
    print(f"   Avg Time:    {avg_time}ms")
    print(f"   Target:      95% accuracy, <500ms")

    # Performance by handler type
    print(f"\n📈 PERFORMANCE BY TYPE")
    handler_stats = {}
    for r in results:
        h_type = r['handler'].split('.')[0] if '.' in r['handler'] else 'system'
        if h_type not in handler_stats:
            handler_stats[h_type] = {'count': 0, 'time': 0, 'passed': 0}
        handler_stats[h_type]['count'] += 1
        handler_stats[h_type]['time'] += r['time']
        if r['passed']:
            handler_stats[h_type]['passed'] += 1

    for h_type, stats in sorted(handler_stats.items()):
        avg = stats['time'] // stats['count'] if stats['count'] > 0 else 0
        rate = (stats['passed']/stats['count'])*100 if stats['count'] > 0 else 0
        print(f"   {h_type:<15} {rate:>3.0f}% success, {avg:>4}ms avg")

    # Critical checks
    print(f"\n🎯 CRITICAL CHECKS")

    # Check drive.upload uses fileName correctly
    drive_upload_test = next((r for r in results if 'Drive Upload' in r['name']), None)
    if drive_upload_test:
        if drive_upload_test['passed']:
            print(f"   ✅ drive.upload: fileName parameter working")
        else:
            print(f"   ❌ drive.upload: FAILED - must fix fileName parameter")

    # Overall status
    print(f"\n{'='*60}")
    if accuracy >= 95 and avg_time < 500:
        print("✅ ALL TARGETS MET - System ready for production!")
    else:
        if accuracy < 95:
            print(f"⚠️ Accuracy {accuracy:.0f}% below 95% target")
        if avg_time > 500:
            print(f"⚠️ Response time {avg_time}ms above 500ms target")

    # Save report
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = f"test_report_{timestamp}.json"
    with open(report_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'summary': {
                'total': total,
                'passed': passed,
                'accuracy': accuracy,
                'avg_time': avg_time
            },
            'results': results,
            'handler_stats': handler_stats
        }, f, indent=2)
    print(f"\n📄 Report saved to {report_file}")

    return accuracy >= 95 and avg_time < 500

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "monitor":
        # Continuous monitoring
        print("🔄 Monitoring mode - Running tests every 5 minutes")
        print("Press Ctrl+C to stop\n")

        try:
            while True:
                success = run_test_suite()
                if not success:
                    print("\n🚨 ALERT: System not meeting targets!")
                print(f"\n⏰ Next test in 5 minutes...\n")
                time.sleep(300)
        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped")
    else:
        # Single run
        success = run_test_suite()
        sys.exit(0 if success else 1)