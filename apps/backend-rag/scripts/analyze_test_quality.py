#!/usr/bin/env python3
"""
Analyze Test Conversation Quality

Analyzes all generated test conversations and produces a comprehensive quality report.

Run:
    python analyze_test_quality.py

Outputs:
    - test_conversations/quality_analysis_report.txt
    - test_conversations/quality_analysis_detailed.json
    - Console output with recommendations
"""

import logging
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'modules'))

from conversation_quality_analyzer import ConversationQualityAnalyzer

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def analyze_all_conversations():
    """Analyze all test conversations and generate report"""

    test_dir = Path("test_conversations")

    if not test_dir.exists():
        logger.error(f"❌ Test conversations directory not found: {test_dir}")
        logger.error("Run generate_test_conversations.py first")
        return

    # Find all conversation JSON files
    conversation_files = sorted(test_dir.glob("conversation_*.json"))

    if not conversation_files:
        logger.error(f"❌ No conversation files found in {test_dir}")
        return

    logger.info("🔍 ANALYZING TEST CONVERSATIONS")
    logger.info("=" * 80)
    logger.info(f"Conversations found: {len(conversation_files)}")
    logger.info("=" * 80)

    analyzer = ConversationQualityAnalyzer()
    all_analyses = []
    total_quality_score = 0

    for i, conv_file in enumerate(conversation_files, 1):
        logger.info(f"\n[{i}/{len(conversation_files)}] Analyzing {conv_file.name}")

        try:
            # Load conversation
            with open(conv_file, 'r', encoding='utf-8') as f:
                conversation = json.load(f)

            # Analyze
            analysis = analyzer.analyze_conversation(conversation)

            # Store results
            all_analyses.append({
                "file": conv_file.name,
                "analysis": analysis
            })

            quality_score = analysis.get('quality_score', 0)
            total_quality_score += quality_score

            logger.info(f"   Quality Score: {quality_score}/100")
            logger.info(f"   Messages: {analysis.get('message_count', 0)}")

            # Quick metrics
            metrics = analysis.get('metrics', {})
            particles = metrics.get('particles', {})
            slang = metrics.get('slang', {})

            logger.info(f"   Particles: {particles.get('coverage_percentage', 0)}%")
            logger.info(f"   Slang: {slang.get('density_percentage', 0)}%")

        except Exception as e:
            logger.error(f"   ❌ Analysis failed: {e}")
            all_analyses.append({
                "file": conv_file.name,
                "error": str(e)
            })

    # Calculate aggregate statistics
    valid_analyses = [a for a in all_analyses if "analysis" in a]
    avg_quality = total_quality_score / len(valid_analyses) if valid_analyses else 0

    # Aggregate metrics
    aggregate_metrics = {
        "total_conversations": len(conversation_files),
        "successfully_analyzed": len(valid_analyses),
        "failed_analyses": len(all_analyses) - len(valid_analyses),
        "average_quality_score": round(avg_quality, 2),
        "quality_distribution": {
            "excellent (80+)": sum(1 for a in valid_analyses if a["analysis"].get("quality_score", 0) >= 80),
            "good (70-79)": sum(1 for a in valid_analyses if 70 <= a["analysis"].get("quality_score", 0) < 80),
            "acceptable (60-69)": sum(1 for a in valid_analyses if 60 <= a["analysis"].get("quality_score", 0) < 70),
            "below_threshold (<60)": sum(1 for a in valid_analyses if a["analysis"].get("quality_score", 0) < 60)
        }
    }

    # Calculate average metrics
    if valid_analyses:
        total_particle_coverage = sum(
            a["analysis"]["metrics"]["particles"].get("coverage_percentage", 0)
            for a in valid_analyses
        )
        total_slang_density = sum(
            a["analysis"]["metrics"]["slang"].get("density_percentage", 0)
            for a in valid_analyses
        )
        total_emotions = sum(
            a["analysis"]["metrics"]["emotions"].get("unique_emotions_count", 0)
            for a in valid_analyses
        )

        aggregate_metrics["average_particle_coverage"] = round(total_particle_coverage / len(valid_analyses), 2)
        aggregate_metrics["average_slang_density"] = round(total_slang_density / len(valid_analyses), 2)
        aggregate_metrics["average_emotion_variety"] = round(total_emotions / len(valid_analyses), 2)

    # Save detailed analysis
    detailed_output = {
        "generated_at": datetime.now().isoformat(),
        "aggregate_metrics": aggregate_metrics,
        "individual_analyses": all_analyses
    }

    detailed_file = test_dir / "quality_analysis_detailed.json"
    with open(detailed_file, 'w', encoding='utf-8') as f:
        json.dump(detailed_output, f, indent=2, ensure_ascii=False)

    # Generate text report
    report_file = test_dir / "quality_analysis_report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("INDONESIAN CONVERSATION DATASET - QUALITY ANALYSIS REPORT\n")
        f.write("=" * 80 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Conversations Analyzed: {len(valid_analyses)}/{len(conversation_files)}\n")
        f.write("\n" + "-" * 80 + "\n")
        f.write("AGGREGATE METRICS\n")
        f.write("-" * 80 + "\n")
        f.write(f"Average Quality Score: {aggregate_metrics['average_quality_score']}/100\n")
        f.write(f"Average Particle Coverage: {aggregate_metrics.get('average_particle_coverage', 0)}%\n")
        f.write(f"Average Slang Density: {aggregate_metrics.get('average_slang_density', 0)}%\n")
        f.write(f"Average Emotion Variety: {aggregate_metrics.get('average_emotion_variety', 0)} emotions\n")
        f.write("\n" + "-" * 80 + "\n")
        f.write("QUALITY DISTRIBUTION\n")
        f.write("-" * 80 + "\n")
        for category, count in aggregate_metrics["quality_distribution"].items():
            f.write(f"{category}: {count}\n")

        f.write("\n" + "-" * 80 + "\n")
        f.write("INDIVIDUAL CONVERSATION ANALYSES\n")
        f.write("-" * 80 + "\n")

        for item in all_analyses:
            if "analysis" in item:
                analysis = item["analysis"]
                f.write(f"\n{item['file']}:\n")
                f.write(f"  Quality Score: {analysis.get('quality_score', 0)}/100\n")
                f.write(f"  Messages: {analysis.get('message_count', 0)}\n")

                # Write recommendations
                f.write("\n  Recommendations:\n")
                for rec in analysis.get('recommendations', []):
                    f.write(f"  {rec}\n")
            else:
                f.write(f"\n{item['file']}: ❌ FAILED - {item.get('error', 'Unknown error')}\n")

        # Overall recommendations
        f.write("\n" + "=" * 80 + "\n")
        f.write("OVERALL RECOMMENDATIONS\n")
        f.write("=" * 80 + "\n")

        if avg_quality >= 75:
            f.write("\n✅ EXCELLENT QUALITY - Ready for full 20K generation\n")
            f.write("\nThe test conversations show high naturalness and authenticity.\n")
            f.write("Proceed with confidence to full dataset generation.\n")
        elif avg_quality >= 70:
            f.write("\n✅ GOOD QUALITY - Minor adjustments recommended\n")
            f.write("\nThe test conversations are good but could be improved.\n")
            f.write("Consider:\n")
            if aggregate_metrics.get('average_particle_coverage', 0) < 40:
                f.write("- Increase particle usage (dong, sih, deh) to 50%+ of messages\n")
            if aggregate_metrics.get('average_slang_density', 0) < 10:
                f.write("- Increase Jakarta slang density to 10-15%\n")
            f.write("\nYou may proceed to full generation with minor tweaks.\n")
        elif avg_quality >= 60:
            f.write("\n⚠️ ACCEPTABLE QUALITY - Improvements needed\n")
            f.write("\nThe conversations are acceptable but need work before full generation.\n")
            f.write("\nKey issues to address:\n")
            if aggregate_metrics.get('average_particle_coverage', 0) < 30:
                f.write("- LOW PARTICLE USAGE: Add more particles (dong, sih, deh, kok)\n")
            if aggregate_metrics.get('average_slang_density', 0) < 8:
                f.write("- LOW SLANG: Increase Jakarta millennial slang (gue/lu, banget, etc.)\n")
            if aggregate_metrics.get('average_emotion_variety', 0) < 3:
                f.write("- LIMITED EMOTIONS: Add more emotional variety\n")
            f.write("\nRefine prompts and regenerate tests before proceeding.\n")
        else:
            f.write("\n❌ BELOW THRESHOLD - Major revisions required\n")
            f.write("\nThe conversations do not meet quality standards for Jakarta millennial authenticity.\n")
            f.write("\nCritical issues:\n")
            f.write("- Review prompt template for naturalness instructions\n")
            f.write("- Ensure particles and slang are emphasized\n")
            f.write("- Add more examples of authentic Jakarta speech\n")
            f.write("\nDo NOT proceed to full generation until quality improves to 70+.\n")

    # Print summary to console
    print("\n" + "=" * 80)
    print("QUALITY ANALYSIS COMPLETE")
    print("=" * 80)
    print(f"Conversations Analyzed: {len(valid_analyses)}/{len(conversation_files)}")
    print(f"Average Quality Score: {aggregate_metrics['average_quality_score']}/100")
    print(f"\nQuality Distribution:")
    for category, count in aggregate_metrics["quality_distribution"].items():
        print(f"  {category}: {count}")

    print(f"\n📊 Detailed analysis saved to: {detailed_file.absolute()}")
    print(f"📝 Report saved to: {report_file.absolute()}")

    print("\n" + "-" * 80)
    print("KEY METRICS:")
    print(f"  Average Particle Coverage: {aggregate_metrics.get('average_particle_coverage', 0)}% (target: 40-60%)")
    print(f"  Average Slang Density: {aggregate_metrics.get('average_slang_density', 0)}% (target: 10-15%)")
    print(f"  Average Emotion Variety: {aggregate_metrics.get('average_emotion_variety', 0)} (target: 4-5)")

    print("\n" + "-" * 80)
    if avg_quality >= 70:
        print("✅ RECOMMENDATION: Quality is good. Proceed to full 20K generation.")
    else:
        print("⚠️ RECOMMENDATION: Quality needs improvement. Refine prompts and regenerate tests.")

    print("=" * 80)


if __name__ == "__main__":
    analyze_all_conversations()
