#!/usr/bin/env python3
"""
Verify Llama 3.1 Configuration for Intel Scraping
Checks that Stage 2A, 2B, 2C are configured to use Llama 3.1 8B
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"

def check_env_vars():
    """Check environment variables"""
    print(f"\n{BLUE}📋 Checking Environment Variables{RESET}")
    print("=" * 60)

    ai_backend = os.environ.get("AI_BACKEND", "ollama")
    ollama_model = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

    print(f"AI_BACKEND:       {GREEN}{ai_backend}{RESET}")
    print(f"OLLAMA_MODEL:     {GREEN}{ollama_model}{RESET}")
    print(f"OLLAMA_BASE_URL:  {GREEN}{ollama_url}{RESET}")

    if ai_backend == "ollama":
        if "llama3.1" in ollama_model or "llama-3.1" in ollama_model:
            print(f"\n{GREEN}✅ Llama 3.1 8B configured correctly!{RESET}")
            return True
        else:
            print(f"\n{YELLOW}⚠️  Model is {ollama_model}, not Llama 3.1 8B{RESET}")
            print(f"{YELLOW}   Run: export OLLAMA_MODEL='llama3.1:8b'{RESET}")
            return False
    elif ai_backend == "runpod":
        runpod_endpoint = os.environ.get("RUNPOD_LLAMA_ENDPOINT", "NOT SET")
        runpod_key = os.environ.get("RUNPOD_API_KEY", "NOT SET")
        print(f"\nRunPod Endpoint:  {runpod_endpoint[:50]}...")
        print(f"RunPod API Key:   {'✅ SET' if runpod_key != 'NOT SET' else '❌ NOT SET'}")
        print(f"\n{GREEN}✅ ZANTARA Llama (RunPod) configured{RESET}")
        return True
    else:
        print(f"\n{RED}❌ Unknown AI_BACKEND: {ai_backend}{RESET}")
        return False


def check_ollama_service():
    """Check if Ollama is running"""
    print(f"\n{BLUE}🔍 Checking Ollama Service{RESET}")
    print("=" * 60)

    import subprocess

    try:
        result = subprocess.run(
            ["curl", "-s", "http://localhost:11434/api/tags"],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            print(f"{GREEN}✅ Ollama is running at localhost:11434{RESET}")

            # Check if llama3.1:8b is available
            import json
            data = json.loads(result.stdout)
            models = [m["name"] for m in data.get("models", [])]

            print(f"\n📦 Available models:")
            for model in models:
                if "llama3.1" in model or "llama-3.1" in model:
                    print(f"   {GREEN}✅ {model}{RESET}")
                else:
                    print(f"   {YELLOW}   {model}{RESET}")

            if any("llama3.1" in m or "llama-3.1" in m for m in models):
                print(f"\n{GREEN}✅ Llama 3.1 8B is available in Ollama{RESET}")
                return True
            else:
                print(f"\n{YELLOW}⚠️  Llama 3.1 8B not found in Ollama{RESET}")
                print(f"{YELLOW}   Run: ollama pull llama3.1:8b{RESET}")
                return False
        else:
            print(f"{RED}❌ Ollama is not running{RESET}")
            print(f"{YELLOW}   Run: ollama serve{RESET}")
            return False

    except subprocess.TimeoutExpired:
        print(f"{RED}❌ Ollama timeout (not responding){RESET}")
        return False
    except FileNotFoundError:
        print(f"{RED}❌ curl not found (install curl){RESET}")
        return False
    except Exception as e:
        print(f"{RED}❌ Error checking Ollama: {e}{RESET}")
        return False


def check_stage2_config():
    """Check stage2_parallel_processor.py configuration"""
    print(f"\n{BLUE}📄 Checking stage2_parallel_processor.py{RESET}")
    print("=" * 60)

    script_path = Path(__file__).parent / "stage2_parallel_processor.py"

    if not script_path.exists():
        print(f"{RED}❌ stage2_parallel_processor.py not found{RESET}")
        return False

    with open(script_path, 'r') as f:
        content = f.read()

    # Check default OLLAMA_MODEL
    if 'OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")' in content:
        print(f"{GREEN}✅ Default model: llama3.1:8b{RESET}")
    else:
        print(f"{YELLOW}⚠️  Default model is not llama3.1:8b{RESET}")
        return False

    # Check Stage 2A
    if "Stage 2A using Ollama" in content and "OLLAMA_MODEL" in content:
        print(f"{GREEN}✅ Stage 2A configured for Ollama{RESET}")
    else:
        print(f"{RED}❌ Stage 2A configuration issue{RESET}")
        return False

    # Check Stage 2B
    if "Stage 2B using Ollama" in content:
        print(f"{GREEN}✅ Stage 2B configured for Ollama{RESET}")
    else:
        print(f"{RED}❌ Stage 2B configuration issue{RESET}")
        return False

    # Check Stage 2C
    if "Stage 2C (Bali Zero Journal) using Ollama" in content:
        print(f"{GREEN}✅ Stage 2C configured for Ollama{RESET}")
    else:
        print(f"{RED}❌ Stage 2C configuration issue{RESET}")
        return False

    print(f"\n{GREEN}✅ All stages (2A, 2B, 2C) configured correctly!{RESET}")
    return True


def print_quick_start():
    """Print quick start instructions"""
    print(f"\n{BLUE}🚀 Quick Start Guide{RESET}")
    print("=" * 60)
    print(f"""
{GREEN}1. Start Ollama (if not running):{RESET}
   ollama serve

{GREEN}2. Pull Llama 3.1 8B (if not installed):{RESET}
   ollama pull llama3.1:8b

{GREEN}3. Set environment variables:{RESET}
   export AI_BACKEND="ollama"
   export OLLAMA_MODEL="llama3.1:8b"
   export OLLAMA_BASE_URL="http://localhost:11434"

{GREEN}4. Run Intel Scraping:{RESET}
   python3 scripts/run_intel_automation.py

{GREEN}OR test single category:{RESET}
   python3 scripts/run_intel_automation.py --categories visa_immigration
    """)


def main():
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}  Llama 3.1 8B Configuration Verification{RESET}")
    print(f"{BLUE}  Intel Scraping - Stage 2A, 2B, 2C{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}")

    checks = []

    # Check 1: Environment variables
    checks.append(check_env_vars())

    # Check 2: Ollama service (if using ollama backend)
    ai_backend = os.environ.get("AI_BACKEND", "ollama")
    if ai_backend == "ollama":
        checks.append(check_ollama_service())

    # Check 3: stage2_parallel_processor.py configuration
    checks.append(check_stage2_config())

    # Summary
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}  Summary{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}")

    if all(checks):
        print(f"{GREEN}✅ All checks passed! System ready for Intel Scraping.{RESET}")
        print_quick_start()
        sys.exit(0)
    else:
        print(f"{YELLOW}⚠️  Some checks failed. Review the output above.{RESET}")
        print_quick_start()
        sys.exit(1)


if __name__ == "__main__":
    main()
