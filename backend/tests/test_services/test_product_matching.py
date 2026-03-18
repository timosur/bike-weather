"""Tests for item-level product matching (BIKE-24)."""

from dataclasses import dataclass

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AffiliateDisclosure, Product, Shop
from app.services.product_matching import (
    _pick_best,
    _weather_score,
    match_products_to_clothing,
    match_products_to_equipment,
)


@dataclass
class FakeWeather:
    """Minimal stand-in for WeatherForecast used in scoring tests."""

    temp_feels_like: float = 10.0
    precipitation_probability: float = 0.0
    wind_speed: float = 5.0


def _make_product(**kwargs) -> Product:
    defaults = dict(
        id="p-1",
        name="Test Product",
        category_id="cat-test",
        image_url="https://img.example.com/1.jpg",
        shop_id="shop-test",
        affiliate_url="https://example.com/p/1",
        matches_zone=None,
        matches_item_id=None,
        matches_label="Test",
        weather_temp_min=None,
        weather_temp_max=None,
        weather_precipitation="none",
        weather_wind="none",
        weather_summary="Good",
        is_published=True,
    )
    defaults.update(kwargs)
    return Product(**defaults)


async def _seed_matching_data(
    session: AsyncSession,
    products: list[dict],
) -> None:
    """Insert a shop, disclosure, and the given products into the test DB."""
    shop = Shop(
        id="shop-test",
        name="Test Shop",
        logo_url="https://example.com/logo.png",
        affiliate_tag=None,
    )
    session.add(shop)

    disc = AffiliateDisclosure(
        badge_label="Ad", disclaimer_text="Affiliate links.", is_active=True
    )
    session.add(disc)

    for p_kwargs in products:
        session.add(_make_product(**p_kwargs))

    await session.commit()


# ---------------------------------------------------------------------------
# _weather_score tests
# ---------------------------------------------------------------------------


class TestWeatherScore:
    def test_perfect_match(self):
        p = _make_product(
            weather_temp_min=5.0,
            weather_temp_max=15.0,
            weather_precipitation="none",
            weather_wind="none",
        )
        weather = FakeWeather(
            temp_feels_like=10.0, precipitation_probability=0.0, wind_speed=5.0
        )
        assert _weather_score(p, weather) == 3.0

    def test_no_temp_data_gives_half_point(self):
        p = _make_product(weather_precipitation="none", weather_wind="none")
        weather = FakeWeather()
        assert _weather_score(p, weather) == 2.5  # 0.5 + 1.0 + 1.0

    def test_out_of_range_temp_zero_credit(self):
        p = _make_product(
            weather_temp_min=20.0,
            weather_temp_max=30.0,
            weather_precipitation="none",
            weather_wind="none",
        )
        weather = FakeWeather(temp_feels_like=5.0)
        # 15 degrees away — beyond 5°C partial credit
        score = _weather_score(p, weather)
        assert score < 2.5  # temp gets 0


class TestPickBest:
    def test_picks_highest_scorer(self):
        weather = FakeWeather(
            temp_feels_like=10.0, precipitation_probability=0.0, wind_speed=5.0
        )
        good = _make_product(
            id="p-good",
            weather_temp_min=5.0,
            weather_temp_max=15.0,
            weather_precipitation="none",
            weather_wind="none",
        )
        bad = _make_product(
            id="p-bad",
            weather_temp_min=30.0,
            weather_temp_max=40.0,
            weather_precipitation="none",
            weather_wind="none",
        )
        assert _pick_best([bad, good], weather) == good


# ---------------------------------------------------------------------------
# match_products_to_clothing tests
# ---------------------------------------------------------------------------


