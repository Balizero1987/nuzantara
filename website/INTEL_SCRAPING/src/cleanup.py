#!/usr/bin/env python3
"""
Cleanup Script for Intel Scraping
Implements data retention policy
"""
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
LOGS_DIR = PROJECT_ROOT / "logs"

# Retention policies (in days)
RAW_RETENTION_DAYS = 30  # Keep raw data for 30 days
PROCESSED_RETENTION_DAYS = 90  # Keep processed data for 90 days
LOG_RETENTION_DAYS = 60  # Keep logs for 60 days


def get_dated_dirs(base_dir: Path) -> List[Tuple[Path, datetime]]:
    """Get dated directories with their dates

    Args:
        base_dir: Base directory to scan

    Returns:
        List of (directory_path, date) tuples
    """
    dirs = []

    if not base_dir.exists():
        return dirs

    for item in base_dir.iterdir():
        if not item.is_dir():
            continue

        # Try to parse directory name as YYYY-MM-DD
        try:
            dir_date = datetime.strptime(item.name, '%Y-%m-%d')
            dirs.append((item, dir_date))
        except ValueError:
            # Not a dated directory, skip
            continue

    return dirs


def cleanup_old_data(base_dir: Path, retention_days: int, dry_run: bool = False) -> Tuple[int, int]:
    """Remove old dated directories

    Args:
        base_dir: Base directory containing dated folders
        retention_days: Number of days to retain
        dry_run: If True, only report what would be deleted

    Returns:
        Tuple of (deleted_count, freed_bytes)
    """
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    dated_dirs = get_dated_dirs(base_dir)

    deleted_count = 0
    freed_bytes = 0

    for dir_path, dir_date in dated_dirs:
        if dir_date < cutoff_date:
            # Calculate size
            size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())

            if dry_run:
                print(f"   [DRY RUN] Would delete: {dir_path.name} ({size / 1024 / 1024:.1f} MB)")
            else:
                print(f"   🗑️  Deleting: {dir_path.name} ({size / 1024 / 1024:.1f} MB)")
                shutil.rmtree(dir_path)
                deleted_count += 1
                freed_bytes += size

    return deleted_count, freed_bytes


def cleanup_old_logs(logs_dir: Path, retention_days: int, dry_run: bool = False) -> Tuple[int, int]:
    """Remove old log files

    Args:
        logs_dir: Logs directory
        retention_days: Number of days to retain
        dry_run: If True, only report what would be deleted

    Returns:
        Tuple of (deleted_count, freed_bytes)
    """
    if not logs_dir.exists():
        return 0, 0

    cutoff_time = datetime.now().timestamp() - (retention_days * 86400)
    deleted_count = 0
    freed_bytes = 0

    for log_file in logs_dir.glob("*.log*"):
        if not log_file.is_file():
            continue

        # Check file modification time
        if log_file.stat().st_mtime < cutoff_time:
            size = log_file.stat().st_size

            if dry_run:
                print(f"   [DRY RUN] Would delete: {log_file.name} ({size / 1024:.1f} KB)")
            else:
                print(f"   🗑️  Deleting: {log_file.name} ({size / 1024:.1f} KB)")
                log_file.unlink()
                deleted_count += 1
                freed_bytes += size

    return deleted_count, freed_bytes


def get_disk_usage_report() -> str:
    """Generate disk usage report

    Returns:
        Formatted disk usage report
    """
    lines = ["📊 Disk Usage Report", "=" * 60]

    def get_dir_size(path: Path) -> int:
        """Calculate directory size"""
        if not path.exists():
            return 0
        return sum(f.stat().st_size for f in path.rglob('*') if f.is_file())

    # Calculate sizes
    raw_size = get_dir_size(RAW_DIR)
    processed_size = get_dir_size(PROCESSED_DIR)
    logs_size = get_dir_size(LOGS_DIR)
    total_size = raw_size + processed_size + logs_size

    lines.append(f"Raw data:       {raw_size / 1024 / 1024:8.1f} MB")
    lines.append(f"Processed data: {processed_size / 1024 / 1024:8.1f} MB")
    lines.append(f"Logs:           {logs_size / 1024 / 1024:8.1f} MB")
    lines.append("-" * 60)
    lines.append(f"Total:          {total_size / 1024 / 1024:8.1f} MB")
    lines.append("=" * 60)

    # Count dated directories
    raw_dirs = len(get_dated_dirs(RAW_DIR))
    processed_dirs = len(get_dated_dirs(PROCESSED_DIR))

    lines.append(f"Raw directories:       {raw_dirs}")
    lines.append(f"Processed directories: {processed_dirs}")

    return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Intel Scraping Cleanup Script')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be deleted without actually deleting')
    parser.add_argument('--raw-days', type=int, default=RAW_RETENTION_DAYS, help=f'Raw data retention (default: {RAW_RETENTION_DAYS})')
    parser.add_argument('--processed-days', type=int, default=PROCESSED_RETENTION_DAYS, help=f'Processed data retention (default: {PROCESSED_RETENTION_DAYS})')
    parser.add_argument('--log-days', type=int, default=LOG_RETENTION_DAYS, help=f'Log retention (default: {LOG_RETENTION_DAYS})')
    parser.add_argument('--report-only', action='store_true', help='Only show disk usage report')

    args = parser.parse_args()

    print("=" * 60)
    print("INTEL SCRAPING - CLEANUP SCRIPT")
    print("=" * 60)
    print()

    # Show disk usage report
    print(get_disk_usage_report())
    print()

    if args.report_only:
        return

    # Perform cleanup
    mode = "DRY RUN" if args.dry_run else "CLEANUP"
    print(f"🧹 {mode} MODE")
    print("=" * 60)

    print(f"\n📁 Cleaning raw data (retention: {args.raw_days} days)")
    raw_deleted, raw_freed = cleanup_old_data(RAW_DIR, args.raw_days, args.dry_run)

    print(f"\n📁 Cleaning processed data (retention: {args.processed_days} days)")
    proc_deleted, proc_freed = cleanup_old_data(PROCESSED_DIR, args.processed_days, args.dry_run)

    print(f"\n📄 Cleaning logs (retention: {args.log_days} days)")
    log_deleted, log_freed = cleanup_old_logs(LOGS_DIR, args.log_days, args.dry_run)

    # Summary
    total_deleted = raw_deleted + proc_deleted + log_deleted
    total_freed = raw_freed + proc_freed + log_freed

    print("\n" + "=" * 60)
    print("CLEANUP SUMMARY")
    print("=" * 60)

    if args.dry_run:
        print(f"Would delete: {total_deleted} items")
        print(f"Would free:   {total_freed / 1024 / 1024:.1f} MB")
        print("\nRun without --dry-run to actually delete files")
    else:
        print(f"Deleted: {total_deleted} items")
        print(f"Freed:   {total_freed / 1024 / 1024:.1f} MB")

    print("=" * 60)


if __name__ == '__main__':
    main()
