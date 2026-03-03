import math
from dataclasses import dataclass, field


@dataclass
class RouteWaypoint:
    index: int
    lat: float
    lon: float
    distance_from_start_km: float
    bearing: float  # Degrees 0-360, 0=N, 90=E
    geometry_index: int  # Index in the original route geometry
    segment_start_km: float | None = None
    segment_end_km: float | None = None
    segment_start_geom_idx: int | None = None
    segment_end_geom_idx: int | None = None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    d_lon = lon2_rad - lon1_rad

    y = math.sin(d_lon) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(
        lat2_rad
    ) * math.cos(d_lon)

    bearing_rad = math.atan2(y, x)
    bearing_deg = math.degrees(bearing_rad)
    return (bearing_deg + 360) % 360


def sample_waypoints(
    route_geometry: list[tuple[float, float]], step_km: float = 25.0
) -> list[RouteWaypoint]:
    """
    Sample waypoints from a route geometry every `step_km`.
    
    route_geometry: List of (lat, lon) tuples.
    """
    if not route_geometry:
        return []

    waypoints: list[RouteWaypoint] = []
    
    # Always include start point
    start_lat, start_lon = route_geometry[0]
    # For start point, use bearing to second point if available, else 0
    start_bearing = 0.0
    if len(route_geometry) > 1:
        next_lat, next_lon = route_geometry[1]
        start_bearing = calculate_bearing(start_lat, start_lon, next_lat, next_lon)
        
    waypoints.append(
        RouteWaypoint(
            index=0,
            lat=start_lat,
            lon=start_lon,
            distance_from_start_km=0.0,
            bearing=start_bearing,
            geometry_index=0,
        )
    )

    accumulated_distance = 0.0
    next_sample_distance = step_km
    
    for i in range(len(route_geometry) - 1):
        lat1, lon1 = route_geometry[i]
        lat2, lon2 = route_geometry[i+1]
        
        segment_dist = haversine_distance(lat1, lon1, lat2, lon2)
        
        current_dist = accumulated_distance
        target_dist = current_dist + segment_dist
        
        while target_dist >= next_sample_distance:
            fraction = (next_sample_distance - current_dist) / segment_dist if segment_dist > 0 else 0
            sample_lat = lat1 + (lat2 - lat1) * fraction
            sample_lon = lon1 + (lon2 - lon1) * fraction
            bearing = calculate_bearing(lat1, lon1, lat2, lon2)
            
            waypoints.append(
                RouteWaypoint(
                    index=len(waypoints),
                    lat=sample_lat,
                    lon=sample_lon,
                    distance_from_start_km=next_sample_distance,
                    bearing=bearing,
                    geometry_index=i,
                )
            )
            
            next_sample_distance += step_km
            
        accumulated_distance += segment_dist

    return waypoints


def _angular_diff(a: float, b: float) -> float:
    """Signed angular difference from a to b in degrees, range [-180, 180]."""
    d = (b - a) % 360
    if d > 180:
        d -= 360
    return d


def _circular_mean(bearings: list[float]) -> float:
    """Compute the circular (angular) mean of a list of bearings in degrees."""
    if not bearings:
        return 0.0
    sin_sum = sum(math.sin(math.radians(b)) for b in bearings)
    cos_sum = sum(math.cos(math.radians(b)) for b in bearings)
    return math.degrees(math.atan2(sin_sum, cos_sum)) % 360


@dataclass
class _Segment:
    """Internal accumulator for building direction-based segments."""
    start_km: float
    start_geom_idx: int
    bearings: list[float] = field(default_factory=list)
    points: list[tuple[float, float]] = field(default_factory=list)
    distances: list[float] = field(default_factory=list)
    geom_indices: list[int] = field(default_factory=list)

    @property
    def end_km(self) -> float:
        return self.distances[-1] if self.distances else self.start_km

    @property
    def length_km(self) -> float:
        return self.end_km - self.start_km

    @property
    def avg_bearing(self) -> float:
        return _circular_mean(self.bearings)

    def midpoint(self) -> tuple[float, float, float, int]:
        """Return (lat, lon, distance_km, geometry_index) at the segment midpoint."""
        if not self.points:
            return (0.0, 0.0, self.start_km, self.start_geom_idx)

        mid_km = self.start_km + self.length_km / 2
        # Walk through points to find the one closest to mid_km
        best_idx = 0
        best_diff = abs(self.distances[0] - mid_km)
        for j in range(1, len(self.distances)):
            d = abs(self.distances[j] - mid_km)
            if d < best_diff:
                best_diff = d
                best_idx = j
        return (
            self.points[best_idx][0],
            self.points[best_idx][1],
            self.distances[best_idx],
            self.geom_indices[best_idx],
        )


