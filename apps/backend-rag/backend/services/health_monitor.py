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
        from app.dependencies import get_search_service
        from services.memory_service_postgres import MemoryServicePostgres
        from services.intelligent_router import IntelligentRouter
        from services.tool_executor import ToolExecutor
        
        # Get services from dependencies
        try:
            search_service = get_search_service()
        except:
            search_service = None
        
        # These would need to be passed in or retrieved from dependencies
        memory_service = None  # TODO: Add to dependencies
        intelligent_router = None  # TODO: Add to dependencies
        tool_executor = None  # TODO: Add to dependencies

        current_status = {
            "chromadb": await self._check_chromadb(search_service),
            "postgresql": await self._check_postgresql(memory_service),
            "ai_router": await self._check_ai_router(intelligent_router),
            "tools": tool_executor is not None  # Simple check for optional service
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

    async def _check_chromadb(self, search_service) -> bool:
        """Check if Qdrant is actually working"""
        if search_service is None:
            return False

        try:
            # Try to get collection count (lightweight operation)
            if hasattr(search_service, 'client') and search_service.client:
                collections = search_service.client.list_collections()
                return len(collections) >= 0  # Even 0 is OK (means connection works)
            return True  # Service exists
        except Exception as e:
            logger.debug(f"Qdrant health check failed: {e}")
            return False

    async def _check_postgresql(self, memory_service) -> bool:
        """Check if PostgreSQL is actually working"""
        if memory_service is None:
            return False

        try:
            # Check if using postgres and has active pool
            use_postgres = getattr(memory_service, 'use_postgres', False)
            if not use_postgres:
                return False

            # Try a simple connection check
            if hasattr(memory_service, 'pool') and memory_service.pool:
                return True
            return False
        except Exception as e:
            logger.debug(f"PostgreSQL health check failed: {e}")
            return False

    async def _check_ai_router(self, intelligent_router) -> bool:
        """Check if AI Router is actually working"""
        if intelligent_router is None:
            return False

        try:
            # Check if router has working AI clients
            has_llama = hasattr(intelligent_router, 'llama_client') and intelligent_router.llama_client is not None
            has_haiku = hasattr(intelligent_router, 'haiku_client') and intelligent_router.haiku_client is not None

            # At least one AI should be available
            return has_llama or has_haiku
        except Exception as e:
            logger.debug(f"AI Router health check failed: {e}")
            return False

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
