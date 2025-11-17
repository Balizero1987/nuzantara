#!/usr/bin/env python3
"""
Monitor All 14 Claude Instances Progress
Real-time tracking of dataset generation
"""

import os
import json
import glob
from datetime import datetime
from typing import Dict, List, Tuple
from colorama import init, Fore, Style

init(autoreset=True)

class ClaudeMonitor:
    def __init__(self):
        self.dataset_dir = os.path.expanduser("~/Google Drive/My Drive/DATASET-GEMMA")
        self.claude_configs = {
            # Standard Indonesian Conversations (Claude 1-12)
            1: {"name": "Jakarta Casual", "target": 2000, "file": "claude_1_jakarta_casual.json"},
            2: {"name": "Jakarta Millennial", "target": 2000, "file": "claude_2_jakarta_millennial.json"},
            3: {"name": "Jakarta Professional", "target": 2000, "file": "claude_3_jakarta_professional.json"},
            4: {"name": "Jakarta Student", "target": 2000, "file": "claude_4_jakarta_student.json"},
            5: {"name": "Jakarta Street", "target": 2000, "file": "claude_5_jakarta_street.json"},
            6: {"name": "Business Mixed", "target": 2000, "file": "claude_6_business_mixed.json"},
            7: {"name": "Daily Life", "target": 2000, "file": "claude_7_daily_life.json"},
            8: {"name": "Creative Industry", "target": 2000, "file": "claude_8_creative_industry.json"},
            9: {"name": "Sundanese Mix", "target": 1500, "file": "claude_9_sundanese_mix.json"},
            10: {"name": "Javanese Mix", "target": 1500, "file": "claude_10_javanese_mix.json"},
            11: {"name": "Balinese Mix", "target": 1500, "file": "claude_11_balinese_mix.json"},
            12: {"name": "Sumatera Mix", "target": 1500, "file": "claude_12_sumatera_mix.json"},

            # Team Dynamics (Claude 13-14)
            13: {"name": "Zero-ZANTARA Italian", "target": 3000, "file": "claude_13_zero_zantara.json", "critical": True},
            14: {"name": "Team Essentials", "target": 3000, "file": "claude_14_team_essentials.json", "critical": True}
        }

    def check_file_status(self, filepath: str) -> Tuple[bool, int]:
        """Check if file exists and count conversations"""
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'conversations' in data:
                        return True, len(data['conversations'])
                    elif isinstance(data, list):
                        return True, len(data)
            except:
                return True, 0
        return False, 0

    def get_progress_bar(self, current: int, target: int, width: int = 30) -> str:
        """Generate ASCII progress bar"""
        if target == 0:
            return "[" + " " * width + "]"

        percentage = min(100, (current / target) * 100)
        filled = int(width * percentage / 100)
        bar = "█" * filled + "░" * (width - filled)
        return f"[{bar}] {percentage:.1f}%"

    def display_status(self):
        """Display comprehensive status dashboard"""
        os.system('clear')

        print(f"{Fore.CYAN}{'='*80}")
        print(f"{Fore.YELLOW}🤖 CLAUDE INSTANCES MONITORING DASHBOARD")
        print(f"{Fore.CYAN}{'='*80}\n")

        total_target = sum(c["target"] for c in self.claude_configs.values())
        total_generated = 0
        completed_instances = 0

        # Group by status
        groups = {
            "🟢 COMPLETED": [],
            "🟡 IN PROGRESS": [],
            "🔴 NOT STARTED": [],
            "⭐ CRITICAL (Team Dynamics)": []
        }

        for claude_id, config in self.claude_configs.items():
            filepath = os.path.join(self.dataset_dir, config["file"])
            exists, count = self.check_file_status(filepath)
            total_generated += count

            status_line = f"Claude {claude_id:2d}: {config['name']:20s} "
            progress_bar = self.get_progress_bar(count, config["target"])
            status_line += f"{progress_bar} {count:4d}/{config['target']:4d}"

            if config.get("critical"):
                if count >= config["target"]:
                    groups["⭐ CRITICAL (Team Dynamics)"].append(f"{Fore.GREEN}{status_line} ✅")
                    completed_instances += 1
                elif exists:
                    groups["⭐ CRITICAL (Team Dynamics)"].append(f"{Fore.YELLOW}{status_line} ⏳")
                else:
                    groups["⭐ CRITICAL (Team Dynamics)"].append(f"{Fore.RED}{status_line} ❌")
            elif count >= config["target"]:
                groups["🟢 COMPLETED"].append(f"{Fore.GREEN}{status_line} ✅")
                completed_instances += 1
            elif exists:
                groups["🟡 IN PROGRESS"].append(f"{Fore.YELLOW}{status_line} ⏳")
            else:
                groups["🔴 NOT STARTED"].append(f"{Fore.RED}{status_line} ❌")

        # Display groups
        for group_name, instances in groups.items():
            if instances:
                print(f"\n{Fore.WHITE}{group_name}")
                print(f"{Fore.CYAN}{'-'*60}")
                for instance in instances:
                    print(instance)

        # Overall statistics
        print(f"\n{Fore.CYAN}{'='*80}")
        print(f"{Fore.WHITE}📊 OVERALL STATISTICS")
        print(f"{Fore.CYAN}{'-'*80}")

        overall_percentage = (total_generated / total_target) * 100 if total_target > 0 else 0
        overall_bar = self.get_progress_bar(total_generated, total_target, 50)

        print(f"Total Progress: {overall_bar}")
        print(f"Conversations: {Fore.YELLOW}{total_generated:,}/{total_target:,} ({overall_percentage:.1f}%)")
        print(f"Instances Complete: {Fore.YELLOW}{completed_instances}/14")
        print(f"Estimated Time Remaining: {self.estimate_time(total_generated, total_target)}")

        # Quality Metrics
        print(f"\n{Fore.WHITE}🎯 DATASET COMPOSITION")
        print(f"{Fore.CYAN}{'-'*80}")
        jakarta_total = sum(count for i in range(1, 9)
                          for count in [self.check_file_status(
                              os.path.join(self.dataset_dir, self.claude_configs[i]["file"]))[1]])
        regional_total = sum(count for i in range(9, 13)
                           for count in [self.check_file_status(
                               os.path.join(self.dataset_dir, self.claude_configs[i]["file"]))[1]])
        team_total = sum(count for i in range(13, 15)
                        for count in [self.check_file_status(
                            os.path.join(self.dataset_dir, self.claude_configs[i]["file"]))[1]])

        print(f"Jakarta Style: {Fore.GREEN}{jakarta_total:,} conversations (Target: 16,000)")
        print(f"Regional Dialects: {Fore.BLUE}{regional_total:,} conversations (Target: 6,000)")
        print(f"Team Dynamics: {Fore.MAGENTA}{team_total:,} conversations (Target: 6,000)")

        # Next Actions
        print(f"\n{Fore.WHITE}📋 NEXT ACTIONS")
        print(f"{Fore.CYAN}{'-'*80}")

        if completed_instances < 12:
            print(f"{Fore.YELLOW}⏳ Waiting for Claude 1-12 to complete...")
        elif completed_instances == 12 and team_total == 0:
            print(f"{Fore.GREEN}✅ Claude 1-12 complete!")
            print(f"{Fore.YELLOW}🚀 Ready to launch Claude 13-14 (Team Dynamics)")
            print(f"   Run: ./launch_claude_13_14.sh")
        elif completed_instances == 14:
            print(f"{Fore.GREEN}🎉 ALL INSTANCES COMPLETE!")
            print(f"{Fore.YELLOW}📦 Ready to merge and validate:")
            print(f"   Run: python3 merge_validate_dataset.py")
        else:
            print(f"{Fore.YELLOW}⏳ Generation in progress...")

        print(f"\n{Fore.CYAN}{'='*80}")
        print(f"{Fore.WHITE}Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Auto-refresh every 30 seconds... Press Ctrl+C to exit")

    def estimate_time(self, current: int, target: int) -> str:
        """Estimate remaining time based on generation rate"""
        remaining = target - current
        if remaining <= 0:
            return "Complete!"

        # Assume ~500 conversations per hour per Claude instance
        hours = remaining / 500
        if hours < 1:
            return f"~{int(hours * 60)} minutes"
        elif hours < 24:
            return f"~{hours:.1f} hours"
        else:
            return f"~{hours/24:.1f} days"

    def run(self):
        """Run monitoring loop"""
        import time

        try:
            while True:
                self.display_status()
                time.sleep(30)  # Refresh every 30 seconds
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Monitoring stopped by user.")
            print(f"{Fore.GREEN}Run again: python3 monitor_all_claude.py")

def main():
    monitor = ClaudeMonitor()
    monitor.run()

if __name__ == "__main__":
    main()