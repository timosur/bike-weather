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
from app.models.content_translation import ContentTranslation
from app.models.user import User


async def _seed_admin_user(session: AsyncSession) -> None:
    """Create or promote the default admin user for local development.

    If the user already exists (e.g. created by OIDC first-login), promote
    them to admin.  Otherwise create a placeholder row that will be adopted
    when the Authentik akadmin user logs in for the first time.
    """
    email = "admin@bike-weather.local"
    existing = await session.execute(select(User).where(User.email == email))
    user = existing.scalars().first()
    if user:
        if not user.is_admin:
            user.is_admin = True
    else:
        session.add(
            User(
                external_id="local-admin",
                email=email,
                name="Admin",
                is_admin=True,
            )
        )


async def _seed_shops(session: AsyncSession) -> None:
    shops = [
        Shop(
            id="shop-bike-components",
            name="bike-components.de",
            logo_url="/logos/bike-components.svg",
            affiliate_tag=None,
        ),
    ]
    for shop in shops:
        existing = await session.get(Shop, shop.id)
        if not existing:
            session.add(shop)


async def _seed_categories(session: AsyncSession) -> None:
    categories = [
        ProductCategory(
            id="cat-jackets",
            name="Fahrradjacken",
            slug="cycling-jackets",
            icon="jacket",
            display_order=0,
        ),
        ProductCategory(
            id="cat-gloves",
            name="Radhandschuhe",
            slug="cycling-gloves",
            icon="gloves",
            display_order=1,
        ),
        ProductCategory(
            id="cat-pants",
            name="Radhosen",
            slug="cycling-tights",
            icon="pants",
            display_order=2,
        ),
        ProductCategory(
            id="cat-headwear",
            name="Kopfbedeckung",
            slug="headwear",
            icon="headwear",
            display_order=3,
        ),
        ProductCategory(
            id="cat-shoes",
            name="Radschuhe & Überschuhe",
            slug="cycling-shoes-overshoes",
            icon="shoes",
            display_order=4,
        ),
        ProductCategory(
            id="cat-lights",
            name="Fahrradlichter",
            slug="bike-lights",
            icon="light",
            display_order=5,
        ),
        ProductCategory(
            id="cat-accessories",
            name="Zubehör & Ausrüstung",
            slug="accessories-gear",
            icon="accessories",
            display_order=6,
        ),
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
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B07XYZ1234?tag=bikeweather-21",
            matches_zone="upperBody",
            matches_label="Wasserdichte Radjacke",
            weather_temp_min=-5,
            weather_temp_max=15,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-5\u201315 \u00b0C, wasserdicht, winddicht",
        ),
        Product(
            id="prod-002",
            name="Castelli Perfetto RoS 2 Long-sleeve Jersey",
            category_id="cat-jackets",
            image_url="/products/castelli-perfetto.jpg",
            price=219.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B09ABC5678?tag=bikeweather-21",
            matches_zone="upperBody",
            matches_label="Langarm-Radtrikot",
            weather_temp_min=8,
            weather_temp_max=18,
            weather_precipitation="light-rain",
            weather_wind="strong-wind",
            weather_summary="8\u201318 \u00b0C, wasserabweisend, winddicht",
        ),
        Product(
            id="prod-003",
            name="GripGrab Ride Windproof Winter Gloves",
            category_id="cat-gloves",
            image_url="/products/gripgrab-winter.jpg",
            price=54.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B08DEF9012?tag=bikeweather-21",
            matches_zone="hands",
            matches_label="Wasserdichte Winterhandschuhe",
            weather_temp_min=-10,
            weather_temp_max=5,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-10\u20135 \u00b0C, wasserdicht, winddicht",
        ),
        Product(
            id="prod-004",
            name="Roeckl Illano Summer Gloves",
            category_id="cat-gloves",
            image_url="/products/roeckl-illano.jpg",
            price=34.90,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B07GHI3456?tag=bikeweather-21",
            matches_zone="hands",
            matches_label="Leichte Radhandschuhe",
            weather_temp_min=15,
            weather_temp_max=35,
            weather_precipitation="none",
            weather_wind="none",
            weather_summary="15\u201335 \u00b0C, trocken, Polsterung & Grip",
        ),
        Product(
            id="prod-005",
            name="Assos Mille GT Thermo Cycling Tights",
            category_id="cat-pants",
            image_url="/products/assos-mille-thermo.jpg",
            price=189.00,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B09JKL7890?tag=bikeweather-21",
            matches_zone="lowerBody",
            matches_label="Thermo-Radhose",
            weather_temp_min=-5,
            weather_temp_max=10,
            weather_precipitation="light-rain",
            weather_wind="light-wind",
            weather_summary="-5\u201310 \u00b0C, leicht wasserabweisend, Thermofutter",
        ),
        Product(
            id="prod-006",
            name="Sigma Aura 80 / Blaze Light Set",
            category_id="cat-lights",
            image_url="/products/sigma-aura80.jpg",
            price=59.99,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B08MNO1234?tag=bikeweather-21",
            matches_zone=None,
            matches_label="Fahrradlichter (vorne + hinten)",
            weather_temp_min=None,
            weather_temp_max=None,
            weather_precipitation="heavy-rain",
            weather_wind="none",
            weather_summary="Alle Temperaturen, wetterfest, IPX4",
        ),
        Product(
            id="prod-007",
            name="Buff Merino Lightweight Headband",
            category_id="cat-headwear",
            image_url="/products/buff-merino.jpg",
            price=24.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B06PQR5678?tag=bikeweather-21",
            matches_zone="head",
            matches_label="Leichtes Stirnband",
            weather_temp_min=5,
            weather_temp_max=18,
            weather_precipitation="none",
            weather_wind="light-wind",
            weather_summary="5\u201318 \u00b0C, leichter Windschutz, atmungsaktiv",
        ),
        Product(
            id="prod-008",
            name="Vaude Luminum Rain Pants",
            category_id="cat-pants",
            image_url="/products/vaude-luminum.jpg",
            price=99.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B07STU9012?tag=bikeweather-21",
            matches_zone="lowerBody",
            matches_label="Wasserdichte Überhose",
            weather_temp_min=0,
            weather_temp_max=20,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="0\u201320 \u00b0C, wasserdicht, winddicht, reflektierend",
        ),
        Product(
            id="prod-009",
            name="Shimano S-Phyre Tall Overshoes",
            category_id="cat-shoes",
            image_url="/products/shimano-overshoes.jpg",
            price=69.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B08VWX3456?tag=bikeweather-21",
            matches_zone="feet",
            matches_label="Wasserdichte Überschuhe",
            weather_temp_min=-5,
            weather_temp_max=10,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-5\u201310 \u00b0C, wasserdicht, winddicht",
        ),
        Product(
            id="prod-010",
            name="Ortlieb Dry Bag PS10 1.5L",
            category_id="cat-accessories",
            image_url="/products/ortlieb-drybag.jpg",
            price=14.95,
            currency="EUR",
            shop_id="shop-bike-components",
            affiliate_url="https://www.amazon.de/dp/B01YZA7890?tag=bikeweather-21",
            matches_zone=None,
            matches_label="Dry Bag für Wertsachen",
            weather_temp_min=None,
            weather_temp_max=None,
            weather_precipitation="heavy-rain",
            weather_wind="none",
            weather_summary="Alle Temperaturen, 100% wasserdicht (IP67)",
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
                badge_label="Anzeige",
                disclaimer_text=(
                    "Mit * gekennzeichnete Links sind Affiliate-Links. Bei einem Kauf über "
                    "diese Links erhalten wir eine kleine Provision \u2014 der Preis für dich bleibt gleich."
                ),
            )
        )


