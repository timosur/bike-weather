import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.headless_auth import HeadlessAuthError, headless_login, headless_register

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """Authenticate with email and password, returning OIDC tokens."""
    try:
        tokens = await headless_login(body.email, body.password)
    except HeadlessAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    return TokenResponse(
        access_token=tokens["access_token"],
        id_token=tokens["id_token"],
        token_type=tokens.get("token_type", "Bearer"),
        expires_in=tokens.get("expires_in", 3600),
        scope=tokens.get("scope", "openid profile email"),
    )


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest) -> TokenResponse:
    """Create a new account and return OIDC tokens."""
    try:
        tokens = await headless_register(body.email, body.password, body.name)
    except HeadlessAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return TokenResponse(
        access_token=tokens["access_token"],
        id_token=tokens["id_token"],
        token_type=tokens.get("token_type", "Bearer"),
        expires_in=tokens.get("expires_in", 3600),
        scope=tokens.get("scope", "openid profile email"),
    )
