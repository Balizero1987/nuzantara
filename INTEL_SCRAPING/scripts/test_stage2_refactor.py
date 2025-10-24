#!/usr/bin/env python3
"""
Test Stage 2B refactor without AI processing
"""

import sys
from pathlib import Path
from datetime import datetime
import re

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def extract_metadata(raw_content: str, raw_file: Path):
    """Extract metadata from raw markdown file"""

    metadata = {
        "title": "Untitled",
        "source": "Unknown Source",
        "url": "",
        "published_date": "",
        "scraped_date": ""
    }

    # Extract title (first H1 header)
    title_match = re.search(r'^#\s+(.+?)$', raw_content, re.MULTILINE)
    if title_match:
        metadata["title"] = title_match.group(1).strip()

    # Extract source
    source_match = re.search(r'\*\*Source\*\*:\s*(.+?)(?:\n|$)', raw_content)
    if source_match:
        metadata["source"] = source_match.group(1).strip()

    # Extract URL
    url_match = re.search(r'\*\*URL\*\*:\s*(.+?)(?:\n|$)', raw_content)
    if url_match:
        metadata["url"] = url_match.group(1).strip()

    # Extract published date
    pub_match = re.search(r'\*\*Published\*\*:\s*(.+?)(?:\n|$)', raw_content)
    if pub_match:
        metadata["published_date"] = pub_match.group(1).strip()

    # Extract scraped date
    scraped_match = re.search(r'\*\*Scraped\*\*:\s*(.+?)(?:\n|$)', raw_content)
    if scraped_match:
        metadata["scraped_date"] = scraped_match.group(1).strip()

    # Fallback: extract date from filename if no published date
    if not metadata["published_date"] or metadata["published_date"] == "Not found":
        filename_match = re.match(r'(\d{8})_', raw_file.name)
        if filename_match:
            date_str = filename_match.group(1)
            metadata["published_date"] = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

    return metadata

def create_consolidated_report(articles, category):
    """Create consolidated markdown report for a category"""

    # Sort articles by published date (newest first)
    sorted_articles = sorted(
        articles,
        key=lambda x: x["metadata"].get("published_date", ""),
        reverse=True
    )

    # Collect unique sources
    sources = list(set(article["metadata"]["source"] for article in sorted_articles if article["metadata"]["source"]))

    # Generate report
    report = []
    report.append(f"# Intel Report - {category.upper().replace('_', ' ')}")
    report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"**Total Articles**: {len(sorted_articles)}")
    report.append(f"**Sources**: {', '.join(sources)}")
    report.append("")
    report.append("---")
    report.append("")

    # Table of contents
    report.append("## TABLE OF CONTENTS")
    for idx, article in enumerate(sorted_articles, 1):
        title = article["metadata"]["title"]
        # Create anchor-friendly ID
        anchor = f"article-{idx}"
        report.append(f"{idx}. [{title}](#{anchor})")
    report.append("")
    report.append("---")
    report.append("")

    # Articles
    for idx, article in enumerate(sorted_articles, 1):
        metadata = article["metadata"]
        content = article["content"]

        report.append(f"## Article {idx}: {metadata['title']} {{#{f'article-{idx}'}}}")
        report.append(f"**Original Publication**: {metadata['published_date']}")
        report.append(f"**Source**: [{metadata['source']}]({metadata['url']})")
        report.append(f"**Scraped**: {metadata['scraped_date']}")
        report.append("")
        report.append(content)
        report.append("")
        report.append("---")
        report.append("")

    return "\n".join(report)

def main():
    # Test with raw files
    raw_dir = Path("INTEL_SCRAPING/raw")

    if not raw_dir.exists():
        print(f"Directory not found: {raw_dir}")
        return

    raw_files = list(raw_dir.glob("*.md"))
    print(f"Found {len(raw_files)} raw files in {raw_dir}")

    # Organize by category
    files_by_category = {}

    for raw_file in raw_files:
        # Try to extract category from file content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract category
            cat_match = re.search(r'\*\*Category\*\*:\s*(.+?)(?:\n|$)', content)
            if cat_match:
                category = cat_match.group(1).strip().lower().replace(" ", "_")
            else:
                category = "general"

            if category not in files_by_category:
                files_by_category[category] = []

            files_by_category[category].append({
                "file": raw_file,
                "content": content
            })

        except Exception as e:
            print(f"Error reading {raw_file}: {e}")

    print(f"\nCategories found: {list(files_by_category.keys())}")

    # Process each category
    output_dir = Path("INTEL_SCRAPING/output/articles")
    output_dir.mkdir(parents=True, exist_ok=True)

    for category, files in files_by_category.items():
        print(f"\nProcessing category: {category} ({len(files)} files)")

        articles = []
        for file_info in files:
            metadata = extract_metadata(file_info["content"], file_info["file"])

            # Create mock article (in real version, this would be AI-generated)
            article = {
                "metadata": metadata,
                "content": "### Executive Summary\n\n[Article content would be generated here by AI]\n\n### Key Points\n\n- Point 1\n- Point 2\n\n### Details\n\n[Full analysis would go here]",
                "raw_file": file_info["file"].name
            }
            articles.append(article)

            print(f"  - {metadata['title'][:60]}...")

        # Create consolidated report
        if articles:
            report = create_consolidated_report(articles, category)

            # Save report
            datestamp = datetime.now().strftime("%Y%m%d")
            output_file = output_dir / f"{category}_{datestamp}.md"

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(report)

            print(f"  ✅ Saved consolidated report: {output_file}")

if __name__ == "__main__":
    main()