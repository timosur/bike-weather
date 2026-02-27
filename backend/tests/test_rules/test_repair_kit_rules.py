from app.rules.repair_kit_rules import get_repair_kit_contents


class TestDistanceTiers:
    """Repair kit contents scale with distance."""

    def test_short_ride_minimal_kit(self) -> None:
        contents = get_repair_kit_contents(15, "rennrad", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Spare Tube" in names
        assert "Tire Levers" in names
        assert "Mini Pump" in names
        assert "Multi-Tool" in names
        # Standard items should NOT be present
        assert "Patch Kit" not in names
        assert "Quick Link" not in names

    def test_medium_ride_standard_kit(self) -> None:
        contents = get_repair_kit_contents(50, "rennrad", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Patch Kit" in names
        assert "Quick Link" in names
        assert "Zip Ties" in names
        assert "Tire Boot" in names
        # Extended items should NOT be present
        assert "Second Spare Tube" not in names

    def test_long_ride_extended_kit(self) -> None:
        contents = get_repair_kit_contents(100, "rennrad", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Second Spare Tube" in names
        assert "Chain Tool" in names
        assert "Spoke Wrench" in names
        assert "Electrical Tape" in names


class TestIntensityBump:
    """sportlich intensity bumps up one tier."""

    def test_sportlich_short_ride_gets_standard(self) -> None:
        # 15 km + sportlich → effective 45 km → standard tier
        contents = get_repair_kit_contents(15, "rennrad", "sportlich", "en")
        names = [c["name"] for c in contents]
        assert "Patch Kit" in names
        assert "Quick Link" in names

    def test_sportlich_medium_ride_gets_extended(self) -> None:
        # 60 km + sportlich → effective 90 km → extended tier
        contents = get_repair_kit_contents(60, "rennrad", "sportlich", "en")
        names = [c["name"] for c in contents]
        assert "Second Spare Tube" in names
        assert "Chain Tool" in names

    def test_gemuetlich_short_ride_stays_minimal(self) -> None:
        contents = get_repair_kit_contents(15, "rennrad", "gemuetlich", "en")
        names = [c["name"] for c in contents]
        assert "Patch Kit" not in names


class TestBikeTypeExtras:
    """Bike-type-specific items are included."""

    def test_rennrad_has_co2(self) -> None:
        contents = get_repair_kit_contents(15, "rennrad", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "CO₂ Cartridge + Inflator" in names

    def test_mtb_has_tubeless_plugs_minimal(self) -> None:
        contents = get_repair_kit_contents(15, "mtb", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Tubeless Plug Kit" in names

    def test_mtb_standard_has_brake_pad_and_lube(self) -> None:
        contents = get_repair_kit_contents(50, "mtb", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Disc Brake Pad (spare)" in names
        assert "Chain Lube Sachet" in names

    def test_gravel_has_tubeless_plugs_minimal(self) -> None:
        contents = get_repair_kit_contents(15, "gravel", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Tubeless Plug Kit" in names

    def test_gravel_standard_has_tire_boot(self) -> None:
        contents = get_repair_kit_contents(50, "gravel", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Gravel Tire Boot (reinforced)" in names

    def test_city_keeps_minimal(self) -> None:
        # City bikes only get minimal items even at standard distance
        contents = get_repair_kit_contents(50, "city", "moderat", "en")
        names = [c["name"] for c in contents]
        # Should have standard extras but no bike-type extras
        assert "Patch Kit" in names
        assert "Tubeless Plug Kit" not in names


class TestLocale:
    """Translations work for both locales."""

    def test_german_locale(self) -> None:
        contents = get_repair_kit_contents(15, "rennrad", "moderat", "de")
        names = [c["name"] for c in contents]
        assert "Ersatzschlauch" in names
        assert "Reifenheber" in names

    def test_english_locale(self) -> None:
        contents = get_repair_kit_contents(15, "rennrad", "moderat", "en")
        names = [c["name"] for c in contents]
        assert "Spare Tube" in names
        assert "Tire Levers" in names
