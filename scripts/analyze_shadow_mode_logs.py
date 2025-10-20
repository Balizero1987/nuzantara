#!/usr/bin/env python3
"""
Shadow Mode Log Analyzer
Analyzes LLAMA vs Claude comparison logs from shadow mode testing

Usage:
    python analyze_shadow_mode_logs.py --date 2025-10-21
    python analyze_shadow_mode_logs.py --date-range 2025-10-15 2025-10-21
    python analyze_shadow_mode_logs.py --export-report ./reports/shadow_analysis.html
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict
from collections import defaultdict, Counter


class ShadowModeAnalyzer:
    """Analyze shadow mode comparison logs"""

    def __init__(self, log_dir: str = "./logs/shadow_mode"):
        self.log_dir = Path(log_dir)

    def load_logs(self, date: str) -> List[Dict]:
        """Load logs for a specific date"""
        log_file = self.log_dir / f"shadow_comparison_{date}.jsonl"

        if not log_file.exists():
            print(f"❌ No logs found for {date}")
            return []

        comparisons = []
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                comparisons.append(json.loads(line))

        return comparisons

    def load_date_range(self, start_date: str, end_date: str) -> List[Dict]:
        """Load logs for a date range"""
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        all_comparisons = []
        current = start

        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            comparisons = self.load_logs(date_str)
            all_comparisons.extend(comparisons)
            current += timedelta(days=1)

        return all_comparisons

    def analyze(self, comparisons: List[Dict]) -> Dict:
        """Full analysis of comparisons"""
        if not comparisons:
            return {"error": "No comparisons to analyze"}

        print(f"\n📊 Shadow Mode Analysis - {len(comparisons)} comparisons")
        print("="*70)

        # Overall metrics
        overall = self._analyze_overall(comparisons)
        self._print_overall(overall)

        # Performance by category
        by_category = self._analyze_by_category(comparisons)
        self._print_by_category(by_category)

        # Quality comparison
        quality = self._analyze_quality(comparisons)
        self._print_quality(quality)

        # Cost analysis
        cost = self._analyze_cost(comparisons)
        self._print_cost(cost)

        # Error analysis
        errors = self._analyze_errors(comparisons)
        self._print_errors(errors)

        return {
            "overall": overall,
            "by_category": by_category,
            "quality": quality,
            "cost": cost,
            "errors": errors
        }

    def _analyze_overall(self, comparisons: List[Dict]) -> Dict:
        """Overall performance metrics"""
        total = len(comparisons)
        llama_success = [c for c in comparisons if c['comparison']['llama_success']]
        llama_errors = total - len(llama_success)

        # Latency
        latencies = [c['llama']['latency_ms'] for c in llama_success]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        # Tokens
        claude_tokens = sum(c['claude']['tokens_output'] for c in comparisons)
        llama_tokens = sum(c['llama']['tokens_output'] for c in llama_success)

        return {
            "total": total,
            "llama_success": len(llama_success),
            "llama_errors": llama_errors,
            "success_rate": len(llama_success) / total if total > 0 else 0,
            "avg_latency_ms": avg_latency,
            "max_latency_ms": max(latencies) if latencies else 0,
            "min_latency_ms": min(latencies) if latencies else 0,
            "p95_latency_ms": sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0,
            "claude_total_tokens": claude_tokens,
            "llama_total_tokens": llama_tokens,
            "llama_avg_tokens": llama_tokens / len(llama_success) if llama_success else 0
        }

    def _analyze_by_category(self, comparisons: List[Dict]) -> Dict:
        """Performance by query category"""
        category_stats = defaultdict(lambda: {
            "count": 0,
            "llama_success": 0,
            "latencies": [],
            "claude_lengths": [],
            "llama_lengths": []
        })

        for c in comparisons:
            category = c.get("category", "unknown")
            stats = category_stats[category]

            stats["count"] += 1

            if c['comparison']['llama_success']:
                stats["llama_success"] += 1
                stats["latencies"].append(c['llama']['latency_ms'])
                stats["llama_lengths"].append(c['llama']['response_length'])

            stats["claude_lengths"].append(c['claude']['response_length'])

        # Calculate averages
        result = {}
        for category, stats in category_stats.items():
            result[category] = {
                "count": stats["count"],
                "success_rate": stats["llama_success"] / stats["count"] if stats["count"] > 0 else 0,
                "avg_latency": sum(stats["latencies"]) / len(stats["latencies"]) if stats["latencies"] else 0,
                "avg_claude_length": sum(stats["claude_lengths"]) / len(stats["claude_lengths"]) if stats["claude_lengths"] else 0,
                "avg_llama_length": sum(stats["llama_lengths"]) / len(stats["llama_lengths"]) if stats["llama_lengths"] else 0
            }

        return result

    def _analyze_quality(self, comparisons: List[Dict]) -> Dict:
        """Quality comparison metrics"""
        llama_success = [c for c in comparisons if c['comparison']['llama_success']]

        # Response length comparison
        length_ratios = [c['comparison']['length_ratio'] for c in llama_success]
        avg_length_ratio = sum(length_ratios) / len(length_ratios) if length_ratios else 0

        # Distribution of length ratios
        shorter = sum(1 for r in length_ratios if r < 0.9)  # LLAMA 10%+ shorter
        similar = sum(1 for r in length_ratios if 0.9 <= r <= 1.1)  # Within 10%
        longer = sum(1 for r in length_ratios if r > 1.1)  # LLAMA 10%+ longer

        return {
            "avg_length_ratio": avg_length_ratio,
            "llama_shorter": shorter,
            "llama_similar": similar,
            "llama_longer": longer,
            "similar_percentage": similar / len(llama_success) * 100 if llama_success else 0
        }

    def _analyze_cost(self, comparisons: List[Dict]) -> Dict:
        """Cost comparison"""
        # Claude pricing (varies by model)
        claude_cost = 0
        for c in comparisons:
            model = c['claude']['ai_used']
            tokens_in = c['claude']['tokens_input']
            tokens_out = c['claude']['tokens_output']

            if model == 'haiku':
                claude_cost += (tokens_in * 0.25 + tokens_out * 1.25) / 1_000_000
            elif model == 'sonnet':
                claude_cost += (tokens_in * 3.0 + tokens_out * 15.0) / 1_000_000

        # LLAMA cost (RunPod flat rate)
        # €3.78/month ≈ $4.20/month (approximate)
        # For this batch, extrapolate to monthly
        llama_cost_per_request = 4.20 / 100_000  # Assume 100k requests/month capacity
        llama_cost = len(comparisons) * llama_cost_per_request

        return {
            "claude_cost_usd": claude_cost,
            "llama_cost_usd": llama_cost,
            "cost_savings": claude_cost - llama_cost,
            "cost_ratio": llama_cost / claude_cost if claude_cost > 0 else 0,
            "savings_percentage": (1 - llama_cost / claude_cost) * 100 if claude_cost > 0 else 0
        }

    def _analyze_errors(self, comparisons: List[Dict]) -> Dict:
        """Error analysis"""
        errors = [c for c in comparisons if not c['comparison']['llama_success']]

        error_types = Counter(c['llama']['error'] for c in errors if c['llama'].get('error'))

        return {
            "total_errors": len(errors),
            "error_rate": len(errors) / len(comparisons) * 100 if comparisons else 0,
            "error_types": dict(error_types.most_common())
        }

    def _print_overall(self, overall: Dict):
        """Print overall metrics"""
        print(f"\n📈 Overall Performance:")
        print(f"   Total comparisons: {overall['total']}")
        print(f"   LLAMA success rate: {overall['success_rate']*100:.1f}%")
        print(f"   LLAMA errors: {overall['llama_errors']}")
        print(f"\n⏱️  Latency:")
        print(f"   Average: {overall['avg_latency_ms']:.0f}ms")
        print(f"   P95: {overall['p95_latency_ms']:.0f}ms")
        print(f"   Min/Max: {overall['min_latency_ms']:.0f}ms / {overall['max_latency_ms']:.0f}ms")
        print(f"\n🪙  Tokens:")
        print(f"   Claude total: {overall['claude_total_tokens']:,}")
        print(f"   LLAMA total: {overall['llama_total_tokens']:,}")
        print(f"   LLAMA avg per response: {overall['llama_avg_tokens']:.0f}")

    def _print_by_category(self, by_category: Dict):
        """Print category breakdown"""
        print(f"\n📂 Performance by Category:")
        for category, stats in sorted(by_category.items(), key=lambda x: x[1]['count'], reverse=True):
            print(f"\n   {category.upper()}:")
            print(f"      Count: {stats['count']}")
            print(f"      Success: {stats['success_rate']*100:.1f}%")
            print(f"      Avg latency: {stats['avg_latency']:.0f}ms")
            print(f"      Avg length: Claude {stats['avg_claude_length']:.0f} / LLAMA {stats['avg_llama_length']:.0f}")

    def _print_quality(self, quality: Dict):
        """Print quality metrics"""
        print(f"\n🎯 Quality Comparison (Response Length):")
        print(f"   LLAMA shorter: {quality['llama_shorter']} responses")
        print(f"   LLAMA similar: {quality['llama_similar']} responses ({quality['similar_percentage']:.1f}%)")
        print(f"   LLAMA longer: {quality['llama_longer']} responses")
        print(f"   Avg length ratio: {quality['avg_length_ratio']:.2f}x")

    def _print_cost(self, cost: Dict):
        """Print cost analysis"""
        print(f"\n💰 Cost Analysis:")
        print(f"   Claude cost: ${cost['claude_cost_usd']:.4f}")
        print(f"   LLAMA cost: ${cost['llama_cost_usd']:.4f}")
        print(f"   Savings: ${cost['cost_savings']:.4f} ({cost['savings_percentage']:.1f}%)")
        print(f"   Cost ratio: {cost['cost_ratio']:.2%} (LLAMA vs Claude)")

    def _print_errors(self, errors: Dict):
        """Print error analysis"""
        print(f"\n❌ Error Analysis:")
        print(f"   Total errors: {errors['total_errors']}")
        print(f"   Error rate: {errors['error_rate']:.1f}%")
        if errors['error_types']:
            print(f"   Error types:")
            for error_type, count in errors['error_types'].items():
                print(f"      - {error_type}: {count}")

    def generate_recommendation(self, analysis: Dict) -> str:
        """Generate recommendation based on analysis"""
        overall = analysis.get('overall', {})
        cost = analysis.get('cost', {})
        quality = analysis.get('quality', {})

        success_rate = overall.get('success_rate', 0)
        avg_latency = overall.get('avg_latency_ms', 0)
        cost_savings = cost.get('savings_percentage', 0)
        similar_quality = quality.get('similar_percentage', 0)

        # Decision logic
        if success_rate < 0.95:
            return "❌ NOT READY: Success rate too low (<95%). Fix errors before production."
        elif avg_latency > 1000:
            return "⚠️  CAUTION: High latency (>1s). Consider optimization before production."
        elif similar_quality < 70:
            return "⚠️  REVIEW NEEDED: Quality variation >30%. Manual review recommended."
        elif cost_savings > 50 and success_rate > 0.98:
            return f"✅ RECOMMEND ACTIVATION: High success ({success_rate*100:.1f}%), good cost savings ({cost_savings:.0f}%)"
        elif success_rate > 0.97:
            return f"✅ READY FOR GRADUAL ROLLOUT: Start with 10% traffic, monitor closely"
        else:
            return "🤔 MIXED RESULTS: Continue shadow testing, collect more data"


def main():
    parser = argparse.ArgumentParser(description='Analyze shadow mode logs')
    parser.add_argument('--date', help='Specific date (YYYY-MM-DD)')
    parser.add_argument('--date-range', nargs=2, metavar=('START', 'END'), help='Date range (YYYY-MM-DD)')
    parser.add_argument('--log-dir', default='./logs/shadow_mode', help='Log directory')
    parser.add_argument('--export-report', help='Export HTML report to file')

    args = parser.parse_args()

    analyzer = ShadowModeAnalyzer(log_dir=args.log_dir)

    # Load data
    if args.date:
        comparisons = analyzer.load_logs(args.date)
        date_label = args.date
    elif args.date_range:
        comparisons = analyzer.load_date_range(args.date_range[0], args.date_range[1])
        date_label = f"{args.date_range[0]} to {args.date_range[1]}"
    else:
        # Default: today
        today = datetime.now().strftime("%Y-%m-%d")
        comparisons = analyzer.load_logs(today)
        date_label = today

    if not comparisons:
        print(f"❌ No comparisons found for {date_label}")
        return

    print(f"📅 Analyzing shadow mode logs: {date_label}")

    # Analyze
    analysis = analyzer.analyze(comparisons)

    # Recommendation
    print(f"\n{'='*70}")
    recommendation = analyzer.generate_recommendation(analysis)
    print(f"🎯 RECOMMENDATION:\n   {recommendation}")
    print(f"{'='*70}\n")

    # Export report if requested
    if args.export_report:
        # TODO: Generate HTML report
        print(f"\n📄 HTML report export not yet implemented")


if __name__ == '__main__':
    main()
