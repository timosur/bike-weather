from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AboutContent,
    AffiliateDisclosure,
    FaqItem,
    Product,
    ProductCategory,
    Shop,
)


async def _seed_shops(session: AsyncSession) -> None:
    shops = [
        Shop(id="shop-amazon", name="Amazon", logo_url="/logos/amazon.svg", affiliate_tag="bikeweather-21"),
        Shop(id="shop-bike24", name="Bike24", logo_url="/logos/bike24.svg", affiliate_tag=None),
    ]
    for shop in shops:
        existing = await session.get(Shop, shop.id)
        if not existing:
            session.add(shop)


async def _seed_categories(session: AsyncSession) -> None:
    categories = [
        ProductCategory(id="cat-jackets", name="Cycling Jackets", slug="cycling-jackets", icon="jacket", display_order=0),
        ProductCategory(id="cat-gloves", name="Cycling Gloves", slug="cycling-gloves", icon="gloves", display_order=1),
        ProductCategory(id="cat-pants", name="Cycling Tights", slug="cycling-tights", icon="pants", display_order=2),
        ProductCategory(id="cat-headwear", name="Headwear", slug="headwear", icon="headwear", display_order=3),
        ProductCategory(id="cat-shoes", name="Cycling Shoes & Overshoes", slug="cycling-shoes-overshoes", icon="shoes", display_order=4),
        ProductCategory(id="cat-lights", name="Bike Lights", slug="bike-lights", icon="light", display_order=5),
        ProductCategory(id="cat-accessories", name="Accessories & Gear", slug="accessories-gear", icon="accessories", display_order=6),
    ]
    for cat in categories:
        existing = await session.get(ProductCategory, cat.id)
        if not existing:
            session.add(cat)


