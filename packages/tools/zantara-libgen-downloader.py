#!/usr/bin/env python3
"""
🔮 ZANTARA LIBGEN BULK DOWNLOADER
Automatically searches and downloads remaining 45 Priority S books
Uses Library Genesis API + mirrors
"""

import requests
import time
import json
import os
from pathlib import Path
from urllib.parse import quote

# Configuration
BASE_DIR = Path.home() / "Desktop" / "ZANTARA_Knowledge"
DOWNLOADS_DIR = BASE_DIR / "Downloads"
PRIORITY_S_DIR = BASE_DIR / "Priority_S"

# LibGen mirrors (fallbacks if primary fails)
LIBGEN_APIS = [
    "http://libgen.rs/json.php",
    "http://libgen.is/json.php",
]

# Priority S books to download (45 remaining)
BOOKS_TO_DOWNLOAD = {
    # ESOTERICO (6 remaining - 4 already done)
    "esoterico": [
        {"title": "Crisis of the Modern World", "author": "Rene Guenon", "phase": "1A"},
        {"title": "Reign of Quantity", "author": "Rene Guenon", "phase": "1A"},
        {"title": "Symbolism of the Cross", "author": "Rene Guenon", "phase": "1A"},
        {"title": "Sunda Wiwitan", "author": "", "phase": "1A", "manual": True},  # Needs manual
        {"title": "Wayang Philosophy", "author": "", "phase": "1A", "manual": True},  # Needs manual
        {"title": "Serat Centhini", "author": "", "phase": "1A", "manual": True},  # Needs manual
    ],

    # PRATICO (8 books)
    "pratico": [
        {"title": "Atomic Habits", "author": "James Clear", "phase": "1A"},
        {"title": "Deep Work", "author": "Cal Newport", "phase": "1A"},
        {"title": "Nonviolent Communication", "author": "Marshall Rosenberg", "phase": "1A"},
        {"title": "The Body Keeps the Score", "author": "Bessel van der Kolk", "phase": "1A"},
        {"title": "Why We Sleep", "author": "Matthew Walker", "phase": "1C"},
        {"title": "Ayurveda Science of Self-Healing", "author": "Vasant Lad", "phase": "1C"},
        {"title": "Ramuan Tradisional", "author": "Hembing", "phase": "1C", "manual": True},
        {"title": "Jamu Indonesian Traditional Medicine", "author": "", "phase": "1C", "manual": True},
    ],

    # CODING (7 remaining - 1 already done: SICP)
    "coding": [
        {"title": "Clean Code", "author": "Robert Martin", "phase": "1B"},
        {"title": "Clean Architecture", "author": "Robert Martin", "phase": "1B"},
        {"title": "The Pragmatic Programmer", "author": "Andy Hunt", "phase": "1B"},
        {"title": "Design Patterns", "author": "Gamma", "phase": "1B"},
        {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "phase": "1B"},
        {"title": "Refactoring", "author": "Martin Fowler", "phase": "1B"},
        {"title": "Domain-Driven Design", "author": "Eric Evans", "phase": "1B"},
    ],

    # AI/AGI (6 books)
    "ai": [
        {"title": "Deep Learning", "author": "Ian Goodfellow", "phase": "1B"},
        {"title": "Hands-On Machine Learning", "author": "Aurelien Geron", "phase": "1B"},
        {"title": "Human Compatible", "author": "Stuart Russell", "phase": "1B"},
        {"title": "The Alignment Problem", "author": "Brian Christian", "phase": "1B"},
        {"title": "Speech and Language Processing", "author": "Jurafsky", "phase": "1B"},
        {"title": "Andrej Karpathy blog", "author": "", "phase": "1B", "manual": True},  # Web scrape
    ],

    # LETTERATURA (12 books)
    "letteratura": [
        {"title": "This Earth of Mankind", "author": "Pramoedya Ananta Toer", "phase": "1C"},
        {"title": "Beauty is a Wound", "author": "Eka Kurniawan", "phase": "1C"},
        {"title": "Laskar Pelangi", "author": "Andrea Hirata", "phase": "1C"},
        {"title": "Supernova", "author": "Dee Lestari", "phase": "1C"},
        {"title": "One Hundred Years of Solitude", "author": "Gabriel Garcia Marquez", "phase": "1C"},
        {"title": "Ficciones", "author": "Jorge Luis Borges", "phase": "1C"},
        {"title": "Invisible Cities", "author": "Italo Calvino", "phase": "1C"},
        {"title": "Norwegian Wood", "author": "Haruki Murakami", "phase": "1C"},
        {"title": "Catatan Pinggir", "author": "Goenawan Mohamad", "phase": "1C", "manual": True},
        {"title": "The Stranger", "author": "Albert Camus", "phase": "1C"},
        {"title": "The Book of Disquiet", "author": "Fernando Pessoa", "phase": "1C"},
        {"title": "If This Is a Man", "author": "Primo Levi", "phase": "1C"},
    ],

    # FUTURO & BUSINESS (5 books)
    "futuro": [
        {"title": "Zero to One", "author": "Peter Thiel", "phase": "1D"},
        {"title": "Antifragile", "author": "Nassim Taleb", "phase": "1D"},
        {"title": "Thinking Fast and Slow", "author": "Daniel Kahneman", "phase": "1D"},
        {"title": "Sapiens", "author": "Yuval Noah Harari", "phase": "1D"},
        {"title": "The Ministry for the Future", "author": "Kim Stanley Robinson", "phase": "1D"},
    ],
}

