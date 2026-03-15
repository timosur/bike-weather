import uuid
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saved_route import SavedRoute
from app.models.user import User


def _make_route(user_id: int, **overrides) -> SavedRoute:
    defaults = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": "Test Route",
        "start_location": "Konstanz",
        "total_distance": 42.0,
        "distance_unit": "km",
        "riding_style": "Sporty",
    }
    defaults.update(overrides)
    return SavedRoute(**defaults)


# ---------------------------------------------------------------------------
# GET /api/routes
# ---------------------------------------------------------------------------


async def test_list_routes_empty(
    authenticated_client: AsyncClient,
) -> None:
    response = await authenticated_client.get("/api/routes")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_routes_returns_own_routes(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    create_test_user: User,
) -> None:
    route = _make_route(create_test_user.id, name="My Route")
    db_session.add(route)
    await db_session.commit()

    response = await authenticated_client.get("/api/routes")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "My Route"
    assert data[0]["id"] == route.id


async def test_list_routes_sorted_by_last_used(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    create_test_user: User,
) -> None:
    from datetime import datetime, timezone

    route_old = _make_route(
        create_test_user.id,
        name="Old",
        last_used=datetime(2025, 1, 1, tzinfo=timezone.utc).replace(tzinfo=None),
    )
    route_new = _make_route(
        create_test_user.id,
        name="New",
        last_used=datetime(2026, 1, 1, tzinfo=timezone.utc).replace(tzinfo=None),
    )
    route_never = _make_route(create_test_user.id, name="Never")

    db_session.add_all([route_old, route_new, route_never])
    await db_session.commit()

    response = await authenticated_client.get("/api/routes")
    assert response.status_code == 200
    data = response.json()
    names = [r["name"] for r in data]
    # New (most recent last_used) first, then Old, then Never (null last_used last)
    assert names == ["New", "Old", "Never"]


async def test_list_routes_unauthenticated_returns_401(
    async_client: AsyncClient,
) -> None:
    response = await async_client.get("/api/routes")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/routes
# ---------------------------------------------------------------------------


