from datetime import datetime

import pytest

from app.schemas.ride import RideInputSchema
from app.services.ride_legs import build_legs, leg_time_at
from app.services.route_waypoints import haversine_distance

OUT = [(0.0, i / 100) for i in range(21)]
OUT_AND_BACK = OUT + OUT[-2::-1]
LINE_KM = haversine_distance(0.0, 0.0, 0.0, 0.2)
TURN = {"lat": 0.0, "lon": 0.2, "address": "B"}


def _ride(waypoints: list[dict], start_time: str = "09:00", **extra) -> RideInputSchema:
    return RideInputSchema(
        location={"address": "A", "lat": 0.0, "lon": 0.0},
        startDate="2026-10-26",
        startTime=start_time,
        bikeType="rennrad",
        intensity="moderat",
        waypoints=waypoints,
        **extra,
    )


def _legs(ride: RideInputSchema, geometry=OUT_AND_BACK, total_minutes: int = 120):
    return build_legs(ride, 0.0, 0.0, geometry, total_minutes)


def test_no_split_waypoints_gives_single_leg_with_total_duration():
    legs = _legs(_ride([{"location": TURN, "type": "stop"}]))
    assert len(legs) == 1
    assert legs[0].date == "2026-10-26"
    assert legs[0].start_time == "09:00"
    assert legs[0].duration_min == 120


def test_return_trip_with_pause_splits_duration_by_distance():
    legs = _legs(_ride([{"location": TURN, "type": "pause", "startTime": "17:00"}]))
    assert [(l.date, l.start_time) for l in legs] == [
        ("2026-10-26", "09:00"),
        ("2026-10-26", "17:00"),
    ]
    assert [l.duration_min for l in legs] == [60, 60]
    assert legs[1].location_name == "B"
    assert legs[1].start_km == pytest.approx(LINE_KM, abs=0.01)
    assert legs[1].end_km == pytest.approx(2 * LINE_KM, abs=0.01)
    assert legs[1].split_type == "pause"


def test_dates_for_pause_sleep_pause():
    pts = [{"lat": 0.0, "lon": x / 100} for x in (5, 10, 15)]
    legs = _legs(
        _ride(
            [
                {"location": pts[0], "type": "pause", "startTime": "12:00"},
                {"location": pts[1], "type": "sleep", "startTime": "08:30"},
                {"location": pts[2], "type": "pause", "startTime": "14:00"},
            ]
        ),
        geometry=OUT,
    )
    assert [l.date for l in legs] == [
        "2026-10-26",
        "2026-10-26",
        "2026-10-27",
        "2026-10-27",
    ]
    assert [l.start_time for l in legs] == ["09:00", "12:00", "08:30", "14:00"]


def test_sleep_without_start_time_defaults_to_0800():
    legs = _legs(_ride([{"location": TURN, "type": "sleep"}]))
    assert legs[1].start_time == "08:00"
    assert legs[1].date == "2026-10-27"


def test_planned_km_overrides_leg_distance():
    legs = _legs(
        _ride(
            [
                {
                    "location": TURN,
                    "type": "sleep",
                    "startTime": "08:00",
                    "plannedKm": 60,
                }
            ],
            averageSpeedKmh=20,
        )
    )
    assert legs[1].duration_min == 180


def test_no_geometry_falls_back_to_total_duration():
    legs = _legs(
        _ride([{"location": TURN, "type": "pause", "startTime": "17:00"}]),
        geometry=None,
    )
    assert [l.duration_min for l in legs] == [120, 120]


def test_leg_time_at_includes_pause():
    legs = _legs(_ride([{"location": TURN, "type": "pause", "startTime": "17:00"}]))
    # Outbound midpoint: 30 min after 09:00
    assert leg_time_at(legs, LINE_KM / 2) == datetime(2026, 10, 26, 9, 30)
    # Return midpoint: 30 min after the 17:00 departure
    assert leg_time_at(legs, LINE_KM * 1.5) == datetime(2026, 10, 26, 17, 30)


def test_leg_time_at_after_sleep_is_next_day():
    legs = _legs(_ride([{"location": TURN, "type": "sleep", "startTime": "08:00"}]))
    assert leg_time_at(legs, LINE_KM * 1.5).date() == datetime(2026, 10, 27).date()
