import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, _find_or_create_user
from app.database import get_session
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import auth_service
from app.services.headless_auth import (
    HeadlessAuthError,
    headless_login,
    headless_register,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _ensure_local_user(id_token: str, session: AsyncSession) -> None:
    """Validate the id_token and create/update the local user row."""
    try:
        claims = auth_service.validate_token(id_token)
        await _find_or_create_user(claims, session)
    except Exception:
        logger.warning("Could not create local user from id_token", exc_info=True)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Authenticate with username and password, returning OIDC tokens."""
    try:
        tokens = await headless_login(body.username, body.password)
    except HeadlessAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    await _ensure_local_user(tokens["id_token"], session)
    return TokenResponse(
        access_token=tokens["access_token"],
        id_token=tokens["id_token"],
        token_type=tokens.get("token_type", "Bearer"),
        expires_in=tokens.get("expires_in", 3600),
        scope=tokens.get("scope", "openid profile email"),
    )


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Create a new account and return OIDC tokens."""
    try:
        tokens = await headless_register(
            body.username, body.email, body.password, body.name
        )
    except HeadlessAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    await _ensure_local_user(tokens["id_token"], session)
    return TokenResponse(
        access_token=tokens["access_token"],
        id_token=tokens["id_token"],
        token_type=tokens.get("token_type", "Bearer"),
        expires_in=tokens.get("expires_in", 3600),
        scope=tokens.get("scope", "openid profile email"),
    )
