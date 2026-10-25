import pytest

from app.services.route_waypoints import haversine_distance, split_route_km

# Straight line along the equator, ~1.11 km per 0.01° step
OUT = [(0.0, i / 100) for i in range(21)]  # 0 → 0.2° (~22.2 km)
OUT_AND_BACK = OUT + OUT[-2::-1]  # 0 → 0.2 → 0
LINE_KM = haversine_distance(0.0, 0.0, 0.0, 0.2)


def test_no_splits_returns_start_and_total():
    assert split_route_km(OUT, []) == pytest.approx([0.0, LINE_KM])


def test_straight_line_one_split():
    km = split_route_km(OUT, [(0.0, 0.05)])
    assert km == pytest.approx([0.0, LINE_KM / 4, LINE_KM], abs=0.01)


def test_out_and_back_gives_two_equal_legs():
    km = split_route_km(OUT_AND_BACK, [(0.0, 0.2)])
    assert km[1] - km[0] == pytest.approx(km[2] - km[1], abs=0.01)
    assert km[2] == pytest.approx(2 * LINE_KM, abs=0.01)


def test_repeated_location_snaps_to_first_visit_then_forward():
    # Pause at 0.1 on the way out and again at 0.1 on the way back
    km = split_route_km(OUT_AND_BACK, [(0.0, 0.1), (0.0, 0.1)])
    assert km[1] == pytest.approx(LINE_KM / 2, abs=0.01)
    assert km[2] == pytest.approx(LINE_KM * 1.5, abs=0.01)


def test_off_route_split_snaps_to_nearest_point():
    km = split_route_km(OUT, [(0.01, 0.1)])  # ~1 km north of the line
    assert km[1] == pytest.approx(LINE_KM / 2, abs=0.01)


def test_off_route_split_after_another_split():
    km = split_route_km(OUT, [(0.0, 0.05), (0.01, 0.1)])
    assert km[2] == pytest.approx(LINE_KM / 2, abs=0.01)


def test_same_spot_twice_without_revisit_gives_zero_length_leg():
    km = split_route_km(OUT, [(0.0, 0.1), (0.0, 0.1)])
    assert km[1] == pytest.approx(km[2])


def test_empty_geometry():
    assert split_route_km([], [(0.0, 0.1)]) == []
