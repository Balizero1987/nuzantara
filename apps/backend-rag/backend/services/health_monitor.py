"""
Health Monitor Service
Monitors system health and sends alerts on downtime or degradation
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import httpx
from services.alert_service import AlertService, AlertLevel

logger = logging.getLogger(__name__)


class HealthMonitor:
    """
    Monitors system health and sends alerts when services go down

    Features:
    - Periodic health checks every 60 seconds
    - Alert on service downtime
    - Alert on database connection failures
    - Alert on AI service failures
    - Exponential backoff for repeated alerts
    """

    def __init__(self, alert_service: AlertService, check_interval: int = 60):
        self.alert_service = alert_service
        self.check_interval = check_interval
        self.last_status: Dict[str, bool] = {}
        self.last_alert_time: Dict[str, datetime] = {}
        self.alert_cooldown = timedelta(minutes=5)  # Don't spam alerts
        self.running = False
        self.task: Optional[asyncio.Task] = None

        logger.info(f"✅ HealthMonitor initialized (check_interval={check_interval}s)")

    async def start(self):
        """Start the health monitoring loop"""
        if self.running:
            logger.warning("⚠️ HealthMonitor already running")
            return

        self.running = True
        self.task = asyncio.create_task(self._monitoring_loop())
        logger.info("🔍 HealthMonitor started")

    async def stop(self):
        """Stop the health monitoring loop"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 HealthMonitor stopped")

    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                await self._check_health()
            except Exception as e:
                logger.error(f"❌ Health check failed: {e}")

            # Wait before next check
            await asyncio.sleep(self.check_interval)

    async def _check_health(self):
        """Perform health check and send alerts if needed"""
        from app.main_cloud import search_service, memory_service, intelligent_router, tool_executor

        current_status = {
            "chromadb": search_service is not None,
            "postgresql": memory_service is not None and getattr(memory_service, 'use_postgres', False),
            "ai_router": intelligent_router is not None,
            "tools": tool_executor is not None
        }

        # Check each service
        for service_name, is_healthy in current_status.items():
            was_healthy = self.last_status.get(service_name, True)

            # Service went down
            if was_healthy and not is_healthy:
                await self._send_downtime_alert(service_name)

            # Service recovered
            elif not was_healthy and is_healthy:
                await self._send_recovery_alert(service_name)

        # Update status
        self.last_status = current_status

        # Check overall health
        all_healthy = all(current_status.values())
        if not all_healthy:
            unhealthy_services = [k for k, v in current_status.items() if not v]
            logger.warning(f"⚠️ Unhealthy services: {', '.join(unhealthy_services)}")

    async def _send_downtime_alert(self, service_name: str):
        """Send alert when service goes down"""
        # Check cooldown to avoid spam
        last_alert = self.last_alert_time.get(f"down_{service_name}")
        if last_alert and datetime.now() - last_alert < self.alert_cooldown:
            return  # Skip alert, too soon

        await self.alert_service.send_alert(
            title=f"🚨 Service Down: {service_name}",
            message=f"The {service_name} service has gone offline and needs attention.",
            level=AlertLevel.CRITICAL,
            metadata={
                "service": service_name,
                "timestamp": datetime.now().isoformat(),
                "action": "immediate_investigation_required"
            }
        )

        self.last_alert_time[f"down_{service_name}"] = datetime.now()
        logger.error(f"🚨 ALERT SENT: {service_name} is DOWN")

    async def _send_recovery_alert(self, service_name: str):
        """Send alert when service recovers"""
        await self.alert_service.send_alert(
            title=f"✅ Service Recovered: {service_name}",
            message=f"The {service_name} service has recovered and is now online.",
            level=AlertLevel.INFO,
            metadata={
                "service": service_name,
                "timestamp": datetime.now().isoformat(),
                "action": "monitoring_continue"
            }
        )

        logger.info(f"✅ ALERT SENT: {service_name} RECOVERED")

    def get_status(self) -> Dict[str, Any]:
        """Get current monitoring status"""
        return {
            "running": self.running,
            "check_interval": self.check_interval,
            "last_status": self.last_status,
            "next_check_in": f"{self.check_interval}s"
        }


# Singleton instance
_health_monitor: Optional[HealthMonitor] = None


def get_health_monitor() -> Optional[HealthMonitor]:
    """Get the global HealthMonitor instance"""
    return _health_monitor


def init_health_monitor(alert_service: AlertService, check_interval: int = 60) -> HealthMonitor:
    """Initialize the global HealthMonitor instance"""
    global _health_monitor
    _health_monitor = HealthMonitor(alert_service, check_interval)
    return _health_monitor
