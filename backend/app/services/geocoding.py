import logging
import re
import time

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
CACHE_TTL_SECONDS = 3600  # 1 hour


class GeocodingService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._search_cache: dict[str, tuple[float, list[dict]]] = {}
        self._reverse_cache: dict[str, tuple[float, dict | None]] = {}

    def _get_cached_search(self, key: str) -> list[dict] | None:
        if key in self._search_cache:
            ts, results = self._search_cache[key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return results
            del self._search_cache[key]
        return None

    def _get_cached_reverse(self, key: str) -> tuple[bool, dict | None]:
        """Returns (found, result). found=False means cache miss."""
        if key in self._reverse_cache:
            ts, result = self._reverse_cache[key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return True, result
            del self._reverse_cache[key]
        return False, None

    async def _get_client(self) -> tuple[httpx.AsyncClient, bool]:
        if self._client is not None:
            return self._client, False
        client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
        )
        return client, True

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        if not query or not query.strip():
            return []

        cache_key = f"{query.strip().lower()}:{limit}"
        cached = self._get_cached_search(cache_key)
        if cached is not None:
            return cached

        client, owns_client = await self._get_client()
        try:
            response = await client.post(
                GOOGLE_PLACES_URL,
                json={"textQuery": query.strip(), "pageSize": limit},
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location",
                },
            )
            response.raise_for_status()
            data = response.json()
            places = data.get("places", [])
            results = [_parse_places_result(p) for p in places]
        except Exception:
            logger.exception("Google Places search failed for query=%s", query)
            return []
        finally:
            if owns_client:
                await client.aclose()

        self._search_cache[cache_key] = (time.monotonic(), results)
        return results

    async def reverse(self, lat: float, lon: float) -> dict | None:
        cache_key = f"{lat:.4f},{lon:.4f}"
        found, cached = self._get_cached_reverse(cache_key)
        if found:
            return cached

        client, owns_client = await self._get_client()
        try:
            response = await client.get(
                GOOGLE_GEOCODE_URL,
                params={
                    "latlng": f"{lat},{lon}",
                    "key": settings.GOOGLE_MAPS_API_KEY,
                    "language": "de",
                },
            )
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])
            if not results:
                result = None
            else:
                result = _parse_geocode_result(results[0])
        except Exception:
            logger.exception(
                "Google Geocoding reverse failed for lat=%s, lon=%s", lat, lon
            )
            return None
        finally:
            if owns_client:
                await client.aclose()

        self._reverse_cache[cache_key] = (time.monotonic(), result)
        return result


# Google sometimes returns truncated postal-code prefixes (e.g. "45 Essen, Germany")
# at the start of formattedAddress.  Strip a leading bare 1-5 digit number.
_LEADING_POSTAL_RE = re.compile(r"^\d{1,5}\s+")


def _clean_formatted_address(address: str) -> str:
    return _LEADING_POSTAL_RE.sub("", address)


def _parse_places_result(place: dict) -> dict:
    """Parse a Google Places (New) searchText result into our location format."""
    location = place.get("location", {})
    display_name = place.get("displayName", {}).get("text", "")
    formatted = _clean_formatted_address(place.get("formattedAddress", display_name))
    short = display_name or formatted.split(",")[0].strip()
    return {
        "id": place.get("id", ""),
        "displayText": formatted,
        "shortText": short,
        "lat": float(location.get("latitude", 0)),
        "lon": float(location.get("longitude", 0)),
    }


def _parse_geocode_result(result: dict) -> dict:
    """Parse a Google Geocoding API reverse result."""
    formatted = _clean_formatted_address(result.get("formatted_address", ""))
    parts = formatted.split(",")
    short = ", ".join(p.strip() for p in parts[:2])
    location = result.get("geometry", {}).get("location", {})
    return {
        "id": result.get("place_id", ""),
        "displayText": formatted,
        "shortText": short,
        "lat": float(location.get("lat", 0)),
        "lon": float(location.get("lng", 0)),
    }


# Module-level singleton (used by route handlers)
geocoding_service = GeocodingService()
