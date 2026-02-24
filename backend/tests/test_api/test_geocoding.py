from unittest.mock import AsyncMock, patch

from httpx import AsyncClient


MOCK_SEARCH_RESULTS = [
    {
        "id": "12345",
        "displayText": "Berlin, Germany",
        "shortText": "Berlin, Germany",
        "lat": 52.52,
        "lon": 13.405,
    }
]

MOCK_REVERSE_RESULT = {
    "id": "12345",
    "displayText": "Alexanderplatz, Mitte, Berlin, 10178, Germany",
    "shortText": "Alexanderplatz, Mitte",
    "lat": 52.5219,
    "lon": 13.4132,
}


@patch("app.api.routes.geocoding.geocoding_service")
async def test_search_endpoint_returns_suggestions(
    mock_service: AsyncMock, async_client: AsyncClient
) -> None:
    mock_service.search = AsyncMock(return_value=MOCK_SEARCH_RESULTS)

    response = await async_client.get("/api/geocoding/search", params={"q": "Berlin"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["displayText"] == "Berlin, Germany"
    mock_service.search.assert_called_once_with("Berlin", limit=5)


async def test_search_endpoint_missing_query_returns_422(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/geocoding/search")
    assert response.status_code == 422


@patch("app.api.routes.geocoding.geocoding_service")
async def test_reverse_endpoint_returns_location(
    mock_service: AsyncMock, async_client: AsyncClient
) -> None:
    mock_service.reverse = AsyncMock(return_value=MOCK_REVERSE_RESULT)

    response = await async_client.get(
        "/api/geocoding/reverse", params={"lat": "52.5219", "lon": "13.4132"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["displayText"] == "Alexanderplatz, Mitte, Berlin, 10178, Germany"
    mock_service.reverse.assert_called_once_with(52.5219, 13.4132)


async def test_reverse_endpoint_missing_params_returns_422(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/geocoding/reverse", params={"lat": "52.5"})
    assert response.status_code == 422
