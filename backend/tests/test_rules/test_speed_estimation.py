"""Tests for speed estimation and duration calculation."""

from app.rules.speed_estimation import (
    DEFAULT_DURATION_MINUTES,
    estimate_duration_minutes,
    get_average_speed,
    resolve_duration_minutes,
)


class TestGetAverageSpeed:
    def test_known_combo(self) -> None:
        assert get_average_speed("rennrad", "sportlich") == 32

    def test_all_combos_have_positive_speed(self) -> None:
        for bike in ("rennrad", "gravel", "mtb", "city"):
            for intensity in ("gemuetlich", "moderat", "sportlich"):
                speed = get_average_speed(bike, intensity)
                assert speed > 0, f"{bike}/{intensity} should have positive speed"

    def test_unknown_combo_returns_default(self) -> None:
        assert get_average_speed("unicycle", "extreme") == 20.0


class TestEstimateDuration:
    def test_no_distance_returns_none(self) -> None:
        assert estimate_duration_minutes(None, "gravel", "moderat") is None

    def test_zero_distance_returns_none(self) -> None:
        assert estimate_duration_minutes(0, "gravel", "moderat") is None

    def test_negative_distance_returns_none(self) -> None:
        assert estimate_duration_minutes(-5, "gravel", "moderat") is None

    def test_rounds_to_15_minutes(self) -> None:
        # 23 km/h gravel moderat → 40km / 23 ≈ 104 min → ceil to 105 → round to 15 → 105
        result = estimate_duration_minutes(40, "gravel", "moderat")
        assert result is not None
        assert result % 15 == 0

    def test_minimum_15_minutes(self) -> None:
        result = estimate_duration_minutes(1, "rennrad", "sportlich")
        assert result is not None
        assert result >= 15

    def test_50km_road_moderate(self) -> None:
        # 27 km/h → 50/27*60 ≈ 111 min → ceil to 15 → 120
        result = estimate_duration_minutes(50, "rennrad", "moderat")
        assert result == 120

    def test_100km_gravel_casual(self) -> None:
        # 18 km/h → 100/18*60 ≈ 333 min → ceil to 15 → 345
        result = estimate_duration_minutes(100, "gravel", "gemuetlich")
        assert result == 345


class TestResolveDuration:
    def test_explicit_duration_wins(self) -> None:
        assert resolve_duration_minutes(90, 50, "rennrad", "moderat") == 90

    def test_auto_from_distance(self) -> None:
        result = resolve_duration_minutes(None, 50, "rennrad", "moderat")
        assert result == 120  # same as estimate_duration_minutes

    def test_default_when_nothing(self) -> None:
        result = resolve_duration_minutes(None, None, "gravel", "moderat")
        assert result == DEFAULT_DURATION_MINUTES

    def test_zero_explicit_falls_through(self) -> None:
        # 0 explicit → falls through to auto
        result = resolve_duration_minutes(0, 50, "rennrad", "moderat")
        assert result == 120

    def test_explicit_avg_speed_overrides_default(self) -> None:
        # 60km at 20 km/h → 180 min → rounds to 180
        result = resolve_duration_minutes(
            None, 60, "rennrad", "moderat", average_speed_kmh=20
        )
        assert result == 180

    def test_explicit_duration_beats_avg_speed(self) -> None:
        # Explicit duration should still win over avg speed
        result = resolve_duration_minutes(
            90, 60, "rennrad", "moderat", average_speed_kmh=20
        )
        assert result == 90

    def test_avg_speed_without_distance_falls_to_default(self) -> None:
        # No distance → avg speed can't compute → falls to default
        result = resolve_duration_minutes(
            None, None, "gravel", "moderat", average_speed_kmh=25
        )
        assert result == DEFAULT_DURATION_MINUTES