async def _seed_faq(session: AsyncSession) -> None:
    items = [
        FaqItem(
            id="was-ist-fahrrad-wetter",
            question="Was ist Fahrrad Wetter?",
            answer=(
                "Fahrrad Wetter ist eine kostenlose Web-App, die dir personalisierte Kleidungs- und "
                "Ausr\u00fcstungsempfehlungen f\u00fcr deine Radtour gibt \u2014 basierend auf aktuellen "
                "Wetterdaten. Gib einfach deinen Startort, Fahrradtyp und Fahrstil ein und erhalte "
                "eine Empfehlung, was du anziehen und einpacken solltest."
            ),
            category="Allgemein",
            display_order=0,
        ),
        FaqItem(
            id="kostenlos",
            question="Ist Fahrrad Wetter kostenlos?",
            answer=(
                "Ja, komplett kostenlos. Die App finanziert sich \u00fcber Werbung und Affiliate-Links "
                "zu empfohlenen Produkten. Du zahlst keinen Cent extra."
            ),
            category="Allgemein",
            display_order=1,
        ),
        FaqItem(
            id="account-noetig",
            question="Brauche ich ein Konto?",
            answer=(
                "Nein. Die Kernfunktion \u2014 Wetterabfrage und Kleidungsempfehlung \u2014 funktioniert "
                "komplett ohne Anmeldung. Ein optionales Konto erm\u00f6glicht es dir, Routen zu "
                "speichern und schneller wiederzuverwenden."
            ),
            category="Allgemein",
            display_order=2,
        ),
        FaqItem(
            id="wetterdaten-quelle",
            question="Woher kommen die Wetterdaten?",
            answer=(
                "Die Wetterdaten stammen von professionellen Wetterdiensten und werden in "
                "Echtzeit \u00fcber standardisierte APIs abgerufen. So erh\u00e4ltst du immer "
                "aktuelle Vorhersagen f\u00fcr deinen Standort."
            ),
            category="Wetterdaten",
            display_order=3,
        ),
        FaqItem(
            id="vorhersage-genauigkeit",
            question="Wie genau sind die Vorhersagen?",
            answer=(
                "Die Genauigkeit entspricht der der zugrunde liegenden Wetterdienste. F\u00fcr die "
                "n\u00e4chsten 1\u20133 Tage sind die Vorhersagen in der Regel sehr zuverl\u00e4ssig. "
                "Je weiter in die Zukunft, desto weniger genau \u2014 wie bei jeder Wettervorhersage."
            ),
            category="Wetterdaten",
            display_order=4,
        ),
        FaqItem(
            id="zukunft-wetter",
            question="Kann ich auch das Wetter f\u00fcr morgen oder \u00fcbermorgen abfragen?",
            answer=(
                "Ja, du kannst ein beliebiges Datum in der Zukunft w\u00e4hlen. Beachte jedoch, "
                "dass die Vorhersagegenauigkeit mit der Zeit abnimmt."
            ),
            category="Wetterdaten",
            display_order=5,
        ),
        FaqItem(
            id="empfehlung-berechnung",
            question="Wie werden die Kleidungsempfehlungen berechnet?",
            answer=(
                "Aus der Kombination von Temperatur, Windgeschwindigkeit, Niederschlagswahrscheinlichkeit, "
                "deinem Fahrradtyp und deiner geplanten Intensit\u00e4t. Jeder Faktor beeinflusst, "
                "wie warm oder kalt du dich auf dem Rad f\u00fchlst \u2014 ein sportlicher Rennradfahrer "
                "braucht zum Beispiel weniger Isolierung als ein gem\u00fctlicher Stadtradler."
            ),
            category="Empfehlungen",
            display_order=6,
        ),
        FaqItem(
            id="empfehlung-individuell",
            question="Passen die Empfehlungen f\u00fcr jeden?",
            answer=(
                "Die Empfehlungen sind ein fundierter Ausgangspunkt. Die pers\u00f6nliche K\u00e4lte- "
                "oder W\u00e4rmeempfindlichkeit variiert \u2014 nach ein paar Fahrten mit der App "
                "wei\u00dft du, ob du eher eine Schicht mehr oder weniger brauchst."
            ),
            category="Empfehlungen",
            display_order=7,
        ),
        FaqItem(
            id="standort-warum",
            question="Warum fragt die App nach meinem Standort?",
            answer=(
                "Um die Wetterdaten f\u00fcr deinen genauen Startort abzurufen. Du kannst auch "
                "manuell eine Adresse oder Stadt eingeben, wenn du die GPS-Ortung nicht nutzen m\u00f6chtest."
            ),
            category="Technisches",
            display_order=8,
        ),
        FaqItem(
            id="offline",
            question="Funktioniert die App offline?",
            answer=(
                "Nein, eine Internetverbindung ist f\u00fcr aktuelle Wetterdaten erforderlich. "
                "Die App ruft bei jeder Anfrage frische Daten ab, um dir die genaueste "
                "Empfehlung zu geben."
            ),
            category="Technisches",
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
            title="Die Idee",
            body=(
                "Eines Tages hatte ich es satt, vor jeder Fahrt die Wetter-App zu checken und "
                "trotzdem falsch angezogen zu sein. Zu warm, zu kalt, keine Regenjacke \u2014 das "
                "kennt wahrscheinlich jeder Radfahrer. Ich suchte nach einer L\u00f6sung und fand "
                "nichts Brauchbares. Also baute ich selbst eine."
            ),
            display_order=0,
        ),
        AboutContent(
            section_key="who",
            title="F\u00fcr wen ist das?",
            body=(
                "Nat\u00fcrlich entwickelt man mit der Zeit ein Gef\u00fchl daf\u00fcr, was man bei "
                "welchem Wetter anziehen sollte. Aber gerade f\u00fcr Anf\u00e4nger, Gelegenheitsfahrer "
                "oder Leute, die eine l\u00e4ngere Tour oder ein Bikepacking-Abenteuer planen, hilft "
                "es, eine schnelle, zuverl\u00e4ssige Empfehlung zu bekommen \u2014 ohne selbst "
                "Wetterdaten interpretieren zu m\u00fcssen."
            ),
            display_order=1,
        ),
        AboutContent(
            section_key="passion",
            title="Ein Herzensprojekt",
            body=(
                "Fahrrad Wetter wird st\u00e4ndig verbessert. Ich freue mich \u00fcber Feedback, "
                "Vorschl\u00e4ge und Ideen. Wenn die App dir auf deinen Fahrten hilft und einen "
                "positiven Unterschied macht, hat sich die Arbeit gelohnt."
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


async def _seed_translations(session: AsyncSession) -> None:
    """Seed English translations for all German-default content."""

    translations: list[dict[str, str]] = [
        # --- Product categories ---
        {
            "entity_type": "product_category",
            "entity_id": "cat-jackets",
            "locale": "en",
            "field_name": "name",
            "value": "Cycling Jackets",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-gloves",
            "locale": "en",
            "field_name": "name",
            "value": "Cycling Gloves",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-pants",
            "locale": "en",
            "field_name": "name",
            "value": "Cycling Tights",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-headwear",
            "locale": "en",
            "field_name": "name",
            "value": "Headwear",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-shoes",
            "locale": "en",
            "field_name": "name",
            "value": "Cycling Shoes & Overshoes",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-lights",
            "locale": "en",
            "field_name": "name",
            "value": "Bike Lights",
        },
        {
            "entity_type": "product_category",
            "entity_id": "cat-accessories",
            "locale": "en",
            "field_name": "name",
            "value": "Accessories & Gear",
        },
        # --- Products (matches_label + weather_summary) ---
        {
            "entity_type": "product",
            "entity_id": "prod-001",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Waterproof Cycling Jacket",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-001",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "-5\u201315 \u00b0C, waterproof, windproof",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-002",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Long-sleeve Cycling Jersey",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-002",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "8\u201318 \u00b0C, water-resistant, windproof",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-003",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Waterproof Winter Gloves",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-003",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "-10\u20135 \u00b0C, waterproof, windproof",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-004",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Lightweight Cycling Gloves",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-004",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "15\u201335 \u00b0C, dry, padding & grip",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-005",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Thermal Cycling Tights",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-005",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "-5\u201310 \u00b0C, lightly water-resistant, thermal lining",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-006",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Bike Lights (front + rear)",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-006",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "All temperatures, weatherproof, IPX4",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-007",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Lightweight Headband",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-007",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "5\u201318 \u00b0C, light wind protection, breathable",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-008",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Waterproof Over-pants",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-008",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "0\u201320 \u00b0C, waterproof, windproof, reflective",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-009",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Waterproof Overshoes",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-009",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "-5\u201310 \u00b0C, waterproof, windproof",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-010",
            "locale": "en",
            "field_name": "matches_label",
            "value": "Dry Bag for Valuables",
        },
        {
            "entity_type": "product",
            "entity_id": "prod-010",
            "locale": "en",
            "field_name": "weather_summary",
            "value": "All temperatures, 100% waterproof (IP67)",
        },
        # --- Affiliate disclosure ---
        {
            "entity_type": "affiliate_disclosure",
            "entity_id": "1",
            "locale": "en",
            "field_name": "badge_label",
            "value": "Sponsored",
        },
        {
            "entity_type": "affiliate_disclosure",
            "entity_id": "1",
            "locale": "en",
            "field_name": "disclaimer_text",
            "value": "Links marked with * are affiliate links. If you purchase through these links we receive a small commission \u2014 at no extra cost to you.",
        },
        # --- FAQ items ---
        {
            "entity_type": "faq_item",
            "entity_id": "was-ist-fahrrad-wetter",
            "locale": "en",
            "field_name": "question",
            "value": "What is Fahrrad Wetter?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "was-ist-fahrrad-wetter",
            "locale": "en",
            "field_name": "answer",
            "value": "Fahrrad Wetter is a free web app that gives you personalised clothing and gear recommendations for your bike ride \u2014 based on real-time weather data. Simply enter your starting location, bike type, and riding style to receive advice on what to wear and pack.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "was-ist-fahrrad-wetter",
            "locale": "en",
            "field_name": "category",
            "value": "General",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "kostenlos",
            "locale": "en",
            "field_name": "question",
            "value": "Is Fahrrad Wetter free?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "kostenlos",
            "locale": "en",
            "field_name": "answer",
            "value": "Yes, completely free. The app is funded by ads and affiliate links to recommended products. You never pay a cent extra.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "kostenlos",
            "locale": "en",
            "field_name": "category",
            "value": "General",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "account-noetig",
            "locale": "en",
            "field_name": "question",
            "value": "Do I need an account?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "account-noetig",
            "locale": "en",
            "field_name": "answer",
            "value": "No. The core feature \u2014 weather lookup and clothing recommendation \u2014 works without signing in. An optional account lets you save routes for quick reuse.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "account-noetig",
            "locale": "en",
            "field_name": "category",
            "value": "General",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "wetterdaten-quelle",
            "locale": "en",
            "field_name": "question",
            "value": "Where does the weather data come from?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "wetterdaten-quelle",
            "locale": "en",
            "field_name": "answer",
            "value": "Weather data comes from professional weather services and is fetched in real time via standardised APIs, so you always get up-to-date forecasts for your location.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "wetterdaten-quelle",
            "locale": "en",
            "field_name": "category",
            "value": "Weather Data",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "vorhersage-genauigkeit",
            "locale": "en",
            "field_name": "question",
            "value": "How accurate are the forecasts?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "vorhersage-genauigkeit",
            "locale": "en",
            "field_name": "answer",
            "value": "Accuracy matches the underlying weather services. For the next 1\u20133 days forecasts are usually very reliable. Further out they become less precise \u2014 as with any weather forecast.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "vorhersage-genauigkeit",
            "locale": "en",
            "field_name": "category",
            "value": "Weather Data",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "zukunft-wetter",
            "locale": "en",
            "field_name": "question",
            "value": "Can I check the weather for tomorrow or the day after?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "zukunft-wetter",
            "locale": "en",
            "field_name": "answer",
            "value": "Yes, you can choose any future date. Keep in mind that forecast accuracy decreases over time.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "zukunft-wetter",
            "locale": "en",
            "field_name": "category",
            "value": "Weather Data",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-berechnung",
            "locale": "en",
            "field_name": "question",
            "value": "How are clothing recommendations calculated?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-berechnung",
            "locale": "en",
            "field_name": "answer",
            "value": "From the combination of temperature, wind speed, precipitation probability, your bike type and planned intensity. Each factor affects how warm or cold you feel on the bike \u2014 a sporty road cyclist needs less insulation than a leisurely commuter, for example.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-berechnung",
            "locale": "en",
            "field_name": "category",
            "value": "Recommendations",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-individuell",
            "locale": "en",
            "field_name": "question",
            "value": "Do the recommendations fit everyone?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-individuell",
            "locale": "en",
            "field_name": "answer",
            "value": "The recommendations are a well-founded starting point. Personal sensitivity to cold or heat varies \u2014 after a few rides with the app you\u2019ll know whether you tend to need one layer more or less.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "empfehlung-individuell",
            "locale": "en",
            "field_name": "category",
            "value": "Recommendations",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "standort-warum",
            "locale": "en",
            "field_name": "question",
            "value": "Why does the app ask for my location?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "standort-warum",
            "locale": "en",
            "field_name": "answer",
            "value": "To fetch weather data for your exact starting point. You can also enter an address or city manually if you prefer not to use GPS.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "standort-warum",
            "locale": "en",
            "field_name": "category",
            "value": "Technical",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "offline",
            "locale": "en",
            "field_name": "question",
            "value": "Does the app work offline?",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "offline",
            "locale": "en",
            "field_name": "answer",
            "value": "No, an internet connection is required for live weather data. The app fetches fresh data with every request to give you the most accurate recommendation.",
        },
        {
            "entity_type": "faq_item",
            "entity_id": "offline",
            "locale": "en",
            "field_name": "category",
            "value": "Technical",
        },
        # --- About content ---
        {
            "entity_type": "about_content",
            "entity_id": "idea",
            "locale": "en",
            "field_name": "title",
            "value": "The idea",
        },
        {
            "entity_type": "about_content",
            "entity_id": "idea",
            "locale": "en",
            "field_name": "body",
            "value": "One day I got tired of checking the weather app before every ride and still being dressed wrong. Too warm, too cold, no rain gear \u2014 every cyclist probably knows the feeling. I looked for a solution and couldn\u2019t find anything useful. So I built one myself.",
        },
        {
            "entity_type": "about_content",
            "entity_id": "who",
            "locale": "en",
            "field_name": "title",
            "value": "Who is this for?",
        },
        {
            "entity_type": "about_content",
            "entity_id": "who",
            "locale": "en",
            "field_name": "body",
            "value": "Of course, over time you develop a feel for what to wear in different weather. But especially for beginners, casual riders, or people planning a longer tour or bikepacking adventure, it helps to get a quick, reliable recommendation \u2014 without having to interpret weather data yourself.",
        },
        {
            "entity_type": "about_content",
            "entity_id": "passion",
            "locale": "en",
            "field_name": "title",
            "value": "A passion project",
        },
        {
            "entity_type": "about_content",
            "entity_id": "passion",
            "locale": "en",
            "field_name": "body",
            "value": "Fahrrad Wetter is constantly being improved. I welcome feedback, suggestions, and ideas. If the app helps you on your rides and makes a positive difference, the work has been worth it.",
        },
    ]

    for t in translations:
        result = await session.execute(
            select(ContentTranslation).where(
                ContentTranslation.entity_type == t["entity_type"],
                ContentTranslation.entity_id == t["entity_id"],
                ContentTranslation.locale == t["locale"],
                ContentTranslation.field_name == t["field_name"],
            )
        )
        if not result.scalars().first():
            session.add(ContentTranslation(**t))


async def run_seed(session: AsyncSession) -> None:
    await _seed_admin_user(session)
    await _seed_shops(session)
    await _seed_categories(session)
    await _seed_products(session)
    await _seed_disclosure(session)
    await _seed_faq(session)
    await _seed_about(session)
    await _seed_translations(session)
    await session.commit()
