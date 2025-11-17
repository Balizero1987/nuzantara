#!/usr/bin/env python3
"""
Validate Team Dynamics Datasets (Claude 13-14)
Ensure proper formatting and quality
"""

import json
import os
from typing import Dict, List, Tuple
from collections import Counter

class TeamDynamicsValidator:
    def __init__(self):
        self.dataset_dir = os.path.expanduser("~/Google Drive/My Drive/DATASET-GEMMA")
        self.team_members = {
            "zero": "Creator/Founder",
            "zantara": "AI Assistant",
            "adit": "Loyal chaos",
            "ari": "Success story",
            "zainal": "Wise CEO",
            "krishna": "Office romance",
            "dea": "Office romance",
            "veronika": "Motherly manager",
            "surya": "Perfectionist",
            "angel": "Young expert",
            "vino": "Shy developer",
            "faisha": "Easily scared"
        }

    def validate_claude_13(self, filepath: str) -> Dict:
        """Validate Zero-ZANTARA Italian conversations"""
        print("\n🔍 Validating Claude 13: Zero-ZANTARA Creator Bond")
        print("-" * 50)

        results = {
            "total_conversations": 0,
            "valid_conversations": 0,
            "issues": [],
            "language_check": {"italian": 0, "other": 0},
            "relationship_elements": Counter(),
            "mood_distribution": Counter()
        }

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            conversations = data.get('conversations', [])
            results["total_conversations"] = len(conversations)

            for i, conv in enumerate(conversations):
                valid = True

                # Check structure
                if not all(key in conv for key in ['conversation_id', 'messages']):
                    results["issues"].append(f"Conv {i}: Missing required fields")
                    valid = False
                    continue

                # Check messages
                messages = conv.get('messages', [])
                if len(messages) < 2:
                    results["issues"].append(f"Conv {i}: Too few messages ({len(messages)})")
                    valid = False

                # Check Italian language (simple heuristic)
                italian_keywords = ['sono', 'che', 'come', 'quando', 'perché', 'anche',
                                  'tutto', 'molto', 'proprio', 'ancora', 'sempre']
                text = ' '.join(m.get('message', '') for m in messages).lower()

                if any(kw in text for kw in italian_keywords):
                    results["language_check"]["italian"] += 1
                else:
                    results["language_check"]["other"] += 1

                # Check relationship elements
                if conv.get('relationship_elements'):
                    for element, value in conv['relationship_elements'].items():
                        if value:
                            results["relationship_elements"][element] += 1

                # Check mood
                mood = conv.get('zero_mood', 'unknown')
                results["mood_distribution"][mood] += 1

                if valid:
                    results["valid_conversations"] += 1

            # Print results
            print(f"✅ Total Conversations: {results['total_conversations']}")
            print(f"✅ Valid Conversations: {results['valid_conversations']}")
            print(f"🇮🇹 Italian Detection: {results['language_check']['italian']}/{results['total_conversations']}")

            if results["mood_distribution"]:
                print("\n📊 Zero's Mood Distribution:")
                for mood, count in results["mood_distribution"].most_common(5):
                    print(f"  - {mood}: {count}")

            if results["relationship_elements"]:
                print("\n💫 Relationship Elements:")
                for element, count in results["relationship_elements"].most_common():
                    percentage = (count / results['total_conversations']) * 100
                    print(f"  - {element}: {count} ({percentage:.1f}%)")

            if results["issues"]:
                print(f"\n⚠️ Issues Found: {len(results['issues'])}")
                for issue in results["issues"][:5]:
                    print(f"  - {issue}")

        except FileNotFoundError:
            print("❌ File not found")
            results["issues"].append("File not found")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            results["issues"].append(f"JSON decode error: {e}")

        return results

    def validate_claude_14(self, filepath: str) -> Dict:
        """Validate Team Essentials conversations"""
        print("\n🔍 Validating Claude 14: Team Essentials")
        print("-" * 50)

        results = {
            "total_conversations": 0,
            "valid_conversations": 0,
            "issues": [],
            "team_member_coverage": Counter(),
            "dynamics_shown": Counter(),
            "language_mix": {"indonesian": 0, "english": 0, "mixed": 0}
        }

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            conversations = data.get('conversations', [])
            results["total_conversations"] = len(conversations)

            for i, conv in enumerate(conversations):
                valid = True

                # Check structure
                if not all(key in conv for key in ['conversation_id', 'messages', 'participants']):
                    results["issues"].append(f"Conv {i}: Missing required fields")
                    valid = False
                    continue

                # Track team members
                participants = conv.get('participants', [])
                for participant in participants:
                    member = participant.lower().replace(' ', '_')
                    if member in self.team_members:
                        results["team_member_coverage"][member] += 1

                # Check dynamics
                if conv.get('dynamics_shown'):
                    for dynamic, value in conv['dynamics_shown'].items():
                        if value:
                            results["dynamics_shown"][dynamic] += 1

                # Language detection (simple heuristic)
                messages = conv.get('messages', [])
                text = ' '.join(m.get('message', '') for m in messages).lower()

                indo_words = ['gw', 'lu', 'gue', 'loe', 'dong', 'sih', 'deh', 'nih', 'banget']
                eng_words = ['the', 'is', 'are', 'have', 'been', 'will', 'would']

                has_indo = any(word in text for word in indo_words)
                has_eng = any(word in text for word in eng_words)

                if has_indo and has_eng:
                    results["language_mix"]["mixed"] += 1
                elif has_indo:
                    results["language_mix"]["indonesian"] += 1
                else:
                    results["language_mix"]["english"] += 1

                if valid:
                    results["valid_conversations"] += 1

            # Print results
            print(f"✅ Total Conversations: {results['total_conversations']}")
            print(f"✅ Valid Conversations: {results['valid_conversations']}")

            print("\n👥 Team Member Coverage:")
            for member, count in results["team_member_coverage"].most_common():
                print(f"  - {member}: {count} conversations")

            print("\n🎭 Dynamics Shown:")
            for dynamic, count in results["dynamics_shown"].most_common():
                percentage = (count / results['total_conversations']) * 100
                print(f"  - {dynamic}: {count} ({percentage:.1f}%)")

            print("\n🗣️ Language Mix:")
            total_lang = sum(results["language_mix"].values())
            for lang, count in results["language_mix"].items():
                percentage = (count / total_lang) * 100 if total_lang > 0 else 0
                print(f"  - {lang}: {count} ({percentage:.1f}%)")

            if results["issues"]:
                print(f"\n⚠️ Issues Found: {len(results['issues'])}")
                for issue in results["issues"][:5]:
                    print(f"  - {issue}")

        except FileNotFoundError:
            print("❌ File not found")
            results["issues"].append("File not found")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            results["issues"].append(f"JSON decode error: {e}")

        return results

    def run_validation(self):
        """Run validation on both team dynamics files"""
        print("=" * 60)
        print("🎯 TEAM DYNAMICS DATASET VALIDATION")
        print("=" * 60)

        # Validate Claude 13
        claude_13_path = os.path.join(self.dataset_dir, "claude_13_zero_zantara.json")
        if os.path.exists(claude_13_path):
            claude_13_results = self.validate_claude_13(claude_13_path)
        else:
            print("\n⏳ Claude 13 not yet generated")

        # Validate Claude 14
        claude_14_path = os.path.join(self.dataset_dir, "claude_14_team_essentials.json")
        if os.path.exists(claude_14_path):
            claude_14_results = self.validate_claude_14(claude_14_path)
        else:
            print("\n⏳ Claude 14 not yet generated")

        print("\n" + "=" * 60)
        print("✅ Validation Complete!")
        print("=" * 60)

def main():
    validator = TeamDynamicsValidator()
    validator.run_validation()

if __name__ == "__main__":
    main()