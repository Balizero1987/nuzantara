#!/usr/bin/env python3
"""
AGENTE 3: Report Generator
Genera report dettagliati sull'avanzamento dei test
"""

import json
import os
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path("/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY")
REPORT_DIR = Path("/tmp/cursor_automation/reports")
REPORT_DIR.mkdir(parents=True, exist_ok=True)

def count_handlers(module_path):
    """Count handler files in a module"""
    if not module_path.exists():
        return 0

    handlers = list(module_path.glob("*.ts"))
    # Exclude index.ts, registry.ts, and test files
    handlers = [h for h in handlers if h.name not in ['index.ts', 'registry.ts'] and not h.name.endswith('.test.ts')]
    return len(handlers)

def count_tests(module_path):
    """Count test files in a module"""
    test_dir = module_path / "__tests__"
    if not test_dir.exists():
        return 0

    return len(list(test_dir.glob("*.test.ts")))

def generate_detailed_report():
    """Generate detailed test coverage report"""
    print("📊 AGENTE 3: Generating detailed report...")

    handlers_dir = PROJECT_ROOT / "src" / "handlers"

    modules = {}
    total_handlers = 0
    total_tests = 0

    # Analyze each module
    for module_path in sorted(handlers_dir.iterdir()):
        if not module_path.is_dir():
            continue

        module_name = module_path.name
        handler_count = count_handlers(module_path)
        test_count = count_tests(module_path)

        if handler_count > 0:
            coverage_pct = (test_count / handler_count) * 100

            modules[module_name] = {
                "handlers": handler_count,
                "tests": test_count,
                "coverage": round(coverage_pct, 2),
                "status": "✅" if coverage_pct >= 80 else "⚠️" if coverage_pct >= 50 else "❌"
            }

            total_handlers += handler_count
            total_tests += test_count

    overall_coverage = (total_tests / total_handlers * 100) if total_handlers > 0 else 0

    # Generate JSON report
    report_data = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "summary": {
            "total_handlers": total_handlers,
            "total_tests": total_tests,
            "coverage_percentage": round(overall_coverage, 2),
            "target": 80.0
        },
        "modules": modules
    }

    report_file = REPORT_DIR / "detailed_coverage_report.json"
    with open(report_file, 'w') as f:
        json.dump(report_data, f, indent=2)

    print(f"✅ Report saved: {report_file}")

    # Generate markdown report
    md_report = REPORT_DIR / "detailed_coverage_report.md"
    with open(md_report, 'w') as f:
        f.write("# Test Coverage Report\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Summary\n\n")
        f.write(f"- **Total Handlers**: {total_handlers}\n")
        f.write(f"- **Total Tests**: {total_tests}\n")
        f.write(f"- **Overall Coverage**: {overall_coverage:.2f}%\n")
        f.write(f"- **Target**: 80%\n\n")

        status_emoji = "✅" if overall_coverage >= 80 else "⚠️" if overall_coverage >= 50 else "❌"
        f.write(f"**Status**: {status_emoji}\n\n")

        f.write("## Module Breakdown\n\n")
        f.write("| Module | Handlers | Tests | Coverage | Status |\n")
        f.write("|--------|----------|-------|----------|--------|\n")

        for module_name in sorted(modules.keys()):
            data = modules[module_name]
            f.write(f"| {module_name} | {data['handlers']} | {data['tests']} | {data['coverage']:.1f}% | {data['status']} |\n")

        f.write("\n## Priority Actions\n\n")

        # Find modules needing attention
        low_coverage = [name for name, data in modules.items() if data['coverage'] < 80]
        if low_coverage:
            f.write("### Modules Below 80% Coverage\n\n")
            for module_name in low_coverage:
                data = modules[module_name]
                f.write(f"- **{module_name}**: {data['coverage']:.1f}% ({data['tests']}/{data['handlers']} tests)\n")
        else:
            f.write("✅ All modules have ≥80% coverage!\n")

    print(f"✅ Markdown report saved: {md_report}")

    # Print summary to console
    print("\n" + "="*60)
    print("📊 COVERAGE SUMMARY")
    print("="*60)
    print(f"Overall: {total_tests}/{total_handlers} handlers tested ({overall_coverage:.1f}%)")
    print("\nBy Module:")
    for module_name in sorted(modules.keys()):
        data = modules[module_name]
        print(f"  {data['status']} {module_name:25} {data['tests']:2}/{data['handlers']:2} ({data['coverage']:5.1f}%)")
    print("="*60)

if __name__ == "__main__":
    generate_detailed_report()