async def _seed_products(session: AsyncSession) -> None:
    products = [
        Product(
            id="prod-001",
            name="Gore Wear C5 Gore-Tex Shakedry Jacket",
            category_id="cat-jackets",
            image_url="/products/gore-shakedry.jpg",
            price=179.99,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B07XYZ1234?tag=bikeweather-21",
            matches_zone="upperBody",
            matches_label="Waterproof Cycling Jacket",
            weather_temp_min=-5,
            weather_temp_max=15,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-5\u201315 \u00b0C, waterproof, windproof",
        ),
        Product(
            id="prod-002",
            name="Castelli Perfetto RoS 2 Long-sleeve Jersey",
            category_id="cat-jackets",
            image_url="/products/castelli-perfetto.jpg",
            price=219.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B09ABC5678?tag=bikeweather-21",
            matches_zone="upperBody",
            matches_label="Long-sleeve Cycling Jersey",
            weather_temp_min=8,
            weather_temp_max=18,
            weather_precipitation="light-rain",
            weather_wind="strong-wind",
            weather_summary="8\u201318 \u00b0C, water-resistant, windproof",
        ),
        Product(
            id="prod-003",
            name="GripGrab Ride Windproof Winter Gloves",
            category_id="cat-gloves",
            image_url="/products/gripgrab-winter.jpg",
            price=54.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B08DEF9012?tag=bikeweather-21",
            matches_zone="hands",
            matches_label="Waterproof Winter Gloves",
            weather_temp_min=-10,
            weather_temp_max=5,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-10\u20135 \u00b0C, waterproof, windproof",
        ),
        Product(
            id="prod-004",
            name="Roeckl Illano Summer Gloves",
            category_id="cat-gloves",
            image_url="/products/roeckl-illano.jpg",
            price=34.90,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B07GHI3456?tag=bikeweather-21",
            matches_zone="hands",
            matches_label="Light Cycling Gloves",
            weather_temp_min=15,
            weather_temp_max=35,
            weather_precipitation="none",
            weather_wind="none",
            weather_summary="15\u201335 \u00b0C, dry, padding & grip",
        ),
        Product(
            id="prod-005",
            name="Assos Mille GT Thermo Cycling Tights",
            category_id="cat-pants",
            image_url="/products/assos-mille-thermo.jpg",
            price=189.00,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B09JKL7890?tag=bikeweather-21",
            matches_zone="lowerBody",
            matches_label="Thermal Cycling Tights",
            weather_temp_min=-5,
            weather_temp_max=10,
            weather_precipitation="light-rain",
            weather_wind="light-wind",
            weather_summary="-5\u201310 \u00b0C, light water-resistance, thermal lining",
        ),
        Product(
            id="prod-006",
            name="Sigma Aura 80 / Blaze Light Set",
            category_id="cat-lights",
            image_url="/products/sigma-aura80.jpg",
            price=59.99,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B08MNO1234?tag=bikeweather-21",
            matches_zone=None,
            matches_label="Bike Lights (front + rear)",
            weather_temp_min=None,
            weather_temp_max=None,
            weather_precipitation="heavy-rain",
            weather_wind="none",
            weather_summary="All temperatures, weatherproof, IPX4",
        ),
        Product(
            id="prod-007",
            name="Buff Merino Lightweight Headband",
            category_id="cat-headwear",
            image_url="/products/buff-merino.jpg",
            price=24.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B06PQR5678?tag=bikeweather-21",
            matches_zone="head",
            matches_label="Light Headband",
            weather_temp_min=5,
            weather_temp_max=18,
            weather_precipitation="none",
            weather_wind="light-wind",
            weather_summary="5\u201318 \u00b0C, light wind protection, breathable",
        ),
        Product(
            id="prod-008",
            name="Vaude Luminum Rain Pants",
            category_id="cat-pants",
            image_url="/products/vaude-luminum.jpg",
            price=99.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B07STU9012?tag=bikeweather-21",
            matches_zone="lowerBody",
            matches_label="Waterproof Overpants",
            weather_temp_min=0,
            weather_temp_max=20,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="0\u201320 \u00b0C, waterproof, windproof, reflective",
        ),
        Product(
            id="prod-009",
            name="Shimano S-Phyre Tall Overshoes",
            category_id="cat-shoes",
            image_url="/products/shimano-overshoes.jpg",
            price=69.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B08VWX3456?tag=bikeweather-21",
            matches_zone="feet",
            matches_label="Waterproof Overshoes",
            weather_temp_min=-5,
            weather_temp_max=10,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-5\u201310 \u00b0C, waterproof, windproof",
        ),
        Product(
            id="prod-010",
            name="Ortlieb Dry Bag PS10 1.5L",
            category_id="cat-accessories",
            image_url="/products/ortlieb-drybag.jpg",
            price=14.95,
            currency="EUR",
            shop_id="shop-amazon",
            affiliate_url="https://www.amazon.de/dp/B01YZA7890?tag=bikeweather-21",
            matches_zone=None,
            matches_label="Dry Bag for Valuables",
            weather_temp_min=None,
            weather_temp_max=None,
            weather_precipitation="heavy-rain",
            weather_wind="none",
            weather_summary="All temperatures, 100% waterproof (IP67)",
        ),
    ]
    for product in products:
        existing = await session.get(Product, product.id)
        if not existing:
            session.add(product)


async def _seed_disclosure(session: AsyncSession) -> None:
    result = await session.execute(select(AffiliateDisclosure))
    if not result.scalars().first():
        session.add(
            AffiliateDisclosure(
                badge_label="Ad",
                disclaimer_text=(
                    "Links marked with * are affiliate links. If you purchase through "
                    "these links we receive a small commission \u2014 the price for you stays the same."
                ),
            )
        )


