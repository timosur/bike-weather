"""OpenTelemetry initialization for the bike-weather backend.

Configures tracing with OTLP export to Grafana Alloy. No-op when
OTEL_EXPORTER_OTLP_ENDPOINT is not set (safe for local dev).
"""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


def init_telemetry() -> None:
    if not settings.OTEL_EXPORTER_OTLP_ENDPOINT:
        logger.info("OTEL_EXPORTER_OTLP_ENDPOINT not set — telemetry disabled.")
        return

    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    resource = Resource.create({"service.name": settings.OTEL_SERVICE_NAME})

    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument()
    HTTPXClientInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument(enable_commenter=True)

    logger.info(
        "OpenTelemetry initialized — exporting to %s as %s",
        settings.OTEL_EXPORTER_OTLP_ENDPOINT,
        settings.OTEL_SERVICE_NAME,
    )
