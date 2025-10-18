#!/usr/bin/env python3
"""
Test setup - Verifica che tutte le dipendenze siano installate correttamente
"""

import sys


def check_dependency(name, import_name=None):
    """Check if a Python package is installed"""
    if import_name is None:
        import_name = name

    try:
        module = __import__(import_name)
        version = getattr(module, '__version__', 'unknown')
        print(f"✅ {name}: {version}")
        return True
    except ImportError:
        print(f"❌ {name}: NOT INSTALLED")
        return False


def main():
    """Test all dependencies"""
    print("=" * 60)
    print("🧪 Testing Bali Intel Scraper Setup")
    print("=" * 60)
    print()

    # Check Python version
    print(f"✅ Python: {sys.version.split()[0]}")
    print()

    # Check required packages
    print("📦 Checking dependencies:")
    print("-" * 60)

    all_ok = True
    all_ok &= check_dependency("BeautifulSoup4", "bs4")
    all_ok &= check_dependency("Requests", "requests")
    all_ok &= check_dependency("Playwright", "playwright")
    all_ok &= check_dependency("Pandas", "pandas")
    all_ok &= check_dependency("ChromaDB", "chromadb")

    print()

    # Check Playwright browser
    print("🎭 Checking Playwright browser:")
    print("-" * 60)
    try:
        from playwright.sync_api import sync_playwright
        print("✅ Chromium browser: Installed")
    except Exception as e:
        print(f"❌ Chromium browser: NOT INSTALLED")
        print(f"   Run: playwright install chromium")
        all_ok = False

    print()
    print("=" * 60)

    if all_ok:
        print("🎉 Setup completo! Pronto per scraping.")
    else:
        print("⚠️  Alcuni componenti mancano. Segui le istruzioni sopra.")

    print("=" * 60)


if __name__ == "__main__":
    main()
