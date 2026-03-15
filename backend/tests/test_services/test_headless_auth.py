from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.headless_auth import HeadlessAuthError, headless_refresh_token


async def test_headless_refresh_token_success() -> None:
    mock_response = httpx.Response(
        200,
        json={
            "access_token": "new-access",
            "id_token": "new-id",
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": "openid profile email",
            "refresh_token": "new-refresh",
        },
        request=httpx.Request("POST", "http://test"),
    )
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch(
        "app.services.headless_auth.httpx.AsyncClient", return_value=mock_client
    ):
        result = await headless_refresh_token("old-refresh")

    assert result["access_token"] == "new-access"
    assert result["refresh_token"] == "new-refresh"
    mock_client.post.assert_called_once()
    call_kwargs = mock_client.post.call_args
    assert call_kwargs[1]["data"]["grant_type"] == "refresh_token"
    assert call_kwargs[1]["data"]["refresh_token"] == "old-refresh"


async def test_headless_refresh_token_expired_raises() -> None:
    mock_response = httpx.Response(
        400,
        json={
            "error": "invalid_grant",
            "error_description": "Token has been expired",
        },
    )
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch(
        "app.services.headless_auth.httpx.AsyncClient", return_value=mock_client
    ):
        with pytest.raises(HeadlessAuthError, match="expired"):
            await headless_refresh_token("expired-refresh")


async def test_headless_refresh_token_server_error_raises() -> None:
    mock_response = httpx.Response(500, request=httpx.Request("POST", "http://test"))
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.post.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)

    with patch(
        "app.services.headless_auth.httpx.AsyncClient", return_value=mock_client
    ):
        with pytest.raises(httpx.HTTPStatusError):
            await headless_refresh_token("some-refresh")
