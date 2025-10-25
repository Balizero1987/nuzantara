#!/usr/bin/env python3
"""
ZANTARA AUTOFIX ORCHESTRATOR
Automated test → analyze → fix → deploy → verify workflow

Usage:
    python orchestrator.py              # Run full autofix cycle
    python orchestrator.py --dry-run    # Test without making changes
    python orchestrator.py --max-iter 5 # Custom max iterations
"""

import os
import sys
import json
import time
import argparse
import subprocess
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_PATH = PROJECT_ROOT / "apps" / "backend-rag"
FRONTEND_PATH = PROJECT_ROOT / "apps" / "webapp"
PRODUCTION_URL = "https://scintillating-kindness-production-47e3.up.railway.app"
STATE_DB = Path(__file__).parent / "autofix_state.json"

class Colors:
    """Terminal colors for pretty output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class AutoFixOrchestrator:
    """Main orchestrator for automated fix workflow"""

    def __init__(self, max_iterations: int = 3, dry_run: bool = False):
        self.max_iterations = max_iterations
        self.dry_run = dry_run
        self.current_iteration = 0
        self.cycle_id = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Initialize Claude API (same as Claude Code uses)
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self.claude = anthropic.Anthropic(api_key=api_key)

        # Load state
        self.state = self._load_state()

        print(f"{Colors.HEADER}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BOLD}🤖 ZANTARA AUTOFIX ORCHESTRATOR{Colors.ENDC}")
        print(f"{Colors.CYAN}Cycle ID: {self.cycle_id}{Colors.ENDC}")
        print(f"{Colors.CYAN}Max Iterations: {self.max_iterations}{Colors.ENDC}")
        print(f"{Colors.CYAN}Dry Run: {self.dry_run}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'='*80}{Colors.ENDC}\n")

    def _load_state(self) -> Dict:
        """Load state from disk"""
        if STATE_DB.exists():
            with open(STATE_DB) as f:
                return json.load(f)
        return {"cycles": []}

    def _save_state(self):
        """Save state to disk"""
        STATE_DB.parent.mkdir(exist_ok=True)
        with open(STATE_DB, 'w') as f:
            json.dump(self.state, f, indent=2)

    def _log(self, message: str, level: str = "info"):
        """Pretty logging"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "info": Colors.CYAN,
            "success": Colors.GREEN,
            "warning": Colors.YELLOW,
            "error": Colors.RED
        }
        color = colors.get(level, Colors.CYAN)
        print(f"{color}[{timestamp}] {message}{Colors.ENDC}")

    def run_tests(self) -> Dict:
        """Run test suite (PRODUCTION ONLY)"""
        self._log("🧪 Running production tests...", "info")

        results = {
            "prod_health": self._run_prod_health_check(),
            "prod_pricing": self._run_prod_pricing_test(),
            "timestamp": datetime.now().isoformat()
        }

        all_passed = all(v.get("passed", False) for v in results.values() if isinstance(v, dict))
        results["all_passed"] = all_passed

        if all_passed:
            self._log("✅ All production tests passed!", "success")
        else:
            self._log("❌ Some production tests failed", "error")

        return results

    def _run_local_unit_tests(self) -> Dict:
        """Run pytest on backend"""
        try:
            result = subprocess.run(
                ["pytest", str(BACKEND_PATH / "tests"), "-v", "--tb=short"],
                capture_output=True,
                text=True,
                timeout=60
            )

            return {
                "passed": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr
            }
        except Exception as e:
            return {"passed": False, "errors": str(e)}

    def _run_local_health_check(self) -> Dict:
        """Check localhost:8000/health"""
        try:
            import requests
            response = requests.get("http://localhost:8000/health", timeout=5)
            return {
                "passed": response.status_code == 200,
                "status": response.json().get("status"),
                "version": response.json().get("version")
            }
        except Exception as e:
            return {"passed": False, "errors": str(e)}

    def _run_prod_health_check(self) -> Dict:
        """Check production health"""
        try:
            import requests
            response = requests.get(f"{PRODUCTION_URL}/health", timeout=10)
            return {
                "passed": response.status_code == 200,
                "status": response.json().get("status"),
                "version": response.json().get("version")
            }
        except Exception as e:
            return {"passed": False, "errors": str(e)}

    def _run_prod_pricing_test(self) -> Dict:
        """Test production pricing query"""
        try:
            import requests

            query = "Quanto costa il KITAS E23?"
            url = f"{PRODUCTION_URL}/bali-zero/chat-stream"
            params = {"query": query, "user_email": "test@autofix.com"}

            response = requests.get(url, params=params, stream=True, timeout=30)

            # Collect SSE response
            full_text = ""
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            if data.get('text'):
                                full_text += data['text']
                            if data.get('done'):
                                break
                        except:
                            pass

            # Check for real prices
            has_prices = "26.000.000" in full_text and "28.000.000" in full_text

            return {
                "passed": has_prices,
                "response_length": len(full_text),
                "has_real_prices": has_prices,
                "sample": full_text[:200] if full_text else None
            }
        except Exception as e:
            return {"passed": False, "errors": str(e)}

    def analyze_failures_with_claude(self, test_results: Dict) -> Dict:
        """Use Claude API to analyze test failures"""
        self._log("🔍 Analyzing failures with Claude...", "info")

        # Collect context
        context = self._gather_context(test_results)

        prompt = f"""You are an expert developer analyzing test failures in the Zantara project.

TEST RESULTS:
{json.dumps(test_results, indent=2)}

CONTEXT:
{context}

Analyze the failures and provide:
1. ROOT CAUSE: What is the underlying issue?
2. AFFECTED FILES: Which files need to be modified?
3. FIX STRATEGY: High-level approach to fix
4. CONFIDENCE: 0.0-1.0 (how confident are you?)

Output ONLY valid JSON:
{{
  "root_cause": "...",
  "affected_files": ["path/to/file1.py", "path/to/file2.js"],
  "fix_strategy": "...",
  "confidence": 0.85
}}"""

        try:
            message = self.claude.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse JSON from response
            response_text = message.content[0].text
            # Extract JSON (may be wrapped in markdown)
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            analysis = json.loads(response_text.strip())

            self._log(f"✅ Analysis complete (confidence: {analysis.get('confidence', 0):.2f})", "success")
            self._log(f"Root cause: {analysis.get('root_cause', 'Unknown')[:100]}...", "info")

            return analysis

        except Exception as e:
            self._log(f"❌ Analysis failed: {e}", "error")
            return {"root_cause": str(e), "affected_files": [], "confidence": 0.0}

    def generate_fix_with_claude(self, analysis: Dict) -> Dict:
        """Use Claude API to generate code fix"""
        self._log("🔧 Generating fix with Claude...", "info")

        # Read affected files
        file_contents = {}
        for file_path in analysis.get("affected_files", []):
            full_path = PROJECT_ROOT / file_path
            if full_path.exists():
                with open(full_path) as f:
                    file_contents[file_path] = f.read()

        if not file_contents:
            return {"error": "No affected files found"}

        prompt = f"""You are an expert developer fixing code issues.

ROOT CAUSE: {analysis.get('root_cause')}
FIX STRATEGY: {analysis.get('fix_strategy')}

CURRENT CODE:
{json.dumps(file_contents, indent=2)}

Generate the exact fixes needed. For each file, output:

{{
  "fixes": [
    {{
      "file": "path/to/file.py",
      "search": "exact code to find",
      "replace": "new code to insert"
    }}
  ],
  "commit_message": "Brief description of fix"
}}

Output ONLY valid JSON."""

        try:
            message = self.claude.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = message.content[0].text
            # Extract JSON
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            fix = json.loads(response_text.strip())

            self._log(f"✅ Generated {len(fix.get('fixes', []))} fixes", "success")

            return fix

        except Exception as e:
            self._log(f"❌ Fix generation failed: {e}", "error")
            return {"error": str(e)}

    def apply_fix(self, fix: Dict) -> bool:
        """Apply the generated fix to files"""
        if self.dry_run:
            self._log("🔍 DRY RUN: Would apply fixes but skipping", "warning")
            return True

        self._log("📝 Applying fixes...", "info")

        try:
            for fix_item in fix.get("fixes", []):
                file_path = PROJECT_ROOT / fix_item["file"]

                with open(file_path) as f:
                    content = f.read()

                # Apply search/replace
                new_content = content.replace(
                    fix_item["search"],
                    fix_item["replace"]
                )

                if new_content == content:
                    self._log(f"⚠️ No changes for {fix_item['file']}", "warning")
                    continue

                with open(file_path, 'w') as f:
                    f.write(new_content)

                self._log(f"✅ Fixed {fix_item['file']}", "success")

            return True

        except Exception as e:
            self._log(f"❌ Failed to apply fix: {e}", "error")
            return False

    def commit_and_push(self, commit_message: str) -> bool:
        """Commit changes and push to GitHub"""
        if self.dry_run:
            self._log("🔍 DRY RUN: Would commit but skipping", "warning")
            return True

        self._log("💾 Committing changes...", "info")

        try:
            # Git add
            subprocess.run(["git", "add", "."], cwd=PROJECT_ROOT, check=True)

            # Git commit
            full_message = f"{commit_message}\n\n🤖 Auto-generated by Zantara AutoFix\nCycle: {self.cycle_id}\nIteration: {self.current_iteration + 1}"
            subprocess.run(
                ["git", "commit", "-m", full_message],
                cwd=PROJECT_ROOT,
                check=True
            )

            # Git push
            subprocess.run(["git", "push"], cwd=PROJECT_ROOT, check=True)

            self._log("✅ Changes committed and pushed", "success")
            return True

        except Exception as e:
            self._log(f"❌ Commit failed: {e}", "error")
            return False

    def wait_for_deploy(self, timeout: int = 300) -> bool:
        """Wait for Railway deployment to complete"""
        self._log("⏳ Waiting for Railway deployment...", "info")

        if self.dry_run:
            self._log("🔍 DRY RUN: Would wait for deploy but skipping", "warning")
            return True

        import requests

        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(f"{PRODUCTION_URL}/health", timeout=10)
                if response.status_code == 200:
                    self._log("✅ Deployment successful!", "success")
                    return True
            except:
                pass

            time.sleep(30)
            self._log("⏳ Still waiting...", "info")

        self._log("⚠️ Deployment timeout", "warning")
        return False

    def _gather_context(self, test_results: Dict) -> str:
        """Gather context for Claude analysis"""
        context_parts = []

        # Recent git log
        try:
            result = subprocess.run(
                ["git", "log", "-3", "--oneline"],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True
            )
            context_parts.append(f"Recent commits:\n{result.stdout}")
        except:
            pass

        # Git diff
        try:
            result = subprocess.run(
                ["git", "diff", "HEAD~1"],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True
            )
            if result.stdout:
                context_parts.append(f"Recent changes:\n{result.stdout[:1000]}")
        except:
            pass

        return "\n\n".join(context_parts)

    def run_cycle(self) -> Dict:
        """Run complete autofix cycle"""
        self._log(f"🚀 Starting autofix cycle {self.cycle_id}", "info")

        cycle_data = {
            "cycle_id": self.cycle_id,
            "start_time": datetime.now().isoformat(),
            "iterations": []
        }

        while self.current_iteration < self.max_iterations:
            iter_num = self.current_iteration + 1
            self._log(f"\n{'='*80}", "info")
            self._log(f"🔄 ITERATION {iter_num}/{self.max_iterations}", "info")
            self._log(f"{'='*80}\n", "info")

            iteration_data = {"iteration": iter_num, "start_time": datetime.now().isoformat()}

            # 1. Run tests
            test_results = self.run_tests()
            iteration_data["test_results"] = test_results

            if test_results["all_passed"]:
                self._log(f"\n🎉 SUCCESS! All tests passed on iteration {iter_num}", "success")
                cycle_data["status"] = "success"
                cycle_data["iterations"].append(iteration_data)
                break

            # 2. Analyze with Claude
            analysis = self.analyze_failures_with_claude(test_results)
            iteration_data["analysis"] = analysis

            if analysis.get("confidence", 0) < 0.5:
                self._log("⚠️ Low confidence analysis, alerting human", "warning")
                cycle_data["status"] = "low_confidence"
                cycle_data["iterations"].append(iteration_data)
                break

            # 3. Generate fix
            fix = self.generate_fix_with_claude(analysis)
            iteration_data["fix"] = fix

            if "error" in fix:
                self._log(f"❌ Fix generation failed: {fix['error']}", "error")
                cycle_data["status"] = "fix_failed"
                cycle_data["iterations"].append(iteration_data)
                break

            # 4. Apply fix
            if not self.apply_fix(fix):
                cycle_data["status"] = "apply_failed"
                cycle_data["iterations"].append(iteration_data)
                break

            # 5. Commit & push
            commit_msg = fix.get("commit_message", f"autofix: iteration {iter_num}")
            if not self.commit_and_push(commit_msg):
                cycle_data["status"] = "commit_failed"
                cycle_data["iterations"].append(iteration_data)
                break

            # 6. Wait for deploy
            if not self.wait_for_deploy():
                cycle_data["status"] = "deploy_timeout"
                cycle_data["iterations"].append(iteration_data)
                break

            iteration_data["end_time"] = datetime.now().isoformat()
            cycle_data["iterations"].append(iteration_data)

            self.current_iteration += 1

        # Max iterations reached
        if self.current_iteration >= self.max_iterations and not cycle_data.get("status"):
            cycle_data["status"] = "max_iterations"
            self._log(f"⚠️ Max iterations ({self.max_iterations}) reached", "warning")

        cycle_data["end_time"] = datetime.now().isoformat()

        # Save state
        self.state["cycles"].append(cycle_data)
        self._save_state()

        # Print summary
        self._print_summary(cycle_data)

        return cycle_data

    def _print_summary(self, cycle_data: Dict):
        """Print final summary"""
        print(f"\n{Colors.HEADER}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BOLD}📊 AUTOFIX SUMMARY{Colors.ENDC}")
        print(f"{Colors.HEADER}{'='*80}{Colors.ENDC}\n")

        status = cycle_data.get("status", "unknown")
        status_colors = {
            "success": Colors.GREEN,
            "max_iterations": Colors.YELLOW,
            "low_confidence": Colors.YELLOW,
            "fix_failed": Colors.RED,
            "apply_failed": Colors.RED,
            "commit_failed": Colors.RED,
            "deploy_timeout": Colors.YELLOW
        }

        color = status_colors.get(status, Colors.CYAN)
        print(f"Status: {color}{status.upper()}{Colors.ENDC}")
        print(f"Iterations: {len(cycle_data['iterations'])}/{self.max_iterations}")
        print(f"Cycle ID: {cycle_data['cycle_id']}")

        duration = (
            datetime.fromisoformat(cycle_data['end_time']) -
            datetime.fromisoformat(cycle_data['start_time'])
        ).total_seconds()
        print(f"Duration: {duration:.0f}s")

        print(f"\n{Colors.HEADER}{'='*80}{Colors.ENDC}\n")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Zantara AutoFix Orchestrator")
    parser.add_argument("--max-iter", type=int, default=3, help="Max iterations")
    parser.add_argument("--dry-run", action="store_true", help="Test without making changes")
    args = parser.parse_args()

    try:
        orchestrator = AutoFixOrchestrator(
            max_iterations=args.max_iter,
            dry_run=args.dry_run
        )

        result = orchestrator.run_cycle()

        # Exit code based on status
        if result.get("status") == "success":
            sys.exit(0)
        else:
            sys.exit(1)

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️ Interrupted by user{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Fatal error: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()
