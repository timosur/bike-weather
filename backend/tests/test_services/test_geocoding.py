import asyncio
import time

import httpx
import pytest

from app.services.geocoding import GeocodingService

MOCK_SEARCH_RESPONSE = [
    {
        "place_id": 12345,
        "display_name": "Berlin, Germany",
        "lat": "52.5200",
        "lon": "13.4050",
        "address": {"city": "Berlin", "country": "Germany"},
    },
    {
        "place_id": 67890,
        "display_name": "Berlin, New Hampshire, United States",
        "lat": "44.4688",
        "lon": "-71.1854",
        "address": {"city": "Berlin", "state": "New Hampshire", "country": "United States"},
    },
]

MOCK_REVERSE_RESPONSE = {
    "place_id": 12345,
    "display_name": "Alexanderplatz, Mitte, Berlin, 10178, Germany",
    "lat": "52.5219",
    "lon": "13.4132",
    "address": {"city": "Berlin", "country": "Germany"},
}


def _mock_transport(response_data, status_code: int = 200):
    """Create a mock transport that returns the given JSON data."""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json=response_data)

    return httpx.MockTransport(handler)


async def test_search_returns_parsed_suggestions() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_SEARCH_RESPONSE))
    service = GeocodingService(client=client)

    results = await service.search("Berlin")
    assert len(results) == 2
    assert results[0]["id"] == "12345"
    assert results[0]["displayText"] == "Berlin, Germany"
    assert results[0]["shortText"] == "Berlin, Germany"
    assert results[0]["lat"] == 52.52
    assert results[0]["lon"] == 13.405


async def test_search_empty_query_returns_empty() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_SEARCH_RESPONSE))
    service = GeocodingService(client=client)

    assert await service.search("") == []
    assert await service.search("   ") == []


async def test_search_nominatim_error_returns_empty() -> None:
    client = httpx.AsyncClient(transport=_mock_transport({"error": "server error"}, status_code=500))
    service = GeocodingService(client=client)

    results = await service.search("Berlin")
    assert results == []


async def test_search_respects_limit() -> None:
    requests_made: list[httpx.Request] = []

    async def capture_handler(request: httpx.Request) -> httpx.Response:
        requests_made.append(request)
        return httpx.Response(200, json=MOCK_SEARCH_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(capture_handler))
    service = GeocodingService(client=client)

    await service.search("Berlin", limit=3)
    assert len(requests_made) == 1
    assert "limit=3" in str(requests_made[0].url)


async def test_reverse_returns_location() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_REVERSE_RESPONSE))
    service = GeocodingService(client=client)

    result = await service.reverse(52.5219, 13.4132)
    assert result is not None
    assert result["id"] == "12345"
    assert result["displayText"] == "Alexanderplatz, Mitte, Berlin, 10178, Germany"
    assert result["shortText"] == "Alexanderplatz, Mitte"
    assert result["lat"] == 52.5219
    assert result["lon"] == 13.4132


async def test_throttle_delays_concurrent_requests() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_SEARCH_RESPONSE))
    service = GeocodingService(client=client)

    start = time.monotonic()
    await service.search("Berlin")
    await service.search("Hamburg")
    elapsed = time.monotonic() - start

    # Second request should be delayed by ~1s due to throttle
    assert elapsed >= 0.9
