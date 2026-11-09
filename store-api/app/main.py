from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

import db
from app.clock import Clock
from app.config import settings
from app.errors import (
    AppException,
    UpstreamUnavailableException,
    app_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.middleware import RequestIdLoggingMiddleware


class ClockResponse(BaseModel):
    now_utc: str
    mode: str


class HealthzResponse(BaseModel):
    status: str


class ReadyzResponse(BaseModel):
    status: str
    database: str
    clock: str

app = FastAPI(
    title="NestKart Store API",
    version="0.1.0",
    description="NestKart Playground Store API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID and logging middleware
app.add_middleware(RequestIdLoggingMiddleware)

# Custom Error Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.get("/healthz", summary="Liveness check", tags=["System"], response_model=HealthzResponse)
def healthz() -> HealthzResponse:
    return HealthzResponse(status="ok")


@app.get("/readyz", summary="Readiness check", tags=["System"], response_model=ReadyzResponse)
def readyz() -> ReadyzResponse:
    # Check database
    try:
        with db.engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        db_status = "ok"
    except Exception as e:
        raise UpstreamUnavailableException(message=f"Database check failed: {e}")

    # Check clock
    try:
        _ = Clock.now()
        clock_status = "ok"
    except Exception as e:
        raise UpstreamUnavailableException(message=f"Clock check failed: {e}")

    return ReadyzResponse(
        status="ready",
        database=db_status,
        clock=clock_status,
    )


@app.get(
    "/api/v1/clock",
    summary="Current store time",
    tags=["Clock"],
    response_model=ClockResponse,
)
def get_clock() -> ClockResponse:
    info = Clock.get_info()
    return ClockResponse(now_utc=info["now_utc"], mode=info["mode"])
