"""Metrics collection for monitoring"""

from typing import Dict, Any
from datetime import datetime
import json
from pathlib import Path


class MetricsCollector:
    """Collect and store scraping metrics"""

    def __init__(self, metrics_dir: str = "./data/metrics"):
        self.metrics_dir = Path(metrics_dir)
        self.metrics_dir.mkdir(parents=True, exist_ok=True)

        self.metrics: Dict[str, Any] = {
            "total_runs": 0,
            "total_items_scraped": 0,
            "total_items_saved": 0,
            "sources_success_rate": {},
            "average_duration": 0.0
        }

    def record_run(self, result: Any):
        """Record metrics from scraping run"""
        self.metrics["total_runs"] += 1
        self.metrics["total_items_scraped"] += result.items_scraped
        self.metrics["total_items_saved"] += result.items_saved

        # Update averages
        if result.duration_seconds > 0:
            total_duration = self.metrics["average_duration"] * (self.metrics["total_runs"] - 1)
            self.metrics["average_duration"] = (total_duration + result.duration_seconds) / self.metrics["total_runs"]

    def save(self, filename: str = "metrics.json"):
        """Save metrics to file"""
        filepath = self.metrics_dir / filename
        with open(filepath, 'w') as f:
            json.dump(self.metrics, f, indent=2)

    def load(self, filename: str = "metrics.json"):
        """Load metrics from file"""
        filepath = self.metrics_dir / filename
        if filepath.exists():
            with open(filepath, 'r') as f:
                self.metrics = json.load(f)
