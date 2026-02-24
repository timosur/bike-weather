from unittest.mock import patch

import pytest
from httpx import AsyncClient

from app.models.user import User
from app.services.auth import AuthenticationError


async def test_me_returns_user_profile(
    authenticated_client: AsyncClient, create_test_user: User
) -> None:
    response = await authenticated_client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["is_admin"] is False
    assert data["id"] == create_test_user.id


async def test_me_without_token_returns_401(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/auth/me")
    assert response.status_code in (401, 403)


async def test_me_with_invalid_token_returns_401(async_client: AsyncClient) -> None:
    with patch(
        "app.api.dependencies.auth_service.validate_token",
        side_effect=AuthenticationError("Token validation failed"),
    ):
        response = await async_client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401
