from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.user import User
from app.services.auth import AuthenticationError, TokenClaims, auth_service

_bearer_scheme = HTTPBearer()
_bearer_scheme_optional = HTTPBearer(auto_error=False)


async def _find_or_create_user(claims: TokenClaims, session: AsyncSession) -> User:
    result = await session.execute(
        select(User).where(User.external_id == claims.sub)
    )
    user = result.scalars().first()
    if user is None:
        user = User(
            external_id=claims.sub,
            email=claims.email,
            name=claims.name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        changed = False
        if user.email != claims.email:
            user.email = claims.email
            changed = True
        if user.name != claims.name:
            user.name = claims.name
            changed = True
        if changed:
            await session.commit()
            await session.refresh(user)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        claims = auth_service.validate_token(credentials.credentials)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    return await _find_or_create_user(claims, session)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme_optional),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    if credentials is None:
        return None
    try:
        claims = auth_service.validate_token(credentials.credentials)
    except AuthenticationError:
        return None
    return await _find_or_create_user(claims, session)
