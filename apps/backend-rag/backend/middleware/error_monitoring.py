"""
Error Monitoring Middleware
Captures 4xx/5xx HTTP errors and sends alerts
"""

import logging
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Callable
import time

logger = logging.getLogger(__name__)


class ErrorMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor HTTP errors and send alerts for 4xx/5xx responses
    """

    def __init__(self, app, alert_service=None):
        super().__init__(app)
        self.alert_service = alert_service
        self.enabled = alert_service is not None

        if self.enabled:
            logger.info("✅ ErrorMonitoringMiddleware initialized with AlertService")
        else:
            logger.warning("⚠️ ErrorMonitoringMiddleware initialized without AlertService (alerts disabled)")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and monitor for errors
        """
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Record start time
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Check if response is an error (4xx or 5xx)
            if response.status_code >= 400:
                await self._handle_error_response(
                    request=request,
                    response=response,
                    request_id=request_id,
                    duration_ms=duration_ms
                )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:
            # Handle unhandled exceptions
            logger.error(f"Unhandled exception in request {request_id}: {exc}")

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Send alert for server error
            if self.enabled:
                try:
                    await self.alert_service.send_http_error_alert(
                        status_code=500,
                        method=request.method,
                        path=request.url.path,
                        error_detail=str(exc),
                        request_id=request_id,
                        user_agent=request.headers.get("user-agent")
                    )
                except Exception as alert_exc:
                    logger.error(f"Failed to send alert for exception: {alert_exc}")

            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "request_id": request_id,
                    "error": str(exc) if logger.level == logging.DEBUG else "Internal server error"
                },
                headers={"X-Request-ID": request_id}
            )

    async def _handle_error_response(
        self,
        request: Request,
        response: Response,
        request_id: str,
        duration_ms: float
    ):
        """
        Handle error response (4xx/5xx)
        """
        status_code = response.status_code
        method = request.method
        path = request.url.path
        user_agent = request.headers.get("user-agent", "Unknown")

        # Log error
        logger.warning(
            f"[{request_id}] {method} {path} → {status_code} "
            f"({duration_ms:.2f}ms) | UA: {user_agent[:50]}"
        )

        # Send alert if enabled and if it's a server error (5xx) or critical client error
        if self.enabled:
            # Only alert for:
            # - All 5xx errors
            # - 429 (Too Many Requests) - potential DoS
            # - 403 (Forbidden) - potential security issue
            should_alert = (
                status_code >= 500 or
                status_code == 429 or
                status_code == 403
            )

            if should_alert:
                try:
                    # Try to extract error detail from response body
                    error_detail = None
                    try:
                        if hasattr(response, 'body'):
                            body = response.body
                            if isinstance(body, bytes):
                                import json
                                body_json = json.loads(body.decode())
                                error_detail = body_json.get("detail", body_json.get("message"))
                    except Exception:
                        pass  # Ignore body parsing errors

                    await self.alert_service.send_http_error_alert(
                        status_code=status_code,
                        method=method,
                        path=path,
                        error_detail=error_detail,
                        request_id=request_id,
                        user_agent=user_agent
                    )
                except Exception as exc:
                    logger.error(f"Failed to send error alert: {exc}")


def create_error_monitoring_middleware(alert_service=None):
    """
    Factory function to create ErrorMonitoringMiddleware

    Args:
        alert_service: Optional AlertService instance

    Returns:
        ErrorMonitoringMiddleware instance
    """
    def middleware_factory(app):
        return ErrorMonitoringMiddleware(app, alert_service)

    return middleware_factory
