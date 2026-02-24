from unittest.mock import patch

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import _find_or_create_user
from app.models.user import User
from app.services.auth import AuthenticationError, TokenClaims


async def test_get_current_user_valid_token_creates_and_returns_user(
    db_session: AsyncSession,
) -> None:
    claims = TokenClaims(
        sub="auth|new-user",
        email="new@example.com",
        name="New User",
        email_verified=True,
    )
    user = await _find_or_create_user(claims, db_session)

    assert user.external_id == "auth|new-user"
    assert user.email == "new@example.com"
    assert user.name == "New User"
    assert user.id is not None


async def test_get_current_user_invalid_token_raises_401(
    async_client: pytest.fixture,
) -> None:
    with patch(
        "app.api.dependencies.auth_service.validate_token",
        side_effect=AuthenticationError("Token validation failed"),
    ):
        response = await async_client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer bad-token"},
        )
        assert response.status_code == 401


async def test_jit_provisioning_no_duplicate(db_session: AsyncSession) -> None:
    claims = TokenClaims(
        sub="auth|dup-test",
        email="dup@example.com",
        name="Dup User",
        email_verified=True,
    )
    user1 = await _find_or_create_user(claims, db_session)
    user2 = await _find_or_create_user(claims, db_session)

    assert user1.id == user2.id

    # Verify only one row exists
    result = await db_session.execute(
        select(User).where(User.external_id == "auth|dup-test")
    )
    users = result.scalars().all()
    assert len(users) == 1


async def test_jit_provisioning_syncs_profile(db_session: AsyncSession) -> None:
    claims = TokenClaims(
        sub="auth|sync-test",
        email="old@example.com",
        name="Old Name",
        email_verified=True,
    )
    user = await _find_or_create_user(claims, db_session)
    assert user.email == "old@example.com"

    updated_claims = TokenClaims(
        sub="auth|sync-test",
        email="new@example.com",
        name="New Name",
        email_verified=True,
    )
    user = await _find_or_create_user(updated_claims, db_session)
    assert user.email == "new@example.com"
    assert user.name == "New Name"