def search_libgen(title, author=""):
    """Search LibGen for a book"""
    print(f"🔍 Searching: {title} by {author}")

    query = f"{title} {author}".strip()

    for api_url in LIBGEN_APIS:
        try:
            params = {
                "fields": "title,author,md5,extension,filesize",
                "q": query,
                "limit": 3
            }

            response = requests.get(api_url, params=params, timeout=10)

            if response.status_code == 200:
                results = response.json()
                if results:
                    print(f"   ✅ Found {len(results)} results")
                    return results

        except Exception as e:
            print(f"   ⚠️  API {api_url} failed: {e}")
            continue

    print(f"   ❌ Not found on LibGen")
    return None

def get_download_link(md5):
    """Get download link from LibGen"""
    mirrors = [
        f"http://library.lol/main/{md5}",
        f"http://libgen.rs/book/index.php?md5={md5}",
    ]
    return mirrors[0]  # Use library.lol as primary

def download_book(book_info, phase):
    """Download a single book"""
    if book_info.get("manual"):
        print(f"   ⏭️  MANUAL: {book_info['title']} - Requires manual acquisition")
        return False

    results = search_libgen(book_info["title"], book_info.get("author", ""))

    if not results:
        return False

    # Pick best result (first PDF or EPUB)
    best_result = None
    for result in results:
        ext = result.get("extension", "").lower()
        if ext in ["pdf", "epub"]:
            best_result = result
            break

    if not best_result:
        best_result = results[0]  # Fallback to first result

    # Generate download link
    md5 = best_result.get("md5")
    if not md5:
        print(f"   ❌ No MD5 hash found")
        return False

    download_url = get_download_link(md5)

    # Create safe filename
    title_safe = "".join(c for c in book_info["title"] if c.isalnum() or c in (' ', '-', '_')).strip()
    author_safe = "".join(c for c in book_info.get("author", "") if c.isalnum() or c in (' ', '-', '_')).strip()
    ext = best_result.get("extension", "pdf")

    if author_safe:
        filename = f"{author_safe}_{title_safe}.{ext}"
    else:
        filename = f"{title_safe}.{ext}"

    phase_dir = PRIORITY_S_DIR / f"Phase{phase}_{'Core_Identity' if phase == '1A' else 'Technical' if phase == '1B' else 'Literary' if phase == '1C' else 'Complete'}"
    filepath = phase_dir / filename

    print(f"   📥 Download link: {download_url}")
    print(f"   📁 Will save to: {filepath}")
    print(f"   ℹ️  Visit link manually to download (auto-download not implemented)")

    # Save download info to a JSON file for tracking
    download_info = {
        "title": book_info["title"],
        "author": book_info.get("author", ""),
        "download_url": download_url,
        "filename": filename,
        "destination": str(filepath),
        "md5": md5,
        "extension": ext,
        "filesize": best_result.get("filesize", "unknown")
    }

    downloads_json = DOWNLOADS_DIR / "download_links.json"

    # Load existing or create new
    if downloads_json.exists():
        with open(downloads_json, 'r') as f:
            all_downloads = json.load(f)
    else:
        all_downloads = []

    all_downloads.append(download_info)

    with open(downloads_json, 'w') as f:
        json.dump(all_downloads, f, indent=2)

    return True

def main():
    print("🔮 ZANTARA LIBGEN BULK DOWNLOADER")
    print("=" * 50)

    # Ensure directories exist
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    total_books = 0
    found_books = 0
    manual_books = 0

    for category, books in BOOKS_TO_DOWNLOAD.items():
        print(f"\n{'='*50}")
        print(f"📚 Category: {category.upper()}")
        print(f"{'='*50}\n")

        for book in books:
            total_books += 1

            if book.get("manual"):
                manual_books += 1
                print(f"⏭️  MANUAL: {book['title']}")
                continue

            success = download_book(book, book["phase"])
            if success:
                found_books += 1

            # Rate limiting - be nice to LibGen
            time.sleep(2)

    print(f"\n{'='*50}")
    print(f"✨ SEARCH COMPLETE")
    print(f"{'='*50}")
    print(f"📊 Total books: {total_books}")
    print(f"✅ Found on LibGen: {found_books}")
    print(f"⏭️  Manual acquisition needed: {manual_books}")
    print(f"❌ Not found: {total_books - found_books - manual_books}")
    print(f"\n📁 Download links saved to: {DOWNLOADS_DIR / 'download_links.json'}")
    print(f"\n🔗 Next: Open download_links.json and visit each URL to download")

if __name__ == "__main__":
    main()