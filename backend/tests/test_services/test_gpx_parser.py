import pytest

from app.services.gpx_parser import GpxEmptyError, GpxParseError, parse_gpx

SAMPLE_TRACK_GPX = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="52.5200" lon="13.4050"><ele>34</ele></trkpt>
      <trkpt lat="52.5300" lon="13.4100"><ele>36</ele></trkpt>
      <trkpt lat="52.5400" lon="13.4200"><ele>38</ele></trkpt>
    </trkseg>
  </trk>
</gpx>"""

SAMPLE_ROUTE_GPX = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <rte>
    <name>Test Route</name>
    <rtept lat="48.8566" lon="2.3522"/>
    <rtept lat="48.8600" lon="2.3600"/>
    <rtept lat="48.8650" lon="2.3700"/>
  </rte>
</gpx>"""

SAMPLE_BOTH_GPX = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <name>Track Name</name>
    <trkseg>
      <trkpt lat="52.5200" lon="13.4050"/>
      <trkpt lat="52.5300" lon="13.4100"/>
    </trkseg>
  </trk>
  <rte>
    <name>Route Name</name>
    <rtept lat="48.8566" lon="2.3522"/>
    <rtept lat="48.8600" lon="2.3600"/>
  </rte>
</gpx>"""

EMPTY_GPX = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
</gpx>"""


def test_valid_track_gpx() -> None:
    result = parse_gpx(SAMPLE_TRACK_GPX)

    assert result.name == "Test Track"
    assert len(result.geometry) == 3
    assert result.geometry[0] == [52.52, 13.405]
    assert result.geometry[2] == [52.54, 13.42]


def test_valid_route_gpx() -> None:
    result = parse_gpx(SAMPLE_ROUTE_GPX)

    assert result.name == "Test Route"
    assert len(result.geometry) == 3
    assert result.geometry[0] == [48.8566, 2.3522]
    assert result.geometry[2] == [48.865, 2.37]


def test_track_preferred_over_route() -> None:
    result = parse_gpx(SAMPLE_BOTH_GPX)

    assert result.name == "Track Name"
    # Should have track points (2), not route points
    assert len(result.geometry) == 2
    assert result.start_lat == 52.52


def test_name_from_track() -> None:
    result = parse_gpx(SAMPLE_TRACK_GPX)
    assert result.name == "Test Track"


def test_name_falls_back_to_route() -> None:
    result = parse_gpx(SAMPLE_ROUTE_GPX)
    assert result.name == "Test Route"


def test_name_falls_back_to_gpx_name() -> None:
    gpx = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <metadata><name>GPX Level Name</name></metadata>
  <trk>
    <trkseg>
      <trkpt lat="52.52" lon="13.405"/>
      <trkpt lat="52.53" lon="13.41"/>
    </trkseg>
  </trk>
</gpx>"""
    result = parse_gpx(gpx)
    assert result.name == "GPX Level Name"


def test_name_falls_back_to_default() -> None:
    gpx = """<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk>
    <trkseg>
      <trkpt lat="52.52" lon="13.405"/>
      <trkpt lat="52.53" lon="13.41"/>
    </trkseg>
  </trk>
</gpx>"""
    result = parse_gpx(gpx)
    assert result.name == "Imported Route"


def test_distance_calculation() -> None:
    result = parse_gpx(SAMPLE_TRACK_GPX)

    assert result.distance_km > 0
    # ~2.5 km between Berlin points; sanity-check range
    assert 1.0 < result.distance_km < 5.0


def test_start_end_points() -> None:
    result = parse_gpx(SAMPLE_TRACK_GPX)

    assert result.start_lat == 52.52
    assert result.start_lon == 13.405
    assert result.end_lat == 52.54
    assert result.end_lon == 13.42


def test_empty_gpx_raises() -> None:
    with pytest.raises(GpxEmptyError):
        parse_gpx(EMPTY_GPX)


def test_invalid_xml_raises() -> None:
    with pytest.raises(GpxParseError):
        parse_gpx("this is not xml at all <><>!!")


def test_bytes_input() -> None:
    result = parse_gpx(SAMPLE_TRACK_GPX.encode("utf-8"))

    assert result.name == "Test Track"
    assert len(result.geometry) == 3


def test_utf8_bom_handling() -> None:
    bom = b"\xef\xbb\xbf"
    content = bom + SAMPLE_TRACK_GPX.encode("utf-8")

    result = parse_gpx(content)

    assert result.name == "Test Track"
    assert len(result.geometry) == 3
