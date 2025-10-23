"""
SITI Files Parser - Extract all 259+ sources from INTEL_SCRAPING
Parses 20 SITI_*.txt files and creates structured source database
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum


class SourceTier(str, Enum):
    """Source reliability tier"""
    OFFICIAL = "official"      # T1: Government, official sources
    ACCREDITED = "accredited"  # T2: Reputable news, verified sources
    COMMUNITY = "community"    # T3: Forums, social media


class SourcePriority(str, Enum):
    """Source priority level"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class ParsedSource:
    """Structured source data"""
    name: str
    url: str
    description: str
    category: str
    tier: SourceTier
    priority: SourcePriority
    section: str = ""
    requires_js: bool = False

    def to_dict(self):
        return asdict(self)


class SITIParser:
    """Parse SITI_*.txt files to extract all sources"""

    # Tier detection patterns
    TIER_PATTERNS = {
        SourceTier.OFFICIAL: [
            r'🏛️', r'\.go\.id', r'government', r'official', r'ministry',
            r'directorate', r'cabinet', r'presidential', r'parliament'
        ],
        SourceTier.ACCREDITED: [
            r'📰', r'📺', r'💼', r'news', r'media', r'post', r'times',
            r'journal', r'magazine', r'pwc', r'kpmg', r'deloitte', r'ey'
        ],
        SourceTier.COMMUNITY: [
            r'forum', r'reddit', r'community', r'expat', r'social'
        ]
    }

    # Priority patterns
    PRIORITY_PATTERNS = {
        SourcePriority.CRITICAL: [r'⭐', r'PRIORITARI', r'controlla sempre', r'MAJOR'],
        SourcePriority.HIGH: [r'IMPORTANT', r'KEY'],
        SourcePriority.MEDIUM: [r'SECONDARI'],
        SourcePriority.LOW: []
    }

    def __init__(self, siti_dir: str = "/home/user/nuzantara/INTEL_SCRAPING/sites"):
        self.siti_dir = Path(siti_dir)
        self.sources: List[ParsedSource] = []

    def parse_all_files(self) -> List[ParsedSource]:
        """Parse all SITI_*.txt files"""
        siti_files = sorted(self.siti_dir.glob("SITI_*.txt"))

        print(f"📂 Found {len(siti_files)} SITI files")

        for siti_file in siti_files:
            category = self._extract_category_from_filename(siti_file.name)
            sources = self._parse_siti_file(siti_file, category)
            self.sources.extend(sources)
            print(f"   ✅ {siti_file.name}: {len(sources)} sources")

        print(f"\n📊 Total sources parsed: {len(self.sources)}")
        return self.sources

    def _extract_category_from_filename(self, filename: str) -> str:
        """Extract category from SITI_CATEGORY_NAME.txt"""
        # SITI_VINO_NEWS.txt -> news
        # SITI_FAISHA_TAX.txt -> tax
        match = re.search(r'SITI_[A-Z]+_(.+)\.txt', filename)
        if match:
            return match.group(1).lower().replace('_', '_')
        return "general"

    def _parse_siti_file(self, filepath: Path, category: str) -> List[ParsedSource]:
        """Parse single SITI file"""
        content = filepath.read_text(encoding='utf-8')
        sources = []

        # Split by source entries (numbered lines)
        entries = re.findall(
            r'(\d+)\.\s*([📰📺💼🏛️📜🌐📱💻🏦👥🔍]+)\s*(.+?)\n\s*🔗\s*(https?://[^\s]+)\n\s*📝\s*(.+?)(?=\n\n|\n\d+\.|\Z)',
            content,
            re.DOTALL
        )

        current_section = ""
        current_priority = SourcePriority.MEDIUM

        for number, emoji, name, url, description in entries:
            # Clean up
            name = name.strip()
            url = url.strip()
            description = description.strip()

            # Detect section from surrounding text
            section_match = re.search(
                r'=+\s*(.+?)\s*=+',
                content[:content.find(f"{number}. {emoji}")],
                re.IGNORECASE
            )
            if section_match:
                current_section = section_match.group(1).strip()

            # Detect tier
            tier = self._detect_tier(url, name, description, emoji)

            # Detect priority
            priority = self._detect_priority(content, number, category)

            # Detect if requires JS
            requires_js = any(keyword in url.lower() for keyword in ['detik', 'tempo', 'reddit', 'instagram'])

            source = ParsedSource(
                name=name,
                url=url,
                description=description,
                category=category,
                tier=tier,
                priority=priority,
                section=current_section,
                requires_js=requires_js
            )

            sources.append(source)

        return sources

    def _detect_tier(self, url: str, name: str, description: str, emoji: str) -> SourceTier:
        """Detect source tier from URL, name, description"""
        text = f"{url} {name} {description} {emoji}".lower()

        # Check each tier
        for tier, patterns in self.TIER_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return tier

        # Default to accredited
        return SourceTier.ACCREDITED

    def _detect_priority(self, content: str, number: str, category: str) -> SourcePriority:
        """Detect source priority"""
        # Check if in priority section
        priority_section = content[:content.find(f"{number}.")]

        if any(p in priority_section for p in ['⭐', 'PRIORITARI', 'controlla sempre', 'MAJOR']):
            return SourcePriority.CRITICAL

        # Category-specific priorities
        if category in ['tax', 'immigration', 'regulatory']:
            if int(number) <= 10:
                return SourcePriority.HIGH

        if int(number) <= 5:
            return SourcePriority.HIGH
        elif int(number) <= 20:
            return SourcePriority.MEDIUM
        else:
            return SourcePriority.LOW

    def get_by_category(self, category: str) -> List[ParsedSource]:
        """Get sources by category"""
        return [s for s in self.sources if s.category == category]

    def get_by_tier(self, tier: SourceTier) -> List[ParsedSource]:
        """Get sources by tier"""
        return [s for s in self.sources if s.tier == tier]

    def get_by_priority(self, priority: SourcePriority) -> List[ParsedSource]:
        """Get sources by priority"""
        return [s for s in self.sources if s.priority == priority]

    def get_stats(self) -> Dict[str, Any]:
        """Get parsing statistics"""
        return {
            "total_sources": len(self.sources),
            "by_tier": {
                tier.value: len(self.get_by_tier(tier))
                for tier in SourceTier
            },
            "by_priority": {
                priority.value: len(self.get_by_priority(priority))
                for priority in SourcePriority
            },
            "by_category": {
                category: len(self.get_by_category(category))
                for category in set(s.category for s in self.sources)
            }
        }

    def save_to_json(self, output_path: str):
        """Save parsed sources to JSON"""
        data = {
            "sources": [s.to_dict() for s in self.sources],
            "stats": self.get_stats(),
            "metadata": {
                "total_sources": len(self.sources),
                "siti_files_parsed": len(list(self.siti_dir.glob("SITI_*.txt")))
            }
        }

        Path(output_path).write_text(json.dumps(data, indent=2), encoding='utf-8')
        print(f"\n💾 Saved to: {output_path}")

    def save_to_yaml(self, output_path: str):
        """Save parsed sources to YAML"""
        import yaml

        data = {
            "sources": [s.to_dict() for s in self.sources],
            "stats": self.get_stats()
        }

        Path(output_path).write_text(yaml.dump(data, sort_keys=False), encoding='utf-8')
        print(f"\n💾 Saved to: {output_path}")


def main():
    """Parse all SITI files and generate output"""

    print("🚀 SITI Parser - Extracting all 259+ sources")
    print("=" * 60)

    parser = SITIParser()
    sources = parser.parse_all_files()

    # Print statistics
    print("\n📊 Statistics:")
    stats = parser.get_stats()

    print(f"\n🎯 By Tier:")
    for tier, count in stats['by_tier'].items():
        print(f"   {tier:12} : {count:3} sources")

    print(f"\n⚡ By Priority:")
    for priority, count in stats['by_priority'].items():
        print(f"   {priority:12} : {count:3} sources")

    print(f"\n📁 By Category:")
    for category, count in sorted(stats['by_category'].items(), key=lambda x: -x[1])[:10]:
        print(f"   {category:20} : {count:3} sources")

    # Save outputs
    output_dir = Path("/home/user/nuzantara/apps/backend-rag/backend/nuzantara_scraper/config")
    output_dir.mkdir(parents=True, exist_ok=True)

    parser.save_to_json(str(output_dir / "all_sources.json"))

    print("\n✅ Parsing complete!")
    print(f"📂 Output: {output_dir / 'all_sources.json'}")

    return sources


if __name__ == "__main__":
    sources = main()
