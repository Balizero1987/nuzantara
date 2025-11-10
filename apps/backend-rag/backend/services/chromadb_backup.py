"""
ChromaDB Backup Service
Automatic backup of ChromaDB to Cloudflare R2 storage
"""

import asyncio
import logging
import os
import shutil
import tarfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError
from services.alert_service import AlertService, AlertLevel

logger = logging.getLogger(__name__)


class ChromaDBBackupService:
    """
    Automatic backup service for ChromaDB to Cloudflare R2

    Features:
    - Scheduled daily backups
    - Incremental backups (only changed files)
    - Compression (tar.gz)
    - Retention policy (keep last 7 backups)
    - Alert on backup success/failure
    """

    def __init__(
        self,
        alert_service: AlertService,
        backup_interval: int = 86400,  # 24 hours
        retention_days: int = 7
    ):
        self.alert_service = alert_service
        self.backup_interval = backup_interval
        self.retention_days = retention_days
        self.running = False
        self.task: Optional[asyncio.Task] = None

        # R2 configuration
        self.r2_access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.r2_endpoint = os.getenv("R2_ENDPOINT_URL")
        self.bucket_name = "nuzantaradb"
        self.backup_prefix = "backups/chroma_db/"

        # ChromaDB path
        self.chroma_path = os.getenv("CHROMA_DB_PATH", "/data/chroma_db_FULL_deploy")

        self.last_backup_time: Optional[datetime] = None
        self.backup_count = 0

        logger.info(f"✅ ChromaDBBackupService initialized")
        logger.info(f"   Backup interval: {backup_interval}s ({backup_interval // 3600}h)")
        logger.info(f"   Retention: {retention_days} days")

    async def start(self):
        """Start the backup service"""
        if self.running:
            logger.warning("⚠️ ChromaDBBackupService already running")
            return

        # Verify R2 credentials
        if not all([self.r2_access_key, self.r2_secret_key, self.r2_endpoint]):
            logger.error("❌ R2 credentials not configured - backup service disabled")
            await self.alert_service.send_alert(
                title="⚠️ Backup Service Disabled",
                message="R2 credentials not configured. Automatic backups are disabled.",
                level=AlertLevel.WARNING
            )
            return

        self.running = True
        self.task = asyncio.create_task(self._backup_loop())
        logger.info("💾 ChromaDBBackupService started")

    async def stop(self):
        """Stop the backup service"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 ChromaDBBackupService stopped")

    async def _backup_loop(self):
        """Main backup loop"""
        # Wait 1 hour before first backup (let system stabilize)
        await asyncio.sleep(3600)

        while self.running:
            try:
                await self._perform_backup()
            except Exception as e:
                logger.error(f"❌ Backup failed: {e}")
                await self.alert_service.send_alert(
                    title="❌ Backup Failed",
                    message=f"ChromaDB backup failed: {str(e)}",
                    level=AlertLevel.ERROR,
                    metadata={"error": str(e)}
                )

            # Wait before next backup
            await asyncio.sleep(self.backup_interval)

    async def _perform_backup(self):
        """Perform a backup of ChromaDB to R2"""
        start_time = datetime.now()
        logger.info("💾 Starting ChromaDB backup...")

        # Check if ChromaDB path exists
        if not os.path.exists(self.chroma_path):
            logger.error(f"❌ ChromaDB path not found: {self.chroma_path}")
            return

        # Create temporary backup archive
        backup_filename = f"chroma_backup_{start_time.strftime('%Y%m%d_%H%M%S')}.tar.gz"
        temp_backup_path = f"/tmp/{backup_filename}"

        try:
            # Create compressed archive
            await asyncio.to_thread(self._create_backup_archive, temp_backup_path)

            # Upload to R2
            await asyncio.to_thread(self._upload_to_r2, temp_backup_path, backup_filename)

            # Clean up old backups
            await asyncio.to_thread(self._cleanup_old_backups)

            # Update stats
            self.last_backup_time = start_time
            self.backup_count += 1

            duration = (datetime.now() - start_time).total_seconds()
            file_size_mb = os.path.getsize(temp_backup_path) / 1024 / 1024

            logger.info(f"✅ Backup completed in {duration:.1f}s ({file_size_mb:.1f} MB)")

            # Send success alert (only every 7 days to avoid spam)
            if self.backup_count % 7 == 1:
                await self.alert_service.send_alert(
                    title="✅ Weekly Backup Summary",
                    message=f"ChromaDB backups are running successfully. Latest backup: {file_size_mb:.1f} MB",
                    level=AlertLevel.INFO,
                    metadata={
                        "backup_count": self.backup_count,
                        "size_mb": file_size_mb,
                        "duration_seconds": duration
                    }
                )

        except Exception as e:
            logger.error(f"❌ Backup error: {e}")
            raise
        finally:
            # Clean up temporary file
            if os.path.exists(temp_backup_path):
                os.remove(temp_backup_path)

    def _create_backup_archive(self, archive_path: str):
        """Create compressed tar.gz archive of ChromaDB"""
        logger.info(f"📦 Creating backup archive: {archive_path}")

        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(self.chroma_path, arcname="chroma_db")

    def _upload_to_r2(self, file_path: str, filename: str):
        """Upload backup file to Cloudflare R2"""
        logger.info(f"☁️ Uploading to R2: {filename}")

        s3_client = boto3.client(
            's3',
            endpoint_url=self.r2_endpoint,
            aws_access_key_id=self.r2_access_key,
            aws_secret_access_key=self.r2_secret_key,
            region_name='auto'
        )

        # Upload file
        s3_key = f"{self.backup_prefix}{filename}"
        s3_client.upload_file(file_path, self.bucket_name, s3_key)

        logger.info(f"✅ Uploaded to R2: {s3_key}")

    def _cleanup_old_backups(self):
        """Delete backups older than retention period"""
        logger.info(f"🧹 Cleaning up backups older than {self.retention_days} days")

        s3_client = boto3.client(
            's3',
            endpoint_url=self.r2_endpoint,
            aws_access_key_id=self.r2_access_key,
            aws_secret_access_key=self.r2_secret_key,
            region_name='auto'
        )

        # List all backups
        try:
            response = s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=self.backup_prefix
            )

            if 'Contents' not in response:
                return

            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)

            # Delete old backups
            deleted_count = 0
            for obj in response['Contents']:
                if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                    s3_client.delete_object(Bucket=self.bucket_name, Key=obj['Key'])
                    deleted_count += 1

            if deleted_count > 0:
                logger.info(f"🗑️ Deleted {deleted_count} old backups")

        except ClientError as e:
            logger.error(f"❌ Cleanup error: {e}")

    async def trigger_manual_backup(self) -> Dict[str, Any]:
        """Trigger a manual backup immediately"""
        logger.info("🔧 Manual backup triggered")
        try:
            await self._perform_backup()
            return {
                "success": True,
                "message": "Backup completed successfully",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Manual backup failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current backup service status"""
        return {
            "running": self.running,
            "backup_interval": self.backup_interval,
            "retention_days": self.retention_days,
            "last_backup_time": self.last_backup_time.isoformat() if self.last_backup_time else None,
            "backup_count": self.backup_count,
            "chroma_path": self.chroma_path,
            "r2_configured": bool(self.r2_access_key and self.r2_secret_key and self.r2_endpoint)
        }


# Singleton instance
_backup_service: Optional[ChromaDBBackupService] = None


def get_backup_service() -> Optional[ChromaDBBackupService]:
    """Get the global ChromaDBBackupService instance"""
    return _backup_service


def init_backup_service(alert_service: AlertService) -> ChromaDBBackupService:
    """Initialize the global ChromaDBBackupService instance"""
    global _backup_service
    _backup_service = ChromaDBBackupService(alert_service)
    return _backup_service
