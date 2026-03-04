import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import api_router
from app.config import settings
from app.database import async_session, engine
from app.middleware.locale import LocaleMiddleware
from app.rate_limit import limiter
from app.seed import run_seed
from app.telemetry import init_telemetry

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_telemetry()
    try:
        async with async_session() as session:
            await run_seed(session)
            logger.info("Seed data loaded successfully.")
    except Exception:
        logger.exception("Failed to run seed on startup — database may not be ready.")
    yield
    await engine.dispose()


app = FastAPI(title="Bike Weather API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(LocaleMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
