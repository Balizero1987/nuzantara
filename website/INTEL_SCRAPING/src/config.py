#!/usr/bin/env python3
"""
Shared configuration for Intel Scraping system
"""
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCES_DIR = PROJECT_ROOT / "config" / "sources"
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"

# Category emoji icons for better visual scanning
CATEGORY_ICONS = {
    'business': '💼',
    'immigration': '🛂',
    'ai_tech': '🤖',
    'property': '🏠',
    'lifestyle': '🌴',
    'safety': '🛡️',
    'tax_legal': '⚖️'
}

# ANSI color codes for terminal output
class Colors:
    """Terminal color codes"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def get_category_icon(category: str) -> str:
    """Get emoji icon for category"""
    return CATEGORY_ICONS.get(category.lower(), '📄')

def get_colored_bar(filled: int, total: int, length: int = 10) -> str:
    """Generate colored progress bar

    Args:
        filled: Number of filled positions
        total: Total positions
        length: Bar length (default: 10)

    Returns:
        Colored progress bar string
    """
    if total == 0:
        return '░' * length

    pct = (filled / total) * 100
    filled_len = int(length * filled / total)
    empty_len = length - filled_len

    # Color based on percentage
    if pct >= 80:
        color = Colors.GREEN
    elif pct >= 50:
        color = Colors.YELLOW
    else:
        color = Colors.RED

    return f"{color}{'█' * filled_len}{'░' * empty_len}{Colors.RESET}"


def setup_rotating_logger(name: str = 'intel_scraping', max_bytes: int = 10*1024*1024, backup_count: int = 5) -> logging.Logger:
    """Setup rotating file logger

    Args:
        name: Logger name
        max_bytes: Max log file size (default: 10MB)
        backup_count: Number of backup files to keep (default: 5)

    Returns:
        Configured logger instance
    """
    # Create logs directory if needed
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    # Create logger
    log = logging.getLogger(name)
    log.setLevel(logging.INFO)

    # Avoid duplicate handlers
    if log.handlers:
        return log

    # Rotating file handler
    log_file = LOGS_DIR / f"{name}.log"
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # Add handlers
    log.addHandler(file_handler)
    log.addHandler(console_handler)

    return log


def log_performance_metrics(run_date: str, category: str, duration: float, articles: int, quality_score: float) -> None:
    """Log performance metrics to CSV file

    Args:
        run_date: Date of the run (YYYY-MM-DD)
        category: Category name
        duration: Duration in seconds
        articles: Number of articles processed
        quality_score: Quality score (0.0-1.0)
    """
    metrics_file = DATA_DIR / "performance.csv"

    # Check if file exists to determine if we need to write header
    write_header = not metrics_file.exists()

    # Append to CSV
    try:
        import csv
        with open(metrics_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow(['date', 'category', 'duration_s', 'articles', 'quality_score'])
            writer.writerow([run_date, category, f"{duration:.2f}", articles, f"{quality_score:.3f}"])
    except Exception as e:
        logger.warning(f"Could not log performance metrics: {e}")


def validate_config(verbose: bool = True) -> bool:
    """Validate Intel Scraping configuration

    Performs quick sanity checks:
    - Directory structure exists
    - Source files are present
    - Required directories are writable

    Args:
        verbose: Print validation messages (default: True)

    Returns:
        True if all checks pass, False otherwise
    """
    checks_passed = True

    # Check 1: config/sources/ directory exists
    if not SOURCES_DIR.exists():
        if verbose:
            logger.error(f"❌ Missing directory: {SOURCES_DIR}")
        checks_passed = False
    elif verbose:
        logger.info(f"✅ Found config directory: {SOURCES_DIR}")

    # Check 2: At least one source file exists
    if SOURCES_DIR.exists():
        source_files = list(SOURCES_DIR.glob("*.txt"))
        if len(source_files) == 0:
            if verbose:
                logger.error(f"❌ No source files (*.txt) found in {SOURCES_DIR}")
            checks_passed = False
        elif verbose:
            logger.info(f"✅ Found {len(source_files)} source files")

    # Check 3: data/ directory exists and is writable
    if not DATA_DIR.exists():
        if verbose:
            logger.warning(f"⚠️  Creating data directory: {DATA_DIR}")
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            if verbose:
                logger.info(f"✅ Created data directory")
        except Exception as e:
            if verbose:
                logger.error(f"❌ Cannot create data directory: {e}")
            checks_passed = False
    elif verbose:
        logger.info(f"✅ Data directory exists: {DATA_DIR}")

    # Check 4: logs/ directory exists
    if not LOGS_DIR.exists():
        if verbose:
            logger.warning(f"⚠️  Creating logs directory: {LOGS_DIR}")
        try:
            LOGS_DIR.mkdir(parents=True, exist_ok=True)
            if verbose:
                logger.info(f"✅ Created logs directory")
        except Exception as e:
            if verbose:
                logger.error(f"❌ Cannot create logs directory: {e}")
            checks_passed = False
    elif verbose:
        logger.info(f"✅ Logs directory exists: {LOGS_DIR}")

    # Check 5: Required subdirectories
    required_subdirs = ['raw', 'processed', 'chromadb']
    for subdir in required_subdirs:
        subdir_path = DATA_DIR / subdir
        if not subdir_path.exists():
            if verbose:
                logger.info(f"ℹ️  Creating {subdir} directory: {subdir_path}")
            try:
                subdir_path.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                if verbose:
                    logger.error(f"❌ Cannot create {subdir} directory: {e}")
                checks_passed = False

    if verbose:
        if checks_passed:
            logger.info(f"{Colors.GREEN}✅ Configuration validation passed{Colors.RESET}")
        else:
            logger.error(f"{Colors.RED}❌ Configuration validation failed{Colors.RESET}")

    return checks_passed
