import pytest

from app.rules.translations import format_time


@pytest.mark.parametrize(
    ("hhmm", "expected"),
    [
        ("17:05", "5:05 PM"),
        ("00:30", "12:30 AM"),
        ("12:00", "12:00 PM"),
        ("09:00", "9:00 AM"),
    ],
)
def test_format_time_12h(hhmm: str, expected: str) -> None:
    assert format_time(hhmm, hour12=True) == expected


def test_format_time_24h_passthrough() -> None:
    assert format_time("17:05", hour12=False) == "17:05"


def test_format_time_invalid_unchanged() -> None:
    assert format_time("", hour12=True) == ""
    assert format_time("soon", hour12=True) == "soon"
