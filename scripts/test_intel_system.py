#!/usr/bin/env python3
"""
Quick test script for Intel Automation System
"""

import sys
import os
from pathlib import Path

def test_imports():
    """Test all module imports"""
    print("Testing module imports...")

    modules = [
        'crawl4ai_scraper',
        'llama_rag_processor',
        'llama_content_creator',
        'editorial_ai',
        'multi_channel_publisher',
        'run_intel_automation'
    ]

    for module in modules:
        try:
            __import__(module)
            print(f"  ✅ {module}")
        except ImportError as e:
            print(f"  ❌ {module}: {e}")
            return False

    return True

def test_directories():
    """Test directory structure"""
    print("\nTesting directory structure...")

    base_dir = Path(__file__).parent.parent / "INTEL_SCRAPING"

    categories = [
        "immigration", "bkpm_tax", "real_estate", "events",
        "social_trends", "competitors", "bali_news", "weekly_roundup"
    ]

    for category in categories:
        cat_dir = base_dir / category
        if cat_dir.exists():
            print(f"  ✅ {category}/")

            # Check subdirectories
            for subdir in ["raw", "rag", "articles", "editorial"]:
                if (cat_dir / subdir).exists():
                    print(f"     ✓ {subdir}/")
        else:
            print(f"  ⚠️  {category}/ (will be created on first run)")

    return True

def test_dependencies():
    """Test external dependencies"""
    print("\nTesting dependencies...")

    dependencies = {
        'crawl4ai': '✅ Crawl4AI (scraping)',
        'ollama': '✅ Ollama (LLAMA interface)',
        'chromadb': '✅ ChromaDB (vector storage)',
        'anthropic': '✅ Anthropic (Claude)',
        'requests': '✅ Requests (HTTP)',
        'beautifulsoup4': '✅ BeautifulSoup (parsing)',
        'tweepy': '⚠️  Tweepy (Twitter - optional)',
        'telegram': '⚠️  Telegram Bot (optional)'
    }

    for module, description in dependencies.items():
        try:
            __import__(module)
            print(f"  {description}")
        except ImportError:
            if '⚠️' in description:
                print(f"  {description}")
            else:
                print(f"  ❌ {module} - Required! Install with: pip install {module}")

    return True

def test_environment():
    """Test environment variables"""
    print("\nTesting environment...")

    # Check for API keys
    if os.environ.get('ANTHROPIC_API_KEY'):
        print("  ✅ ANTHROPIC_API_KEY is set")
    else:
        print("  ⚠️  ANTHROPIC_API_KEY not set (required for editorial)")

    # Check optional social media keys
    social_keys = [
        'FACEBOOK_PAGE_ACCESS_TOKEN',
        'TWITTER_API_KEY',
        'TELEGRAM_BOT_TOKEN'
    ]

    for key in social_keys:
        if os.environ.get(key):
            print(f"  ✅ {key} is set")
        else:
            print(f"  ⚠️  {key} not set (optional)")

    return True

def test_ollama():
    """Test Ollama installation"""
    print("\nTesting Ollama...")

    import subprocess

    try:
        # Check if ollama is installed
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✅ Ollama CLI installed")

            # Check for LLAMA model
            if 'llama3.2' in result.stdout:
                print("  ✅ LLAMA 3.2 model available")
            else:
                print("  ⚠️  LLAMA 3.2 not found. Install with: ollama pull llama3.2:3b")
        else:
            print("  ❌ Ollama not working properly")
    except FileNotFoundError:
        print("  ❌ Ollama not installed. Get it from: https://ollama.com")

    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("INTEL AUTOMATION SYSTEM - TEST SUITE")
    print("=" * 60)

    # Run tests
    test_imports()
    test_directories()
    test_dependencies()
    test_environment()
    test_ollama()

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    print("""
Ready to run? Use these commands:

1. Test run (limited sources):
   python run_intel_automation.py --test

2. Run specific stage:
   python crawl4ai_scraper.py  # Stage 1
   python llama_rag_processor.py  # Stage 2A
   python llama_content_creator.py  # Stage 2B
   python editorial_ai.py  # Stage 3
   python multi_channel_publisher.py  # Stage 4

3. Full pipeline:
   python run_intel_automation.py

Note: Set ANTHROPIC_API_KEY for editorial review to work!
""")

if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    main()