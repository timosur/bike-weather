"""Admin routes that proxy to the agent microservice."""

import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin, _find_or_create_user
from app.config import settings
from app.database import get_session
from app.models.user import User
from app.schemas.product import BulkProductItem, BulkProductResponse
from app.services.auth import AuthenticationError, auth_service

# Re-use the bulk import logic from the products route inline
from app.api.routes.admin.products import bulk_import_products as _bulk_import

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["admin-agent"])

AGENT_TIMEOUT = 10.0


async def _agent_get(path: str) -> dict | list:
    """GET from the agent service."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=AGENT_TIMEOUT) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Agent service is unavailable")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.text,
            )


async def _agent_post(path: str, payload: dict) -> dict:
    """POST to the agent service."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=AGENT_TIMEOUT) as client:
        try:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Agent service is unavailable")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.text,
            )


# --- Proxied endpoints ---


@router.get("/shops")
async def get_agent_shops(
    _admin: User = Depends(require_admin),
) -> list:
    return await _agent_get("/shops")


@router.get("/categories")
async def get_agent_categories(
    _admin: User = Depends(require_admin),
) -> list:
    return await _agent_get("/categories")


class StartJobRequest(BaseModel):
    shop: str
    category: str
    maxProducts: int = Field(default=5, ge=1, le=50)


@router.post("/jobs")
async def start_agent_job(
    request: StartJobRequest,
    _admin: User = Depends(require_admin),
) -> dict:
    return await _agent_post("/jobs", request.model_dump())


@router.get("/jobs/{job_id}")
async def get_agent_job(
    job_id: str,
    _admin: User = Depends(require_admin),
) -> dict:
    return await _agent_get(f"/jobs/{job_id}")


async def _require_admin_from_token(
    token: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> User:
    """Validate admin from a query-string token (for SSE endpoints where
    the browser's EventSource API cannot send Authorization headers)."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        claims = auth_service.validate_token(token)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    user = await _find_or_create_user(claims, session)
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


@router.get("/jobs/{job_id}/stream")
async def stream_agent_job(
    job_id: str,
    _admin: User = Depends(_require_admin_from_token),
) -> StreamingResponse:
    """Proxy SSE stream from the agent service to the frontend."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}/jobs/{job_id}/stream"

    async def event_proxy():
        async with httpx.AsyncClient(timeout=None) as client:
            try:
                async with client.stream("GET", url) as response:
                    if response.status_code != 200:
                        return
                    async for line in response.aiter_lines():
                        yield line + "\n"
            except httpx.ConnectError:
                yield 'event: error\ndata: {"message": "Agent service unavailable"}\n\n'

    return StreamingResponse(
        event_proxy(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class ApproveImportRequest(BaseModel):
    products: list[BulkProductItem]
    categoryId: str
    shopId: str
    replaceCategory: bool = True


@router.post("/jobs/{job_id}/approve", response_model=BulkProductResponse)
async def approve_agent_import(
    job_id: str,
    request: ApproveImportRequest,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> BulkProductResponse:
    """Approve and publish products extracted by the agent.

    This reuses the existing bulk import logic directly — no HTTP round-trip.
    """
    replace_cat = request.categoryId if request.replaceCategory else None
    return await _bulk_import(
        items=request.products,
        replace_category=replace_cat,
        _admin=admin,
        session=session,
    )