async def _seed_faq(session: AsyncSession) -> None:
    items = [
        FaqItem(
            id="was-ist-fahrrad-wetter",
            question="What is Fahrrad Wetter?",
            answer=(
                "Fahrrad Wetter is a free web app that provides personalized clothing and gear "
                "recommendations for your bike ride based on real-time weather data. Simply enter "
                "your starting location, bike type, and riding style \u2014 and you\u2019ll get a "
                "recommendation for what to wear and pack."
            ),
            category="General",
            display_order=0,
        ),
        FaqItem(
            id="kostenlos",
            question="Is Fahrrad Wetter free?",
            answer=(
                "Yes, completely free. The app is funded through advertising and affiliate links "
                "to recommended products. You don\u2019t pay anything extra."
            ),
            category="General",
            display_order=1,
        ),
        FaqItem(
            id="account-noetig",
            question="Do I need an account?",
            answer=(
                "No. The core feature \u2014 weather lookup and clothing recommendation \u2014 works "
                "entirely without signing up. An optional account lets you save routes and reuse "
                "them more quickly."
            ),
            category="General",
            display_order=2,
        ),
        FaqItem(
            id="wetterdaten-quelle",
            question="Where does the weather data come from?",
            answer=(
                "The weather data comes from professional weather services and is retrieved in "
                "real time via standardized APIs. This ensures you always get up-to-date forecasts "
                "for your location."
            ),
            category="Weather data",
            display_order=3,
        ),
        FaqItem(
            id="vorhersage-genauigkeit",
            question="How accurate are the forecasts?",
            answer=(
                "The accuracy matches that of the underlying weather services. For the next "
                "1\u20133 days, forecasts are generally very reliable. The further into the future, "
                "the less accurate they become \u2014 as with any weather forecast."
            ),
            category="Weather data",
            display_order=4,
        ),
        FaqItem(
            id="zukunft-wetter",
            question="Can I also check the weather for tomorrow or the day after?",
            answer=(
                "Yes, you can select any date in the future. Keep in mind, however, that forecast "
                "accuracy decreases over time."
            ),
            category="Weather data",
            display_order=5,
        ),
        FaqItem(
            id="empfehlung-berechnung",
            question="How are the clothing recommendations calculated?",
            answer=(
                "From the combination of temperature, wind speed, precipitation probability, your "
                "bike type, and your planned intensity. Each factor affects how warm or cold "
                "you\u2019ll feel on the bike \u2014 for example, a sporty rider on a road bike needs "
                "less insulation than a leisurely city cyclist."
            ),
            category="Recommendations",
            display_order=6,
        ),
        FaqItem(
            id="empfehlung-individuell",
            question="Do the recommendations fit everyone?",
            answer=(
                "The recommendations are a well-founded starting point. Personal sensitivity to "
                "cold or heat varies \u2014 after a few rides with the app, you\u2019ll know whether "
                "you tend to need one layer more or less."
            ),
            category="Recommendations",
            display_order=7,
        ),
        FaqItem(
            id="standort-warum",
            question="Why does the app ask for my location?",
            answer=(
                "To retrieve the weather data for your exact starting location. You can also "
                "manually enter an address or city if you don\u2019t want to use GPS location."
            ),
            category="Technical",
            display_order=8,
        ),
        FaqItem(
            id="offline",
            question="Does the app work offline?",
            answer=(
                "No, an internet connection is required for current weather data. The app fetches "
                "fresh data with every request to give you the most accurate recommendation."
            ),
            category="Technical",
            display_order=9,
        ),
    ]
    for item in items:
        existing = await session.get(FaqItem, item.id)
        if not existing:
            session.add(item)


async def _seed_about(session: AsyncSession) -> None:
    sections = [
        AboutContent(
            section_key="idea",
            title="The idea",
            body=(
                "One day I got tired of checking the weather app before every ride and still "
                "being dressed wrong. Too warm, too cold, no rain gear \u2014 every cyclist "
                "probably knows the feeling. I looked for a solution and couldn\u2019t find "
                "anything useful. So I built one myself."
            ),
            display_order=0,
        ),
        AboutContent(
            section_key="who",
            title="Who is this for?",
            body=(
                "Of course, over time you develop a feel for what to wear in different weather. "
                "But especially for beginners, casual riders, or people planning a longer tour or "
                "bikepacking adventure, it helps to get a quick, reliable recommendation \u2014 "
                "without having to interpret weather data yourself."
            ),
            display_order=1,
        ),
        AboutContent(
            section_key="passion",
            title="A passion project",
            body=(
                "Fahrrad Wetter is constantly being improved. I welcome feedback, suggestions, "
                "and ideas. If the app helps you on your rides and makes a positive difference, "
                "the work has been worth it."
            ),
            display_order=2,
        ),
    ]
    for section in sections:
        result = await session.execute(
            select(AboutContent).where(AboutContent.section_key == section.section_key)
        )
        if not result.scalars().first():
            session.add(section)


async def run_seed(session: AsyncSession) -> None:
    await _seed_shops(session)
    await _seed_categories(session)
    await _seed_products(session)
    await _seed_disclosure(session)
    await _seed_faq(session)
    await _seed_about(session)
    await session.commit()
