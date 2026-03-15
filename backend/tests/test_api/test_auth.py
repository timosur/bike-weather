from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.models.user import User
from app.services.auth import AuthenticationError
from app.services.headless_auth import HeadlessAuthError


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


async def test_refresh_returns_new_tokens(
    async_client: AsyncClient, make_test_jwt: object
) -> None:
    id_token = make_test_jwt()  # type: ignore[operator]
    mock_tokens = {
        "access_token": "new-access",
        "id_token": id_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "openid profile email",
        "refresh_token": "new-refresh",
    }
    with (
        patch(
            "app.api.routes.auth.headless_refresh_token",
            new_callable=AsyncMock,
            return_value=mock_tokens,
        ),
        patch(
            "app.api.routes.auth.auth_service.validate_token",
        ),
        patch(
            "app.api.routes.auth._ensure_local_user",
            new_callable=AsyncMock,
        ),
    ):
        response = await async_client.post(
            "/api/auth/refresh",
            json={"refresh_token": "old-refresh-token"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "new-access"
    assert data["refresh_token"] == "new-refresh"
    assert data["expires_in"] == 3600


async def test_refresh_with_expired_token_returns_401(
    async_client: AsyncClient,
) -> None:
    with patch(
        "app.api.routes.auth.headless_refresh_token",
        new_callable=AsyncMock,
        side_effect=HeadlessAuthError("Token has been expired"),
    ):
        response = await async_client.post(
            "/api/auth/refresh",
            json={"refresh_token": "expired-token"},
        )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


async def test_refresh_without_body_returns_422(
    async_client: AsyncClient,
) -> None:
    response = await async_client.post("/api/auth/refresh", json={})
    assert response.status_code == 422
