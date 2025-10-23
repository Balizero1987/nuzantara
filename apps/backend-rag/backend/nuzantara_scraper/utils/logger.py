"""Logging utilities"""

from loguru import logger
import sys


def setup_logger(
    log_file: str = "scraper.log",
    level: str = "INFO",
    rotation: str = "1 day"
):
    """
    Setup unified logger configuration

    Args:
        log_file: Log file path
        level: Log level
        rotation: Log rotation period
    """
    # Remove default handler
    logger.remove()

    # Console handler
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=level
    )

    # File handler
    logger.add(
        log_file,
        rotation=rotation,
        retention="7 days",
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
    )

    return logger
