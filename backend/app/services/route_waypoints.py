import math
from dataclasses import dataclass


@dataclass
class RouteWaypoint:
    index: int
    lat: float
    lon: float
    distance_from_start_km: float
    bearing: float  # Degrees 0-360, 0=N, 90=E
    geometry_index: int  # Index in the original route geometry


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