class TestMatchProductsToClothing:
    @pytest.mark.asyncio
    async def test_exact_match_by_item_id(self, db_session: AsyncSession):
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-jacket", "matches_item_id": "cl-rain-jacket"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-rain-jacket"}],
            weather,
        )

        assert result is not None
        assert "cl-rain-jacket" in result.matched
        assert result.matched["cl-rain-jacket"].id == "p-jacket"

    @pytest.mark.asyncio
    async def test_different_items_same_zone_get_different_products(
        self, db_session: AsyncSession
    ):
        """Two items in the same body zone get their own distinct products."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-helmet", "matches_item_id": "cl-helmet-cover"},
                {"id": "p-headband", "matches_item_id": "cl-headband"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-helmet-cover"}, {"id": "cl-headband"}],
            weather,
        )

        assert result is not None
        assert result.matched["cl-helmet-cover"].id == "p-helmet"
        assert result.matched["cl-headband"].id == "p-headband"

    @pytest.mark.asyncio
    async def test_no_match_returns_nothing(self, db_session: AsyncSession):
        """Items with no matching product are omitted (no zone fallback)."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-jacket", "matches_item_id": "cl-rain-jacket"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-headband"}],  # no product for this item
            weather,
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_weather_scoring_among_candidates(self, db_session: AsyncSession):
        """When multiple products match the same item ID, best weather fit wins."""
        await _seed_matching_data(
            db_session,
            [
                {
                    "id": "p-warm",
                    "matches_item_id": "cl-rain-jacket",
                    "weather_temp_min": -10.0,
                    "weather_temp_max": 5.0,
                    "weather_precipitation": "heavy-rain",
                    "weather_wind": "strong-wind",
                },
                {
                    "id": "p-cool",
                    "matches_item_id": "cl-rain-jacket",
                    "weather_temp_min": 5.0,
                    "weather_temp_max": 15.0,
                    "weather_precipitation": "heavy-rain",
                    "weather_wind": "strong-wind",
                },
            ],
        )
        # Weather: 10°C — p-cool is a better fit
        weather = FakeWeather(
            temp_feels_like=10.0, precipitation_probability=80.0, wind_speed=35.0
        )

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-rain-jacket"}],
            weather,
        )

        assert result is not None
        assert result.matched["cl-rain-jacket"].id == "p-cool"

    @pytest.mark.asyncio
    async def test_unpublished_products_excluded(self, db_session: AsyncSession):
        await _seed_matching_data(
            db_session,
            [
                {
                    "id": "p-hidden",
                    "matches_item_id": "cl-rain-jacket",
                    "is_published": False,
                },
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-rain-jacket"}],
            weather,
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_product_without_item_id_ignored(self, db_session: AsyncSession):
        """Products with matches_item_id=None are never matched."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-zone", "matches_zone": "head", "matches_item_id": None},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_clothing(
            db_session,
            [{"id": "cl-headband", "icon": "headband"}],
            weather,
        )

        assert result is None


# ---------------------------------------------------------------------------
# match_products_to_equipment tests
# ---------------------------------------------------------------------------


class TestMatchProductsToEquipment:
    @pytest.mark.asyncio
    async def test_exact_match(self, db_session: AsyncSession):
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-mudguards", "matches_item_id": "eq-mudguards"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_equipment(
            db_session,
            [{"id": "eq-mudguards"}],
            weather,
        )

        assert result is not None
        assert "eq-mudguards" in result
        assert result["eq-mudguards"].id == "p-mudguards"

    @pytest.mark.asyncio
    async def test_prefix_matching_lights(self, db_session: AsyncSession):
        """eq-lights product matches eq-lights-before-sunrise item via prefix."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-lights", "matches_item_id": "eq-lights"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_equipment(
            db_session,
            [{"id": "eq-lights-before-sunrise"}],
            weather,
        )

        assert result is not None
        assert "eq-lights-before-sunrise" in result
        assert result["eq-lights-before-sunrise"].id == "p-lights"

    @pytest.mark.asyncio
    async def test_prefix_matching_multiple_variants(self, db_session: AsyncSession):
        """Same product matches different light variants."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-lights", "matches_item_id": "eq-lights"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_equipment(
            db_session,
            [{"id": "eq-lights-before-sunrise"}, {"id": "eq-lights-after-sunset"}],
            weather,
        )

        assert result is not None
        assert result["eq-lights-before-sunrise"].id == "p-lights"
        assert result["eq-lights-after-sunset"].id == "p-lights"

    @pytest.mark.asyncio
    async def test_no_match_returns_none(self, db_session: AsyncSession):
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-lights", "matches_item_id": "eq-lights"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_equipment(
            db_session,
            [{"id": "eq-mudguards"}],
            weather,
        )

        assert result is None

    @pytest.mark.asyncio
    async def test_clothing_products_excluded(self, db_session: AsyncSession):
        """Products with cl-* item IDs are not returned by equipment matching."""
        await _seed_matching_data(
            db_session,
            [
                {"id": "p-jacket", "matches_item_id": "cl-rain-jacket"},
            ],
        )
        weather = FakeWeather()

        result = await match_products_to_equipment(
            db_session,
            [{"id": "eq-mudguards"}],
            weather,
        )

        assert result is None
