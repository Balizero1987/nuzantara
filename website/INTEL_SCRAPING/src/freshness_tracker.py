#!/usr/bin/env python3
"""
Source Freshness Tracker for Intel Scraping
Track when sources were last successfully scraped
"""
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
FRESHNESS_FILE = DATA_DIR / "source_freshness.json"


class FreshnessTracker:
    """Track source freshness (last successful scrape time)"""

    def __init__(self):
        self.sources: Dict[str, str] = {}  # {source_url: last_scraped_iso}
        self._load()

    def _load(self):
        """Load freshness data from disk"""
        if FRESHNESS_FILE.exists():
            try:
                self.sources = json.loads(FRESHNESS_FILE.read_text(encoding='utf-8'))
            except Exception as e:
                print(f"⚠️  Could not load freshness data: {e}")
                self.sources = {}

    def save(self):
        """Save freshness data to disk"""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            FRESHNESS_FILE.write_text(
                json.dumps(self.sources, indent=2, sort_keys=True),
                encoding='utf-8'
            )
        except Exception as e:
            print(f"⚠️  Could not save freshness data: {e}")

    def mark_scraped(self, source_url: str, timestamp: Optional[datetime] = None) -> None:
        """Mark source as successfully scraped

        Args:
            source_url: Source URL
            timestamp: Scrape timestamp (default: now)
        """
        if timestamp is None:
            timestamp = datetime.now()

        self.sources[source_url] = timestamp.isoformat()

    def get_last_scraped(self, source_url: str) -> Optional[datetime]:
        """Get last scrape time for source

        Args:
            source_url: Source URL

        Returns:
            Last scrape datetime or None if never scraped
        """
        iso_str = self.sources.get(source_url)
        if iso_str:
            try:
                return datetime.fromisoformat(iso_str)
            except ValueError:
                return None
        return None

    def is_stale(self, source_url: str, max_age_hours: int = 24) -> bool:
        """Check if source is stale

        Args:
            source_url: Source URL
            max_age_hours: Maximum age in hours (default: 24)

        Returns:
            True if source is stale or never scraped
        """
        last_scraped = self.get_last_scraped(source_url)

        if last_scraped is None:
            return True  # Never scraped = stale

        age = datetime.now() - last_scraped
        return age > timedelta(hours=max_age_hours)

    def get_stale_sources(self, max_age_hours: int = 24) -> list:
        """Get list of stale sources

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            List of stale source URLs
        """
        return [url for url in self.sources.keys()
                if self.is_stale(url, max_age_hours)]

    def get_report(self) -> str:
        """Generate freshness report

        Returns:
            Formatted freshness report
        """
        if not self.sources:
            return "📊 No sources tracked yet"

        now = datetime.now()
        lines = ["📊 Source Freshness Report", "=" * 60]

        # Sort by last scraped (oldest first)
        sorted_sources = sorted(
            self.sources.items(),
            key=lambda x: x[1]
        )

        for source_url, iso_str in sorted_sources:
            try:
                last_scraped = datetime.fromisoformat(iso_str)
                age = now - last_scraped

                # Format age
                if age.days > 0:
                    age_str = f"{age.days}d ago"
                elif age.seconds > 3600:
                    age_str = f"{age.seconds // 3600}h ago"
                else:
                    age_str = f"{age.seconds // 60}m ago"

                # Status indicator
                if age > timedelta(hours=24):
                    status = "🔴 STALE"
                elif age > timedelta(hours=12):
                    status = "🟡 OLD"
                else:
                    status = "🟢 FRESH"

                lines.append(f"{status} {age_str:10} {source_url[:60]}")

            except ValueError:
                lines.append(f"⚠️  INVALID    {source_url[:60]}")

        lines.append("=" * 60)
        lines.append(f"Total sources: {len(self.sources)}")
        lines.append(f"Stale (>24h): {len(self.get_stale_sources(24))}")

        return "\n".join(lines)


# Module-level convenience functions
_tracker = None

def get_tracker() -> FreshnessTracker:
    """Get global freshness tracker instance"""
    global _tracker
    if _tracker is None:
        _tracker = FreshnessTracker()
    return _tracker


def mark_scraped(source_url: str, timestamp: Optional[datetime] = None) -> None:
    """Mark source as scraped (convenience function)"""
    get_tracker().mark_scraped(source_url, timestamp)


def is_stale(source_url: str, max_age_hours: int = 24) -> bool:
    """Check if source is stale (convenience function)"""
    return get_tracker().is_stale(source_url, max_age_hours)


if __name__ == '__main__':
    # Test freshness tracking
    tracker = FreshnessTracker()

    # Mark some sources as scraped
    test_sources = [
        "https://example.com/feed1",
        "https://example.com/feed2",
        "https://example.com/feed3",
    ]

    for source in test_sources:
        tracker.mark_scraped(source)

    # Mark one as old
    old_time = datetime.now() - timedelta(hours=48)
    tracker.mark_scraped(test_sources[0], old_time)

    tracker.save()

    print(tracker.get_report())
