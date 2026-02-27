import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, _find_or_create_user
from app.database import get_session
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import auth_service
from app.services.headless_auth import (
    HeadlessAuthError,
    headless_change_password,
    headless_login,
    headless_recovery_complete,
    headless_recovery_start,
    headless_register,
)
from app.services.turnstile import verify_turnstile

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
@limiter.limit("10/minute")
async def login(
    body: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Authenticate with username and password, returning OIDC tokens."""
    await verify_turnstile(body.captcha_token, get_remote_address(request))
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
@limiter.limit("5/minute")
async def register(
    body: RegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    """Create a new account and return OIDC tokens."""
    await verify_turnstile(body.captcha_token, get_remote_address(request))
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


@router.post("/change-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
) -> MessageResponse:
    """Change password for the authenticated user."""
    try:
        await headless_change_password(
            user.email, body.current_password, body.new_password
        )
    except HeadlessAuthError as exc:
        msg = str(exc)
        if "incorrect" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=msg,
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        ) from exc
    return MessageResponse(message="Password has been changed successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
) -> MessageResponse:
    """Initiate password recovery – always returns 200 to avoid user enumeration."""
    if body.captcha_token:
        await verify_turnstile(body.captcha_token, get_remote_address(request))
    try:
        await headless_recovery_start(body.email)
    except HeadlessAuthError:
        logger.info("Recovery start failed for %s (may not exist)", body.email)
    return MessageResponse(
        message="If an account with that email exists, a recovery link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    body: ResetPasswordRequest,
    request: Request,
) -> MessageResponse:
    """Complete password recovery using the token from the email link."""
    try:
        await headless_recovery_complete(body.token, body.password)
    except HeadlessAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return MessageResponse(message="Password has been reset successfully.")
