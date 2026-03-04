import logging
from dataclasses import dataclass

import gpxpy
import gpxpy.gpx

logger = logging.getLogger(__name__)


class GpxParseError(Exception):
    pass


class GpxEmptyError(GpxParseError):
    """File has no coordinates."""

    pass


@dataclass
class GpxParseResult:
    name: str
    geometry: list[list[float]]  # [[lat, lon], ...]
    distance_km: float
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float


def parse_gpx(content: bytes | str) -> GpxParseResult:
    """Parse GPX file content and extract route data."""
    if isinstance(content, bytes):
        try:
            content = content.decode("utf-8")
        except UnicodeDecodeError:
            content = content.decode("latin-1")

    try:
        gpx = gpxpy.parse(content)
    except Exception as exc:
        raise GpxParseError(f"Invalid GPX file: {exc}") from exc

    points: list[list[float]] = []
    distance_m: float = 0.0
    name: str | None = None

    # Prefer tracks over routes
    if gpx.tracks:
        name = gpx.tracks[0].name
        for track in gpx.tracks:
            for segment in track.segments:
                for pt in segment.points:
                    points.append([pt.latitude, pt.longitude])
                distance_m += segment.length_3d() or segment.length_2d()
    elif gpx.routes:
        name = gpx.routes[0].name
        for route in gpx.routes:
            for pt in route.points:
                points.append([pt.latitude, pt.longitude])
            distance_m += route.length() or 0.0

    if not points:
        raise GpxEmptyError("GPX file contains no track or route points")

    # Resolve name with fallbacks
    if not name:
        name = gpx.name or "Imported Route"

    distance_km = distance_m / 1000.0

    logger.info(
        "Parsed GPX: %s — %d points, %.2f km", name, len(points), distance_km
    )

    return GpxParseResult(
        name=name,
        geometry=points,
        distance_km=round(distance_km, 2),
        start_lat=points[0][0],
        start_lon=points[0][1],
        end_lat=points[-1][0],
        end_lon=points[-1][1],
    )
