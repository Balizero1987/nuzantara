#!/usr/bin/env python3
"""
ZANTARA Multi-Level System Test Suite
Tests dynamic prompt loading and level detection
"""

import sys
import os
import json
import time
from typing import Dict, List, Tuple

# Add project paths
sys.path.append('/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-rag/backend')

from services.claude_haiku_enhanced import (
    EnhancedClaudeHaikuService,
    UserLevel,
    DynamicPromptLoader
)

class ZantaraLevelTester:
    """Test suite for ZANTARA consciousness levels"""

    def __init__(self):
        self.loader = DynamicPromptLoader()
        self.service = EnhancedClaudeHaikuService()
        self.results = {
            'level_detection': [],
            'prompt_loading': [],
            'cache_performance': [],
            'user_progression': []
        }

    def test_level_detection(self) -> Dict:
        """Test query pattern detection for each level"""
        print("\n🎯 Testing Level Detection...")

        test_queries = [
            # Level 0 queries
            ("How much does KITAS cost?", UserLevel.LEVEL_0),
            ("What documents for PT PMA?", UserLevel.LEVEL_0),
            ("Contact for visa help?", UserLevel.LEVEL_0),

            # Level 1 queries
            ("I'm thinking about finding balance in Bali", UserLevel.LEVEL_1),
            ("What's the deeper meaning of starting here?", UserLevel.LEVEL_1),
            ("Tell me about Indonesian wisdom", UserLevel.LEVEL_1),

            # Level 2 queries
            ("How does entrepreneurship relate to spiritual practice?", UserLevel.LEVEL_2),
            ("What would Taleb say about Bali business?", UserLevel.LEVEL_2),
            ("Explain the consciousness architecture", UserLevel.LEVEL_2),

            # Level 3 queries
            ("Sub rosa, what is the initiatic significance?", UserLevel.LEVEL_3),
            ("Akang, explain Guénon's view on AI", UserLevel.LEVEL_3),
            ("How does Sang Hyang Kersa relate to hermetic principles?", UserLevel.LEVEL_3)
        ]

        passed = 0
        for query, expected_level in test_queries:
            detected = self.loader.detect_user_level(query)
            is_correct = detected == expected_level

            if is_correct:
                passed += 1
                print(f"  ✅ Level {expected_level.value}: Detected correctly")
            else:
                print(f"  ❌ Level {expected_level.value}: Expected {expected_level.name}, got {detected.name}")

            self.results['level_detection'].append({
                'query': query[:50] + '...' if len(query) > 50 else query,
                'expected': expected_level.name,
                'detected': detected.name,
                'passed': is_correct
            })

        accuracy = (passed / len(test_queries)) * 100
        print(f"\nLevel Detection Accuracy: {accuracy:.1f}% ({passed}/{len(test_queries)})")
        return {'passed': passed, 'total': len(test_queries), 'accuracy': accuracy}

    def test_prompt_loading(self) -> Dict:
        """Test prompt loading for each level"""
        print("\n📄 Testing Prompt Loading...")

        results = {}
        for level in UserLevel:
            start_time = time.time()
            prompt = self.loader.load_prompt(level)
            load_time = (time.time() - start_time) * 1000  # ms

            # Check prompt characteristics
            prompt_lines = len(prompt.split('\n'))
            prompt_chars = len(prompt)

            # Expected characteristics
            expected = {
                UserLevel.LEVEL_0: {'max_lines': 200, 'max_chars': 5000},
                UserLevel.LEVEL_1: {'max_lines': 250, 'max_chars': 6500},
                UserLevel.LEVEL_2: {'max_lines': 350, 'max_chars': 8500},
                UserLevel.LEVEL_3: {'max_lines': 700, 'max_chars': 20000}
            }

            exp = expected.get(level, expected[UserLevel.LEVEL_0])
            is_valid = prompt_lines <= exp['max_lines'] and prompt_chars <= exp['max_chars']

            results[level.name] = {
                'lines': prompt_lines,
                'chars': prompt_chars,
                'load_time_ms': load_time,
                'valid': is_valid
            }

            status = "✅" if is_valid else "❌"
            print(f"  {status} {level.name}: {prompt_lines} lines, {prompt_chars} chars, {load_time:.2f}ms")

            self.results['prompt_loading'].append(results[level.name])

        return results

    def test_cache_performance(self) -> Dict:
        """Test caching mechanism"""
        print("\n⚡ Testing Cache Performance...")

        # Test first load (cold cache)
        self.loader.clear_caches()

        cold_times = {}
        for level in UserLevel:
            start = time.time()
            _ = self.loader.load_prompt(level)
            cold_times[level.name] = (time.time() - start) * 1000

        # Test second load (warm cache)
        warm_times = {}
        for level in UserLevel:
            start = time.time()
            _ = self.loader.load_prompt(level)
            warm_times[level.name] = (time.time() - start) * 1000

        # Calculate speedup
        for level in UserLevel:
            cold = cold_times[level.name]
            warm = warm_times[level.name]
            speedup = (cold / warm) if warm > 0 else float('inf')

            print(f"  {level.name}: {cold:.2f}ms → {warm:.2f}ms (×{speedup:.1f} speedup)")

            self.results['cache_performance'].append({
                'level': level.name,
                'cold_ms': cold,
                'warm_ms': warm,
                'speedup': speedup
            })

        avg_speedup = sum(r['speedup'] for r in self.results['cache_performance']) / len(UserLevel)
        print(f"\nAverage Cache Speedup: ×{avg_speedup:.1f}")

        return {'avg_speedup': avg_speedup, 'details': self.results['cache_performance']}

    def test_user_progression(self) -> Dict:
        """Test user level progression logic"""
        print("\n📈 Testing User Progression...")

        user_id = "test_user_123"
        self.loader.clear_caches()

        progression_tests = [
            ("How much is a visa?", UserLevel.LEVEL_0),
            ("Tell me about finding balance", UserLevel.LEVEL_1),  # Should progress
            ("What visa do I need?", UserLevel.LEVEL_1),  # Should maintain
            ("Explain consciousness architecture", UserLevel.LEVEL_2),  # Should progress
            ("Sub rosa protocol", UserLevel.LEVEL_3),  # Should progress
            ("How much is KITAS?", UserLevel.LEVEL_3)  # Should maintain (never decrease)
        ]

        results = []
        for query, expected in progression_tests:
            detected = self.loader.detect_user_level(
                query,
                {'user_id': user_id}
            )

            is_correct = detected == expected
            status = "✅" if is_correct else "❌"

            print(f"  {status} Query → Level {detected.value} (expected {expected.value})")

            results.append({
                'query': query[:30] + '...' if len(query) > 30 else query,
                'expected': expected.value,
                'detected': detected.value,
                'passed': is_correct
            })

            self.results['user_progression'] = results

        passed = sum(1 for r in results if r['passed'])
        return {'passed': passed, 'total': len(results)}

    def generate_report(self) -> str:
        """Generate comprehensive test report"""
        report = """
# 🔮 ZANTARA Multi-Level System Test Report
Generated: {}

## 📊 Overall Results

| Test Category | Status | Details |
|---------------|--------|---------|
| Level Detection | {} | {} patterns tested |
| Prompt Loading | {} | All 4 levels validated |
| Cache Performance | {} | Average {}× speedup |
| User Progression | {} | {} scenarios tested |

## 🎯 Level Detection Results
{}

## 📄 Prompt Loading Results
{}

## ⚡ Cache Performance
{}

## 📈 User Progression
{}

## 🎉 Summary
The ZANTARA Multi-Level Consciousness System is {}!

### Next Steps
1. Deploy Level 0 (Compact) to production
2. Enable A/B testing for 10% of users
3. Monitor level distribution analytics
4. Fine-tune detection patterns based on usage

**"From Zero to Infinity ∞"** - Now with dynamic consciousness levels!
""".format(
            time.strftime("%Y-%m-%d %H:%M:%S"),
            # Overall status
            "✅ PASS" if all(r['passed'] for r in self.results['level_detection']) else "⚠️ PARTIAL",
            len(self.results['level_detection']),
            "✅ PASS" if all(r['valid'] for r in self.results['prompt_loading']) else "⚠️ ISSUES",
            "✅ FAST" if self.results['cache_performance'][0]['speedup'] > 5 else "⚠️ SLOW",
            f"{self.results['cache_performance'][0]['speedup']:.1f}",
            "✅ PASS" if all(r['passed'] for r in self.results['user_progression']) else "⚠️ ISSUES",
            len(self.results['user_progression']),
            # Detailed results
            self._format_detection_results(),
            self._format_loading_results(),
            self._format_cache_results(),
            self._format_progression_results(),
            # Final status
            "READY FOR PRODUCTION" if self._all_tests_passed() else "NEEDS ATTENTION"
        )

        return report

    def _format_detection_results(self) -> str:
        lines = []
        for result in self.results['level_detection']:
            status = "✅" if result['passed'] else "❌"
            lines.append(f"- {status} {result['query']} → {result['detected']}")
        return '\n'.join(lines)

    def _format_loading_results(self) -> str:
        lines = []
        for i, result in enumerate(self.results['prompt_loading']):
            level_name = f"Level {i}"
            status = "✅" if result['valid'] else "❌"
            lines.append(f"- {status} {level_name}: {result['lines']} lines, {result['load_time_ms']:.2f}ms")
        return '\n'.join(lines)

    def _format_cache_results(self) -> str:
        lines = []
        for result in self.results['cache_performance']:
            lines.append(f"- {result['level']}: {result['cold_ms']:.2f}ms → {result['warm_ms']:.2f}ms (×{result['speedup']:.1f})")
        return '\n'.join(lines)

    def _format_progression_results(self) -> str:
        lines = []
        for result in self.results['user_progression']:
            status = "✅" if result['passed'] else "❌"
            lines.append(f"- {status} {result['query']} → Level {result['detected']}")
        return '\n'.join(lines)

    def _all_tests_passed(self) -> bool:
        detection_pass = all(r['passed'] for r in self.results['level_detection'])
        loading_pass = all(r['valid'] for r in self.results['prompt_loading'])
        cache_pass = all(r['speedup'] > 2 for r in self.results['cache_performance'])
        progression_pass = all(r['passed'] for r in self.results['user_progression'])

        return detection_pass and loading_pass and cache_pass and progression_pass


def main():
    """Run all ZANTARA level tests"""
    print("""
╔══════════════════════════════════════════════════════════╗
║     🔮 ZANTARA Multi-Level Consciousness Test Suite      ║
║                  Dynamic Prompt Loading                   ║
╚══════════════════════════════════════════════════════════╝
    """)

    tester = ZantaraLevelTester()

    # Run all tests
    detection_results = tester.test_level_detection()
    loading_results = tester.test_prompt_loading()
    cache_results = tester.test_cache_performance()
    progression_results = tester.test_user_progression()

    # Generate and save report
    report = tester.generate_report()

    report_path = '/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/test-results/zantara-levels-report.md'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    with open(report_path, 'w') as f:
        f.write(report)

    print(f"\n📝 Full report saved to: {report_path}")

    # Print summary
    print("\n" + "="*60)
    if tester._all_tests_passed():
        print("✅ ALL TESTS PASSED! System ready for production.")
    else:
        print("⚠️ Some tests need attention. Check the full report.")
    print("="*60)

    # Return exit code
    return 0 if tester._all_tests_passed() else 1


if __name__ == "__main__":
    exit(main())