async def test_create_route(
    authenticated_client: AsyncClient,
) -> None:
    payload = {
        "name": "Morning Loop",
        "start_location": "Konstanz",
        "total_distance": 35.0,
        "riding_style": "Touring",
    }
    response = await authenticated_client.post("/api/routes", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Morning Loop"
    assert data["start_location"] == "Konstanz"
    assert data["total_distance"] == 35.0
    assert data["riding_style"] == "Touring"
    assert data["distance_unit"] == "km"
    assert "id" in data


async def test_create_route_missing_fields_returns_422(
    authenticated_client: AsyncClient,
) -> None:
    response = await authenticated_client.post(
        "/api/routes", json={"name": "Incomplete"}
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PUT /api/routes/{id}
# ---------------------------------------------------------------------------


async def test_update_route(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    create_test_user: User,
) -> None:
    route = _make_route(create_test_user.id, name="Original")
    db_session.add(route)
    await db_session.commit()

    response = await authenticated_client.put(
        f"/api/routes/{route.id}", json={"name": "Renamed"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"
    # Other fields should remain unchanged
    assert response.json()["start_location"] == "Konstanz"


async def test_update_route_other_user_returns_404(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    # Create a route owned by a different user (user_id=9999)
    other_route = _make_route(9999, name="Other User Route")
    db_session.add(other_route)
    await db_session.commit()

    response = await authenticated_client.put(
        f"/api/routes/{other_route.id}", json={"name": "Hacked"}
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /api/routes/{id}
# ---------------------------------------------------------------------------


async def test_delete_route(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    create_test_user: User,
) -> None:
    route = _make_route(create_test_user.id)
    db_session.add(route)
    await db_session.commit()

    response = await authenticated_client.delete(f"/api/routes/{route.id}")
    assert response.status_code == 204

    # Verify it's gone
    list_response = await authenticated_client.get("/api/routes")
    assert list_response.json() == []


async def test_delete_route_other_user_returns_404(
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    other_route = _make_route(9999)
    db_session.add(other_route)
    await db_session.commit()

    response = await authenticated_client.delete(f"/api/routes/{other_route.id}")
    assert response.status_code == 404


async def test_delete_route_not_found_returns_404(
    authenticated_client: AsyncClient,
) -> None:
    response = await authenticated_client.delete(f"/api/routes/{uuid.uuid4()}")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/rides/report with route_id
# ---------------------------------------------------------------------------

VALID_RIDE_INPUT = {
    "location": {"address": "Konstanz", "lat": 47.66, "lon": 9.17},
    "startDate": "2026-03-15",
    "startTime": "09:00",
    "bikeType": "rennrad",
    "intensity": "moderat",
    "distanceKm": 40,
}


@patch("app.services.recommendations.weather_service")
async def test_report_with_route_id_updates_condition(
    mock_ws: AsyncMock,
    authenticated_client: AsyncClient,
    db_session: AsyncSession,
    create_test_user: User,
) -> None:
    from app.services.weather import (
        HourlyForecast,
        HourlyWeatherWindow,
        WeatherForecast,
    )

    summary = WeatherForecast(
        temp_min=8.0,
        temp_max=16.0,
        temp_feels_like=10.5,
        precipitation_probability=10,
        wind_speed=12.0,
        wind_direction="S",
        humidity=55,
        uv_index=4.0,
        sunrise="06:42",
        sunset="18:31",
        weather_code=1,
        icon="sun",
        description="Mainly clear",
    )
    hours = [
        HourlyForecast(
            hour=f"{h:02d}:00",
            temp=5.0 + h * 0.5,
            temp_feels_like=3.0 + h * 0.4,
            precipitation_probability=10,
            precipitation_mm=0.0,
            wind_speed=12.0,
            wind_direction="S",
            wind_direction_deg=180.0,
            wind_gusts=18.0,
            humidity=55,
            weather_code=1,
            icon="sun",
            description="Mainly clear",
            is_day=h >= 6 and h <= 20,
        )
        for h in range(24)
    ]
    mock_ws.fetch_hourly_forecast = AsyncMock(
        return_value=HourlyWeatherWindow(hours=hours, summary=summary)
    )

    route = _make_route(create_test_user.id)
    db_session.add(route)
    await db_session.commit()

    response = await authenticated_client.post(
        f"/api/rides/report?route_id={route.id}", json=VALID_RIDE_INPUT
    )
    assert response.status_code == 200

    # Refresh from DB to check updates
    await db_session.refresh(route)
    assert route.last_condition != ""
    assert route.last_used is not None


@patch("app.services.recommendations.weather_service")
async def test_report_with_invalid_route_id_still_returns_report(
    mock_ws: AsyncMock,
    authenticated_client: AsyncClient,
) -> None:
    from app.services.weather import (
        HourlyForecast,
        HourlyWeatherWindow,
        WeatherForecast,
    )

    summary = WeatherForecast(
        temp_min=8.0,
        temp_max=16.0,
        temp_feels_like=10.5,
        precipitation_probability=10,
        wind_speed=12.0,
        wind_direction="S",
        humidity=55,
        uv_index=4.0,
        sunrise="06:42",
        sunset="18:31",
        weather_code=1,
        icon="sun",
        description="Mainly clear",
    )
    hours = [
        HourlyForecast(
            hour=f"{h:02d}:00",
            temp=5.0 + h * 0.5,
            temp_feels_like=3.0 + h * 0.4,
            precipitation_probability=10,
            precipitation_mm=0.0,
            wind_speed=12.0,
            wind_direction="S",
            wind_gusts=18.0,
            wind_direction_deg=180.0,
            humidity=55,
            weather_code=1,
            icon="sun",
            description="Mainly clear",
            is_day=h >= 6 and h <= 20,
        )
        for h in range(24)
    ]
    mock_ws.fetch_hourly_forecast = AsyncMock(
        return_value=HourlyWeatherWindow(hours=hours, summary=summary)
    )

    response = await authenticated_client.post(
        f"/api/rides/report?route_id={uuid.uuid4()}", json=VALID_RIDE_INPUT
    )
    assert response.status_code == 200
    assert "rideName" in response.json()
