import time

import httpx
import pytest

from app.services.geocoding import GeocodingService

MOCK_PLACES_RESPONSE = {
    "places": [
        {
            "id": "ChIJAVkDPzdOqEcRcDteW0YgIQQ",
            "displayName": {"text": "Berlin", "languageCode": "en"},
            "formattedAddress": "Berlin, Germany",
            "shortFormattedAddress": "Berlin, Germany",
            "location": {"latitude": 52.52, "longitude": 13.405},
        },
        {
            "id": "ChIJ1ScKoSlJtEwRMHGKYB-bEDk",
            "displayName": {"text": "Berlin", "languageCode": "en"},
            "formattedAddress": "Berlin, New Hampshire, United States",
            "shortFormattedAddress": "Berlin, NH",
            "location": {"latitude": 44.4688, "longitude": -71.1854},
        },
    ]
}

MOCK_GEOCODE_RESPONSE = {
    "results": [
        {
            "place_id": "ChIJAVkDPzdOqEcRcDteW0YgIQQ",
            "formatted_address": "Alexanderplatz, Mitte, Berlin, 10178, Germany",
            "geometry": {"location": {"lat": 52.5219, "lng": 13.4132}},
        }
    ],
    "status": "OK",
}


def _mock_transport(response_data, status_code: int = 200):
    """Create a mock transport that returns the given JSON data."""

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json=response_data)

    return httpx.MockTransport(handler)


async def test_search_returns_parsed_suggestions() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_PLACES_RESPONSE))
    service = GeocodingService(client=client)

    results = await service.search("Berlin")
    assert len(results) == 2
    assert results[0]["id"] == "ChIJAVkDPzdOqEcRcDteW0YgIQQ"
    assert results[0]["displayText"] == "Berlin, Germany"
    assert results[0]["shortText"] == "Berlin"
    assert results[0]["lat"] == 52.52
    assert results[0]["lon"] == 13.405


async def test_search_empty_query_returns_empty() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_PLACES_RESPONSE))
    service = GeocodingService(client=client)

    assert await service.search("") == []
    assert await service.search("   ") == []


async def test_search_google_error_returns_empty() -> None:
    client = httpx.AsyncClient(
        transport=_mock_transport({"error": "server error"}, status_code=500)
    )
    service = GeocodingService(client=client)

    results = await service.search("Berlin")
    assert results == []


async def test_search_respects_limit() -> None:
    requests_made: list[httpx.Request] = []

    async def capture_handler(request: httpx.Request) -> httpx.Response:
        requests_made.append(request)
        return httpx.Response(200, json=MOCK_PLACES_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(capture_handler))
    service = GeocodingService(client=client)

    await service.search("Berlin", limit=3)
    assert len(requests_made) == 1
    # Google Places uses pageSize in the JSON body
    import json

    body = json.loads(requests_made[0].content)
    assert body["pageSize"] == 3


async def test_reverse_returns_location() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(MOCK_GEOCODE_RESPONSE))
    service = GeocodingService(client=client)

    result = await service.reverse(52.5219, 13.4132)
    assert result is not None
    assert result["id"] == "ChIJAVkDPzdOqEcRcDteW0YgIQQ"
    assert result["displayText"] == "Alexanderplatz, Mitte, Berlin, 10178, Germany"
    assert result["shortText"] == "Alexanderplatz, Mitte"
    assert result["lat"] == 52.5219
    assert result["lon"] == 13.4132


async def test_search_cache_prevents_duplicate_requests() -> None:
    call_count = 0

    async def counting_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=MOCK_PLACES_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(counting_handler))
    service = GeocodingService(client=client)

    await service.search("Berlin")
    await service.search("Berlin")
    assert call_count == 1  # Second call should use cache


async def test_reverse_cache_prevents_duplicate_requests() -> None:
    call_count = 0

    async def counting_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=MOCK_GEOCODE_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(counting_handler))
    service = GeocodingService(client=client)

    await service.reverse(52.5219, 13.4132)
    await service.reverse(52.5219, 13.4132)
    assert call_count == 1  # Second call should use cache


async def test_search_strips_truncated_postal_code() -> None:
    """Google sometimes returns e.g. '45 Essen, Germany' — the leading '45' should be stripped."""
    places_response = {
        "places": [
            {
                "id": "ChIJOfarlrfCuEcRnSytpBHhAGo",
                "displayName": {"text": "Essen", "languageCode": "de"},
                "formattedAddress": "45 Essen, Germany",
                "location": {"latitude": 51.4576, "longitude": 7.0225},
            }
        ]
    }
    client = httpx.AsyncClient(transport=_mock_transport(places_response))
    service = GeocodingService(client=client)

    results = await service.search("Essen")
    assert len(results) == 1
    assert results[0]["displayText"] == "Essen, Germany"
    assert results[0]["shortText"] == "Essen"
