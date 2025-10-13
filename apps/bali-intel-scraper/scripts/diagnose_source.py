#!/usr/bin/env python3
"""
Diagnostic tool to help collaborators find correct CSS selectors
Run this when a source stops working
"""

import requests
from bs4 import BeautifulSoup
import sys

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}


def diagnose(url):
    """Diagnose a website and suggest selectors"""
    print("=" * 70)
    print(f"🔍 Diagnosing: {url}")
    print("=" * 70)
    print()

    try:
        print("📡 Fetching page...")
        response = requests.get(url, headers=HEADERS, timeout=15)
        print(f"   Status: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print("   → Check if URL is correct")
            print("   → Try opening in browser to verify")
            return

        soup = BeautifulSoup(response.content, 'html.parser')
        print("   ✅ Page loaded\n")

        # Analyze structure
        print("📊 Page Structure:")
        print("-" * 70)

        # Count common elements
        articles = soup.find_all('article')
        divs_post = soup.select('div.post')
        divs_card = soup.select('div.card')
        divs_story = soup.select('div.story')
        h2_tags = soup.find_all('h2')
        h3_tags = soup.find_all('h3')
        links = soup.find_all('a')

        print(f"   <article> tags: {len(articles)}")
        print(f"   <div class='post'> : {len(divs_post)}")
        print(f"   <div class='card'> : {len(divs_card)}")
        print(f"   <div class='story'>: {len(divs_story)}")
        print(f"   <h2> tags: {len(h2_tags)}")
        print(f"   <h3> tags: {len(h3_tags)}")
        print(f"   <a> links: {len(links)}")
        print()

        # Suggest selectors
        print("💡 Recommended Selectors:")
        print("-" * 70)

        if len(articles) >= 3:
            print("   ✅ CONTAINER: 'article'")
            print(f"      Found {len(articles)} article tags")

            # Analyze first article
            first = articles[0]
            h2 = first.find('h2')
            h3 = first.find('h3')
            link = first.find('a')

            if h2:
                classes = ' '.join(h2.get('class', []))
                print(f"   ✅ TITLE: 'h2' or 'h2.{classes}'" if classes else "   ✅ TITLE: 'h2'")

            if h3:
                classes = ' '.join(h3.get('class', []))
                print(f"   ✅ TITLE (alt): 'h3' or 'h3.{classes}'" if classes else "   ✅ TITLE (alt): 'h3'")

            if link:
                print(f"   ✅ LINK: 'a' or 'h2 a'")

        elif len(divs_post) >= 3:
            print("   ✅ CONTAINER: 'div.post'")
            print(f"      Found {len(divs_post)} divs with class='post'")

        elif len(divs_card) >= 3:
            print("   ✅ CONTAINER: 'div.card'")
            print(f"      Found {len(divs_card)} divs with class='card'")

        else:
            print("   ⚠️  No obvious article container found")
            print("   → Try these manual steps:")
            print("      1. Open page in browser")
            print("      2. Right-click on article → Inspect Element")
            print("      3. Find the wrapping div/article tag")
            print("      4. Note the class names")

        print()

        # Show sample HTML
        if articles:
            print("📄 Sample Article HTML:")
            print("-" * 70)
            sample = str(articles[0])[:500]
            print(sample)
            if len(str(articles[0])) > 500:
                print("   ... (truncated)")

        print()
        print("=" * 70)
        print("✅ Diagnosis complete!")
        print()
        print("📝 Update your scraper config with:")
        print("   'selector': '[CONTAINER from above]',")
        print("   'title_selector': '[TITLE from above]',")
        print("   'link_selector': '[LINK from above]'")
        print("=" * 70)

    except Exception as e:
        print(f"❌ Error: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Check internet connection")
        print("  2. Verify URL is correct")
        print("  3. Site might block automated requests")
        print("  4. Try with VPN if geo-restricted")


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 diagnose_source.py <URL>")
        print()
        print("Example:")
        print("  python3 diagnose_source.py https://www.thejakartapost.com/")
        sys.exit(1)

    url = sys.argv[1]
    diagnose(url)


if __name__ == "__main__":
    main()
