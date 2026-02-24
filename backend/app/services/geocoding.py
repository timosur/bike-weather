import asyncio
import logging
import time

import httpx

logger = logging.getLogger(__name__)

NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
USER_AGENT = "BikeWeather/1.0 (https://fahrrad-wetter.de)"


class GeocodingService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._lock = asyncio.Lock()
        self._last_request_time: float = 0.0

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is not None:
            return self._client
        # Fallback: create a one-off client (caller should prefer injecting one)
        return httpx.AsyncClient(timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0))

    async def _throttle(self) -> None:
        """Ensure at least 1 second between Nominatim requests (server-global)."""
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            self._last_request_time = time.monotonic()

    async def search(self, query: str, limit: int = 5) -> list[dict]:
        if not query or not query.strip():
            return []

        await self._throttle()

        client = await self._get_client()
        owns_client = self._client is None
        try:
            response = await client.get(
                f"{NOMINATIM_BASE}/search",
                params={
                    "q": query,
                    "format": "json",
                    "addressdetails": "1",
                    "limit": str(limit),
                },
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept-Language": "en",
                },
            )
            response.raise_for_status()
            results = response.json()
            return [_parse_result(r) for r in results]
        except Exception:
            logger.exception("Nominatim search failed for query=%s", query)
            return []
        finally:
            if owns_client:
                await client.aclose()

    async def reverse(self, lat: float, lon: float) -> dict | None:
        await self._throttle()

        client = await self._get_client()
        owns_client = self._client is None
        try:
            response = await client.get(
                f"{NOMINATIM_BASE}/reverse",
                params={
                    "lat": str(lat),
                    "lon": str(lon),
                    "format": "json",
                    "addressdetails": "1",
                },
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept-Language": "en",
                },
            )
            response.raise_for_status()
            data = response.json()
            if "error" in data:
                return None
            return _parse_result(data)
        except Exception:
            logger.exception("Nominatim reverse failed for lat=%s, lon=%s", lat, lon)
            return None
        finally:
            if owns_client:
                await client.aclose()


def _parse_result(r: dict) -> dict:
    display_name = r.get("display_name", "")
    parts = display_name.split(",")
    short_text = ", ".join(p.strip() for p in parts[:2])
    return {
        "id": str(r.get("place_id", "")),
        "displayText": display_name,
        "shortText": short_text,
        "lat": float(r.get("lat", 0)),
        "lon": float(r.get("lon", 0)),
    }


# Module-level singleton (used by route handlers)
geocoding_service = GeocodingService()