def sample_waypoints_by_direction(
    route_geometry: list[tuple[float, float]],
    bearing_threshold_deg: float = 30.0,
    min_segment_km: float = 2.0,
    max_segment_km: float = 30.0,
) -> list[RouteWaypoint]:
    """
    Sample waypoints based on direction changes in the route.

    Instead of fixed-interval sampling, this detects significant bearing
    changes and creates one waypoint per directional segment. Each waypoint
    represents the midpoint of a stretch where the route maintains a
    roughly consistent heading.

    Args:
        route_geometry: List of (lat, lon) tuples from the route.
        bearing_threshold_deg: Bearing change (degrees) that triggers a new segment.
        min_segment_km: Minimum segment length; shorter segments merge into the previous one.
        max_segment_km: Maximum segment length; longer segments are split for weather accuracy.

    Returns:
        List of RouteWaypoint with segment_start_km and segment_end_km populated.
    """
    if len(route_geometry) < 2:
        if route_geometry:
            return [
                RouteWaypoint(
                    index=0, lat=route_geometry[0][0], lon=route_geometry[0][1],
                    distance_from_start_km=0.0, bearing=0.0, geometry_index=0,
                    segment_start_km=0.0, segment_end_km=0.0,
                )
            ]
        return []

    # 1. Pre-compute per-edge bearings and cumulative distances
    cum_dist = [0.0]
    edge_bearings: list[float] = []
    for i in range(len(route_geometry) - 1):
        lat1, lon1 = route_geometry[i]
        lat2, lon2 = route_geometry[i + 1]
        cum_dist.append(cum_dist[-1] + haversine_distance(lat1, lon1, lat2, lon2))
        edge_bearings.append(calculate_bearing(lat1, lon1, lat2, lon2))

    total_km = cum_dist[-1]

    # 2. Walk geometry and build raw segments
    raw_segments: list[_Segment] = []
    current = _Segment(start_km=0.0, start_geom_idx=0)

    for i, bearing in enumerate(edge_bearings):
        lat, lon = route_geometry[i]
        dist_km = cum_dist[i]

        current.bearings.append(bearing)
        current.points.append((lat, lon))
        current.distances.append(dist_km)
        current.geom_indices.append(i)

        seg_len = dist_km - current.start_km
        should_split = False

        # Check bearing divergence from segment average
        if seg_len >= min_segment_km and len(current.bearings) > 1:
            diff = abs(_angular_diff(current.avg_bearing, bearing))
            if diff > bearing_threshold_deg:
                should_split = True

        # Force split at max length
        if seg_len >= max_segment_km:
            should_split = True

        if should_split:
            raw_segments.append(current)
            current = _Segment(start_km=dist_km, start_geom_idx=i)

    # Add the last point and close the final segment
    last_lat, last_lon = route_geometry[-1]
    current.points.append((last_lat, last_lon))
    current.distances.append(total_km)
    current.geom_indices.append(len(route_geometry) - 1)
    if current.bearings:  # has at least one edge
        raw_segments.append(current)
    elif raw_segments:
        # Edge case: final segment has no bearing (single point), merge into previous
        prev = raw_segments[-1]
        prev.points.append((last_lat, last_lon))
        prev.distances.append(total_km)
        prev.geom_indices.append(len(route_geometry) - 1)

    # 3. Merge tiny segments into their predecessor
    merged: list[_Segment] = []
    for seg in raw_segments:
        if merged and seg.length_km < min_segment_km:
            prev = merged[-1]
            prev.bearings.extend(seg.bearings)
            prev.points.extend(seg.points)
            prev.distances.extend(seg.distances)
            prev.geom_indices.extend(seg.geom_indices)
        else:
            merged.append(seg)

    # 4. Convert segments to RouteWaypoints (one per segment, at midpoint)
    waypoints: list[RouteWaypoint] = []
    for idx, seg in enumerate(merged):
        mid_lat, mid_lon, mid_dist, mid_geom_idx = seg.midpoint()
        waypoints.append(
            RouteWaypoint(
                index=idx,
                lat=mid_lat,
                lon=mid_lon,
                distance_from_start_km=mid_dist,
                bearing=seg.avg_bearing,
                geometry_index=mid_geom_idx,
                segment_start_km=round(seg.start_km, 1),
                segment_end_km=round(seg.end_km, 1),
                segment_start_geom_idx=seg.start_geom_idx,
                segment_end_geom_idx=seg.geom_indices[-1] if seg.geom_indices else seg.start_geom_idx,
            )
        )

    return waypoints
