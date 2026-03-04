import logging
import math
import time
import asyncio
from dataclasses import dataclass

import httpx
import polyline

logger = logging.getLogger(__name__)

OSRM_BASE_URL = "https://routing.openstreetmap.de/routed-bike/route/v1/driving"
CACHE_TTL_SECONDS = 3600  # 1 hour
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.0


@dataclass
class RouteResult:
    geometry: list[tuple[float, float]]  # List of (lat, lon)
    distance_km: float
    duration_minutes: float


class RoutingServiceError(Exception):
    pass


class RoutingService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._cache: dict[str, tuple[float, RouteResult]] = {}

    def _cache_key(
        self,
        start_lat: float,
        start_lon: float,
        dest_lat: float,
        dest_lon: float,
        waypoints: list[tuple[float, float]] | None = None,
    ) -> str:
        key = f"{start_lat:.5f},{start_lon:.5f};{dest_lat:.5f},{dest_lon:.5f}"
        if waypoints:
            wp_str = ";".join(f"{lat:.5f},{lon:.5f}" for lat, lon in waypoints)
            key += f";{wp_str}"
        return key

    def _get_cached(self, key: str) -> RouteResult | None:
        if key in self._cache:
            ts, result = self._cache[key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return result
            del self._cache[key]
        return None

    async def get_route(
        self,
        start_lat: float,
        start_lon: float,
        dest_lat: float,
        dest_lon: float,
        waypoints: list[tuple[float, float]] | None = None,
    ) -> RouteResult:
        cache_key = self._cache_key(start_lat, start_lon, dest_lat, dest_lon, waypoints)
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        client = self._client
        owns_client = False
        if client is None:
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
            )
            owns_client = True

        # OSRM expects "lon,lat"
        coord_parts = [f"{start_lon},{start_lat}"]
        if waypoints:
            for wp_lat, wp_lon in waypoints:
                coord_parts.append(f"{wp_lon},{wp_lat}")
        coord_parts.append(f"{dest_lon},{dest_lat}")
        coords = ";".join(coord_parts)
        url = f"{OSRM_BASE_URL}/{coords}"
        params = {
            "overview": "full",
            "geometries": "polyline",
            "steps": "false",
        }

        last_exc: Exception | None = None
        try:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    break
                except httpx.HTTPStatusError as e:
                    last_exc = e
                    if attempt < MAX_RETRIES - 1:
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "OSRM returned %s, retrying in %.1fs",
                            e.response.status_code,
                            delay,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("OSRM HTTP error: %s", e)
                    raise RoutingServiceError(
                        f"Routing API returned {e.response.status_code}"
                    ) from e
                except (httpx.ConnectError, httpx.ReadTimeout) as e:
                    last_exc = e
                    if attempt < MAX_RETRIES - 1:
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "OSRM request failed (%s), retrying in %.1fs",
                            type(e).__name__,
                            delay,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("OSRM request failed: %s", e)
                    raise RoutingServiceError("Routing API unavailable") from e
            else:
                raise RoutingServiceError(
                    "Routing API unavailable after retries"
                ) from last_exc
        except RoutingServiceError:
            raise
        except Exception as e:
            logger.error("OSRM request failed: %s", e)
            raise RoutingServiceError("Routing API unavailable") from e
        finally:
            if owns_client:
                await client.aclose()

        try:
            if data["code"] != "Ok":
                raise RoutingServiceError(f"OSRM Error: {data.get('message', 'Unknown')}")

            route = data["routes"][0]
            distance_km = route["distance"] / 1000.0
            duration_minutes = route["duration"] / 60.0
            geometry_str = route["geometry"]

            # polyline.decode returns list of (lat, lon)
            geometry = polyline.decode(geometry_str)

            result = RouteResult(
                geometry=geometry,
                distance_km=distance_km,
                duration_minutes=duration_minutes,
            )
        except (KeyError, IndexError, TypeError) as e:
            logger.error("Failed to parse OSRM response: %s", e)
            raise RoutingServiceError("Failed to parse routing data") from e

        self._cache[cache_key] = (time.monotonic(), result)
        return result

    @staticmethod
    def route_from_geometry(geometry: list[list[float]]) -> RouteResult:
        """Build a RouteResult from pre-existing geometry (e.g. GPX import) without OSRM."""
        coords = [(pt[0], pt[1]) for pt in geometry]
        total_km = 0.0
        for i in range(1, len(coords)):
            lat1, lon1 = math.radians(coords[i - 1][0]), math.radians(coords[i - 1][1])
            lat2, lon2 = math.radians(coords[i][0]), math.radians(coords[i][1])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
            total_km += 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        # Estimate duration assuming 20 km/h average
        duration_minutes = (total_km / 20.0) * 60 if total_km > 0 else 0
        return RouteResult(
            geometry=coords,
            distance_km=total_km,
            duration_minutes=duration_minutes,
        )


# Module-level singleton
routing_service = RoutingService()
