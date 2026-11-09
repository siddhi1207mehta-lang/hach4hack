import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.logging import logger


class RequestIdLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Create request_id if missing or empty, else preserve provided header
        incoming_id = request.headers.get("X-Request-ID")
        if incoming_id and incoming_id.strip():
            request_id = incoming_id.strip()
        else:
            request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(
                f"HTTP {request.method} {request.url.path} failed",
                extra={
                    "request_id": request_id,
                    "route": request.url.path,
                    "status_code": 500,
                    "latency_ms": round(latency_ms, 2),
                },
            )
            raise

        latency_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Request-ID"] = request_id

        logger.info(
            f"HTTP {request.method} {request.url.path} {response.status_code}",
            extra={
                "request_id": request_id,
                "route": request.url.path,
                "status_code": response.status_code,
                "latency_ms": round(latency_ms, 2),
            },
        )
        return response
