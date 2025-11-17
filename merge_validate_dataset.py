#!/usr/bin/env python3
"""
NUZANTARA Dataset Merger & Validator
Merges all Claude-generated JSONs and validates quality
"""

import json
import os
from typing import Dict, List
from datetime import datetime
import statistics

class DatasetMerger:
    def __init__(self, input_folder: str = "DATASET-GEMMA"):
        self.input_folder = input_folder
        self.all_conversations = []
        self.stats = {
            "total_conversations": 0,
            "by_style": {},
            "by_dialect": {},
            "quality_scores": [],
            "particle_density": [],
            "slang_density": []
        }

    def load_all_jsons(self):
        """Load all JSON files from Google Drive folder"""
        json_files = [
            "claude1_jakarta_casual.json",
            "claude2_jakarta_business.json",
            "claude3_jakarta_mixed.json",
            "claude4_jakarta_daily.json",
            # "claude5_jakarta_special.json",  # Missing
            "claude6_javanese.json",
            "claude7_sundanese.json",
            "claude8_balinese.json",
            "claude9_mixed_premium.json",
            "claude10_jakarta_youth.json",
            "claude11_jakarta_professional.json",
            "claude12_jakarta_authentic.json"
        ]

        for filename in json_files:
            filepath = os.path.join(self.input_folder, filename)
            if os.path.exists(filepath):
                print(f"Loading {filename}...")
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.process_file(data, filename)
            else:
                print(f"⚠️ Missing: {filename}")

    def process_file(self, data: Dict, filename: str):
        """Process each file and extract conversations"""
        dataset_id = data.get("dataset_id", "unknown")
        conversations = data.get("conversations", [])

        print(f"  Found {len(conversations)} conversations in {dataset_id}")

        for conv in conversations:
            # Add source metadata
            conv["source_file"] = filename
            conv["dataset_id"] = dataset_id

            # Collect stats
            if "quality_metrics" in conv:
                metrics = conv["quality_metrics"]
                self.stats["quality_scores"].append(
                    metrics.get("naturalness_score", 0)
                )
                self.stats["particle_density"].append(
                    metrics.get("particle_density", 0)
                )
                if "slang_density" in metrics:
                    self.stats["slang_density"].append(metrics["slang_density"])

            # Add to collection
            self.all_conversations.append(conv)

        self.stats["total_conversations"] += len(conversations)

    def validate_quality(self) -> Dict:
        """Validate dataset quality"""
        validation = {
            "total_conversations": len(self.all_conversations),
            "avg_naturalness": statistics.mean(self.stats["quality_scores"]) if self.stats["quality_scores"] else 0,
            "avg_particle_density": statistics.mean(self.stats["particle_density"]) if self.stats["particle_density"] else 0,
            "avg_slang_density": statistics.mean(self.stats["slang_density"]) if self.stats["slang_density"] else 0,
            "unique_ids": len(set(c["conversation_id"] for c in self.all_conversations)),
            "duplicates": 0,
            "quality_threshold_pass": 0
        }

        # Check for duplicates
        seen_ids = set()
        for conv in self.all_conversations:
            conv_id = conv["conversation_id"]
            if conv_id in seen_ids:
                validation["duplicates"] += 1
            seen_ids.add(conv_id)

        # Check quality threshold (7/10)
        for conv in self.all_conversations:
            if "quality_metrics" in conv:
                if conv["quality_metrics"].get("naturalness_score", 0) >= 7:
                    validation["quality_threshold_pass"] += 1

        validation["pass_rate"] = validation["quality_threshold_pass"] / len(self.all_conversations) * 100

        return validation

    def convert_to_training_format(self) -> List[Dict]:
        """Convert to Gemma2 fine-tuning format"""
        training_data = []

        for conv in self.all_conversations:
            # Extract messages
            messages = conv.get("messages", [])

            # Create training example
            if len(messages) >= 2:
                conversation_text = ""
                for msg in messages:
                    role = "User" if msg["speaker"] == "user" else "Assistant"
                    conversation_text += f"{role}: {msg['message']}\n"

                training_example = {
                    "text": conversation_text,
                    "metadata": {
                        "conversation_id": conv["conversation_id"],
                        "style": conv.get("style", "unknown"),
                        "source": conv.get("source_file", "unknown"),
                        "quality_score": conv.get("quality_metrics", {}).get("naturalness_score", 0)
                    }
                }
                training_data.append(training_example)

        return training_data

    def save_merged_dataset(self, output_file: str = "nuzantara_complete_dataset.json"):
        """Save merged dataset"""
        output = {
            "metadata": {
                "total_conversations": len(self.all_conversations),
                "generated_at": datetime.now().isoformat(),
                "version": "1.0"
            },
            "conversations": self.all_conversations
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved merged dataset: {output_file}")
        return output_file

    def save_training_format(self, output_file: str = "gemma2_training_data.jsonl"):
        """Save in JSONL format for training"""
        training_data = self.convert_to_training_format()

        with open(output_file, 'w', encoding='utf-8') as f:
            for item in training_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')

        print(f"✅ Saved training data: {output_file}")
        return output_file

    def generate_report(self) -> str:
        """Generate quality report"""
        validation = self.validate_quality()

        report = []
        report.append("=" * 60)
        report.append("📊 NUZANTARA DATASET MERGE REPORT")
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append("=" * 60)
        report.append("")
        report.append(f"Total Conversations: {validation['total_conversations']}")
        report.append(f"Unique IDs: {validation['unique_ids']}")
        report.append(f"Duplicates: {validation['duplicates']}")
        report.append("")
        report.append("QUALITY METRICS:")
        report.append(f"  Average Naturalness: {validation['avg_naturalness']:.1f}/10")
        report.append(f"  Average Particle Density: {validation['avg_particle_density']:.2f}")
        report.append(f"  Average Slang Density: {validation['avg_slang_density']:.2%}")
        report.append(f"  Quality Pass Rate: {validation['pass_rate']:.1f}%")
        report.append("")

        if validation['total_conversations'] < 24000:
            missing = 24000 - validation['total_conversations']
            report.append(f"⚠️ Missing {missing} conversations (target: 24,000)")
        else:
            report.append("✅ Target reached!")

        report.append("=" * 60)
        return "\n".join(report)

def main():
    print("🔄 NUZANTARA Dataset Merger & Validator")
    print("=" * 60)

    merger = DatasetMerger("DATASET-GEMMA")

    # Load all JSONs
    print("\n📁 Loading JSON files...")
    merger.load_all_jsons()

    # Validate
    print("\n✓ Validating quality...")
    validation = merger.validate_quality()

    # Save merged dataset
    print("\n💾 Saving merged dataset...")
    merger.save_merged_dataset()

    # Save training format
    print("\n🎯 Converting to training format...")
    merger.save_training_format()

    # Generate report
    print("\n📊 REPORT:")
    report = merger.generate_report()
    print(report)

    # Save report
    with open("dataset_merge_report.txt", 'w') as f:
        f.write(report)

if __name__ == "__main__":
    main()