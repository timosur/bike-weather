"""Locale-aware text for clothing rules, equipment rules, weather descriptions, and labels."""

from typing import TypedDict


class ItemTranslation(TypedDict):
    name: str
    reason: str  # f-string template with placeholders


def temp_range_str(temp_min: float, temp_max: float) -> str:
    """Return 'X' when min==max, otherwise 'X–Y'."""
    if round(temp_min) == round(temp_max):
        return f"{temp_min:.0f}"
    return f"{temp_min:.0f}–{temp_max:.0f}"


# ---------------------------------------------------------------------------
# Clothing item translations keyed by (item_id, locale)
# ---------------------------------------------------------------------------
CLOTHING_TRANSLATIONS: dict[tuple[str, str], ItemTranslation] = {
    # --- HEAD ---
    ("cl-helmet-cover", "de"): {
        "name": "Wasserdichter Helmüberzug",
        "reason": "Hält den Kopf warm und trocken bei {temp_min:.0f}°C.",
    },
    ("cl-helmet-cover", "en"): {
        "name": "Waterproof Helmet Cover",
        "reason": "Keeps head warm and dry at {temp_min:.0f}°C.",
    },
    ("cl-headband", "de"): {
        "name": "Leichtes Stirnband",
        "reason": "Schützt die Ohren vor kühlem Fahrtwind bei {temp_min:.0f}°C.",
    },
    ("cl-headband", "en"): {
        "name": "Light Headband",
        "reason": "Protects ears from cool riding wind at {temp_min:.0f}°C.",
    },
    ("cl-cycling-cap", "de"): {
        "name": "Radmütze",
        "reason": "Sonnenschutz unter dem Helm bei {temp_max:.0f}°C.",
    },
    ("cl-cycling-cap", "en"): {
        "name": "Cycling Cap",
        "reason": "Sun protection under helmet at {temp_max:.0f}°C.",
    },
    # --- EYES ---
    ("cl-sunglasses", "de"): {
        "name": "Sport-Sonnenbrille",
        "reason": "UV-Index {uv_index:.0f} — schützt die Augen vor Blendung und Insekten.",
    },
    ("cl-sunglasses", "en"): {
        "name": "Sports Sunglasses",
        "reason": "UV index {uv_index:.0f} — protects eyes from glare and insects.",
    },
    ("cl-glasses", "de"): {
        "name": "Klare Radbrille",
        "reason": "Schützt die Augen vor Spritzwasser und Regen bei {precip:.0f}% Niederschlag.",
    },
    ("cl-glasses", "en"): {
        "name": "Clear Cycling Glasses",
        "reason": "Protects eyes from spray and rain at {precip:.0f}% precipitation.",
    },
    ("cl-glasses-wind", "de"): {
        "name": "Radbrille (Windschutz)",
        "reason": "Gut abschließend — schützt die Augen vor kalter Zugluft bei {feels:.0f}°C.",
    },
    ("cl-glasses-wind", "en"): {
        "name": "Cycling Glasses (Wind Protection)",
        "reason": "Close-fitting — protects eyes from cold drafts at {feels:.0f}°C.",
    },
    # --- NECK / FACE ---
    ("cl-neck-gaiter", "de"): {
        "name": "Halstuch / Nackenschutz",
        "reason": "Schützt Hals und Nacken vor Kälte bei {feels:.0f}°C.",
    },
    ("cl-neck-gaiter", "en"): {
        "name": "Neck Gaiter",
        "reason": "Protects neck from cold at {feels:.0f}°C.",
    },
    ("cl-face-mask", "de"): {
        "name": "Gesichtsmaske / Atemschutz",
        "reason": "Schützt Atemwege und Gesicht vor Kälte bei {feels:.0f}°C.",
    },
    ("cl-face-mask", "en"): {
        "name": "Face Mask",
        "reason": "Protects airways and face from cold at {feels:.0f}°C.",
    },
    # --- BASE LAYER ---
    ("cl-base-merino", "de"): {
        "name": "Merino-Baselayer",
        "reason": "Isoliert und reguliert die Körperwärme bei {feels:.0f}°C gefühlt.",
    },
    ("cl-base-merino", "en"): {
        "name": "Merino Base Layer",
        "reason": "Insulates and regulates body heat at {feels:.0f}°C feels-like.",
    },
    ("cl-base-wicking", "de"): {
        "name": "Feuchtigkeitsableitendes Unterhemd",
        "reason": "Transportiert Schweiß von der Haut bei {feels:.0f}°C.",
    },
    ("cl-base-wicking", "en"): {
        "name": "Moisture-wicking Base Layer",
        "reason": "Moves sweat away from skin at {feels:.0f}°C.",
    },
    # --- MID / JERSEY ---
    ("cl-thermal-jersey", "de"): {
        "name": "Thermo-Langarmtrikot",
        "reason": "Starke Isolierung bei frostigen {feels:.0f}°C gefühlt.",
    },
    ("cl-thermal-jersey", "en"): {
        "name": "Thermal Long-sleeve Jersey",
        "reason": "Heavy insulation for freezing {feels:.0f}°C feels-like temperature.",
    },
    ("cl-jersey-long", "de"): {
        "name": "Langarm-Radtrikot",
        "reason": "Wärme bei {temp_range}°C ohne Überhitzung.",
    },
    ("cl-jersey-long", "en"): {
        "name": "Long-sleeve Cycling Jersey",
        "reason": "Warmth at {temp_range}°C without overheating.",
    },
    ("cl-jersey-arm", "de"): {"name": "Kurzarmtrikot + Armlinge", "reason": ""},
    ("cl-jersey-arm", "en"): {
        "name": "Short-sleeve Jersey + Arm Warmers",
        "reason": "",
    },
    ("cl-jersey-long-light", "de"): {
        "name": "Leichtes Langarm-Radtrikot",
        "reason": "Leichte Abdeckung bei {temp_range}°C, Ärmel aufrollbar.",
    },
    ("cl-jersey-long-light", "en"): {
        "name": "Long-sleeve Cycling Jersey",
        "reason": "Light coverage at {temp_range}°C, can roll up sleeves.",
    },
    ("cl-jersey-short-alt", "de"): {"name": "Kurzarmtrikot + Armlinge", "reason": ""},
    ("cl-jersey-short-alt", "en"): {
        "name": "Short-sleeve Jersey + Arm Warmers",
        "reason": "",
    },
    ("cl-jersey-short", "de"): {
        "name": "Kurzarm-Radtrikot",
        "reason": "Atmungsaktiv bei {temp_max:.0f}°C, hält kühl.",
    },
    ("cl-jersey-short", "en"): {
        "name": "Short-sleeve Cycling Jersey",
        "reason": "Breathable at {temp_max:.0f}°C, keeps you cool.",
    },
    ("cl-jersey-sleeveless", "de"): {
        "name": "Ärmelloses Radtrikot",
        "reason": "Maximale Belüftung bei {temp_max:.0f}°C Hitze.",
    },
    ("cl-jersey-sleeveless", "en"): {
        "name": "Sleeveless Cycling Jersey",
        "reason": "Maximum ventilation in {temp_max:.0f}°C heat.",
    },
    # --- OUTER LAYER ---
    ("cl-rain-jacket", "de"): {
        "name": "Wasserdichte Radjacke",
        "reason": "Unverzichtbar bei {precip:.0f}% Regenwahrscheinlichkeit — versiegelte Nähte halten trocken.",
    },
    ("cl-rain-jacket", "en"): {
        "name": "Waterproof Cycling Jacket",
        "reason": "Essential at {precip:.0f}% rain probability — sealed seams keep you dry.",
    },
    ("cl-packable-rain", "de"): {
        "name": "Packbare Regenjacke",
        "reason": "Einpacken bei {precip:.0f}% Regenrisiko — schnell angezogen.",
    },
    ("cl-packable-rain", "en"): {
        "name": "Packable Rain Jacket",
        "reason": "Pack along at {precip:.0f}% rain chance — quick to put on.",
    },
    ("cl-vest-alt", "de"): {"name": "Leichte Windweste", "reason": ""},
    ("cl-vest-alt", "en"): {"name": "Light Wind Vest", "reason": ""},
    ("cl-wind-jacket", "de"): {
        "name": "Windjacke",
        "reason": "Voller Windschutz bei {wind:.0f} km/h.",
    },
    ("cl-wind-jacket", "en"): {
        "name": "Wind Jacket",
        "reason": "Full wind protection at {wind:.0f} km/h.",
    },
    ("cl-wind-vest", "de"): {
        "name": "Leichte Windweste",
        "reason": "Hält den Wind vom Oberkörper fern bei {wind:.0f} km/h.",
    },
    ("cl-wind-vest", "en"): {
        "name": "Light Wind Vest",
        "reason": "Keeps wind off your core at {wind:.0f} km/h.",
    },
    ("cl-jacket-alt", "de"): {"name": "Packbare Windjacke", "reason": ""},
    ("cl-jacket-alt", "en"): {"name": "Packable Wind Jacket", "reason": ""},
    ("cl-insulated-jacket", "de"): {
        "name": "Isolierte Radjacke",
        "reason": "Zusätzliche Wärme bei {feels:.0f}°C gefühlt.",
    },
    ("cl-insulated-jacket", "en"): {
        "name": "Insulated Cycling Jacket",
        "reason": "Extra warmth at {feels:.0f}°C feels-like temperature.",
    },
    ("cl-windstopper-jacket", "de"): {
        "name": "Windstopper-Radjacke",
        "reason": "Winddicht und isolierend bei {feels:.0f}°C — Standard unter 10°C.",
    },
    ("cl-windstopper-jacket", "en"): {
        "name": "Windproof Cycling Jacket",
        "reason": "Windproof and insulating at {feels:.0f}°C — standard below 10°C.",
    },
    # --- LEGS ---
    ("cl-thermal-tights", "de"): {
        "name": "Thermo-Radhose",
        "reason": "Warme Beine bei {temp_min:.0f}°C Minimum, windresistent.",
    },
    ("cl-thermal-tights", "en"): {
        "name": "Thermal Cycling Tights",
        "reason": "Warm legs at {temp_min:.0f}°C minimum, wind-resistant.",
    },
    ("cl-thermal-undershorts", "de"): {
        "name": "Thermo-Radunterhose",
        "reason": "Zusätzliche Isolierung unter der Trägerhose bei {feels:.0f}°C.",
    },
    ("cl-thermal-undershorts", "en"): {
        "name": "Thermal Undershorts",
        "reason": "Extra insulation under bib tights at {feels:.0f}°C.",
    },
    ("cl-tights-warmers", "de"): {"name": "Radhose + Beinlinge", "reason": ""},
    ("cl-tights-warmers", "en"): {"name": "Cycling Tights + Leg Warmers", "reason": ""},
    ("cl-padded-tights", "de"): {
        "name": "Lange Radhose mit Polster",
        "reason": "Polsterung für Komfort, lange Beine bei {temp_range}°C.",
    },
    ("cl-padded-tights", "en"): {
        "name": "Long Padded Cycling Tights",
        "reason": "Padding for comfort, long legs at {temp_range}°C.",
    },
    ("cl-shorts-warmers", "de"): {"name": "Kurze Trägerhose + Beinlinge", "reason": ""},
    ("cl-shorts-warmers", "en"): {
        "name": "Short Bib Shorts + Leg Warmers",
        "reason": "",
    },
    ("cl-shorts", "de"): {
        "name": "Gepolsterte Radshorts",
        "reason": "Atmungsaktiv bei {temp_max:.0f}°C mit Polsterung für Komfort.",
    },
    ("cl-shorts", "en"): {
        "name": "Padded Cycling Shorts",
        "reason": "Breathable at {temp_max:.0f}°C with padding for comfort.",
    },
    ("cl-overpants", "de"): {
        "name": "Wasserdichte Überhose",
        "reason": "Regenschutz für die Beine bei {precip:.0f}% Niederschlag.",
    },
    ("cl-overpants", "en"): {
        "name": "Waterproof Overpants",
        "reason": "Rain protection for legs at {precip:.0f}% precipitation.",
    },
    # --- HANDS ---
    ("cl-gloves-waterproof", "de"): {
        "name": "Wasserdichte Winterhandschuhe",
        "reason": "Wasserdichte Isolierung bei {feels:.0f}°C und {wind:.0f} km/h Wind.",
    },
    ("cl-gloves-waterproof", "en"): {
        "name": "Waterproof Winter Gloves",
        "reason": "Waterproof insulation at {feels:.0f}°C and {wind:.0f} km/h wind.",
    },
    ("cl-gloves-wp", "de"): {
        "name": "Wasserdichte Winterhandschuhe",
        "reason": "Nasse Hände + {wind:.0f} km/h Wind = schneller Wärmeverlust. Wasserdicht ist ein Muss.",
    },
    ("cl-gloves-wp", "en"): {
        "name": "Waterproof Winter Gloves",
        "reason": "Wet hands + {wind:.0f} km/h wind = rapid heat loss. Waterproof is a must.",
    },
    ("cl-gloves-warm", "de"): {
        "name": "Warme Radhandschuhe",
        "reason": "Isolierte Handschuhe bei {feels:.0f}°C gefühlt.",
    },
    ("cl-gloves-warm", "en"): {
        "name": "Warm Cycling Gloves",
        "reason": "Insulated gloves at {feels:.0f}°C feels-like.",
    },
    ("cl-gloves-light", "de"): {
        "name": "Leichte Radhandschuhe",
        "reason": "Griffigkeit und Polsterung bei {feels:.0f}°C.",
    },
    ("cl-gloves-light", "en"): {
        "name": "Light Cycling Gloves",
        "reason": "Grip and cushioning at {feels:.0f}°C.",
    },
    # --- FEET ---
    ("cl-shoe-covers", "de"): {
        "name": "Wasserdichte Überschuhe",
        "reason": "Hält die Füße trocken bei Regen mit {precip:.0f}% Niederschlag.",
    },
    ("cl-shoe-covers", "en"): {
        "name": "Waterproof Overshoes",
        "reason": "Keeps feet dry in rain at {precip:.0f}% precipitation.",
    },
    ("cl-shoes", "de"): {
        "name": "Radschuhe",
        "reason": "{ventilation} bei {temp_max:.0f}°C.",
    },
    ("cl-shoes", "en"): {
        "name": "Cycling Shoes",
        "reason": "{ventilation} at {temp_max:.0f}°C.",
    },
    # --- SOCKS ---
    ("cl-socks-warm", "de"): {
        "name": "Warme Merinosocken",
        "reason": "Bleiben warm auch bei Feuchtigkeit bei {temp_min:.0f}°C.",
    },
    ("cl-socks-warm", "en"): {
        "name": "Warm Merino Socks",
        "reason": "Stays warm even when damp at {temp_min:.0f}°C.",
    },
    ("cl-socks-mid", "de"): {
        "name": "Mitteldicke Socken",
        "reason": "Moderate Wärme bei {temp_min:.0f}°C Starttemperatur.",
    },
    ("cl-socks-mid", "en"): {
        "name": "Mid-weight Socks",
        "reason": "Moderate warmth at {temp_min:.0f}°C start temperature.",
    },
    ("cl-socks-thin", "de"): {
        "name": "Dünne Merinosocken",
        "reason": "Atmungsaktiv und geruchsneutral bei {temp_max:.0f}°C.",
    },
    ("cl-socks-thin", "en"): {
        "name": "Thin Merino Socks",
        "reason": "Breathable and odour-neutral at {temp_max:.0f}°C.",
    },
    # ── BIKE-TYPE-SPECIFIC OVERRIDES ─────────────────────────────────
    # SHORTS — Rennrad
    ("cl-shorts-rennrad", "de"): {
        "name": "Bib Shorts (aerodynamisch)",
        "reason": "Eng anliegende Bib Shorts mit Sitzpolster bei {temp_max:.0f}°C.",
    },
    ("cl-shorts-rennrad", "en"): {
        "name": "Bib Shorts (aerodynamic)",
        "reason": "Tight-fitting bib shorts with chamois at {temp_max:.0f}°C.",
    },
    # SHORTS — Gravel
    ("cl-shorts-gravel", "de"): {
        "name": "Gravel-Shorts (Relaxed Fit)",
        "reason": "Lockere Radshorts mit Polster für Komfort bei {temp_max:.0f}°C.",
    },
    ("cl-shorts-gravel", "en"): {
        "name": "Gravel Shorts (relaxed fit)",
        "reason": "Relaxed cycling shorts with chamois for comfort at {temp_max:.0f}°C.",
    },
    # SHORTS — MTB
    ("cl-shorts-mtb", "de"): {
        "name": "MTB Baggy Shorts",
        "reason": "Robuste, weite Shorts mit Innenhose und Polster bei {temp_max:.0f}°C.",
    },
    ("cl-shorts-mtb", "en"): {
        "name": "MTB Baggy Shorts",
        "reason": "Rugged loose shorts with liner and chamois at {temp_max:.0f}°C.",
    },
    # SHORTS — City
    ("cl-shorts-city", "de"): {
        "name": "Bequeme Alltagsshorts",
        "reason": "Legere Shorts ohne Radpolster — alltagstauglich bei {temp_max:.0f}°C.",
    },
    ("cl-shorts-city", "en"): {
        "name": "Casual Shorts",
        "reason": "Comfortable everyday shorts without chamois at {temp_max:.0f}°C.",
    },
    # PADDED TIGHTS — Rennrad
    ("cl-padded-tights-rennrad", "de"): {
        "name": "Bib Tights (eng anliegend)",
        "reason": "Eng anliegende Trägerhose mit Polster bei {temp_range}°C.",
    },
    ("cl-padded-tights-rennrad", "en"): {
        "name": "Bib Tights (tight fit)",
        "reason": "Tight-fitting bib tights with chamois at {temp_range}°C.",
    },
    # PADDED TIGHTS — Gravel
    ("cl-padded-tights-gravel", "de"): {
        "name": "Gravel-Radhose (robust)",
        "reason": "Robuste, etwas lockere Radhose mit Polster bei {temp_range}°C.",
    },
    ("cl-padded-tights-gravel", "en"): {
        "name": "Gravel Cycling Pants (robust)",
        "reason": "Rugged, slightly relaxed cycling pants with chamois at {temp_range}°C.",
    },
    # PADDED TIGHTS — MTB
    ("cl-padded-tights-mtb", "de"): {
        "name": "MTB-Hose (abriebfest)",
        "reason": "Weite, abriebfeste Hose mit Innenhose bei {temp_range}°C.",
    },
    ("cl-padded-tights-mtb", "en"): {
        "name": "MTB Pants (abrasion-resistant)",
        "reason": "Loose, abrasion-resistant pants with liner at {temp_range}°C.",
    },
    # PADDED TIGHTS — City
    ("cl-padded-tights-city", "de"): {
        "name": "Alltagshose (warm, bequem)",
        "reason": "Bequeme lange Hose ohne Radpolster bei {temp_range}°C.",
    },
    ("cl-padded-tights-city", "en"): {
        "name": "Casual Pants (warm, comfortable)",
        "reason": "Comfortable long pants without chamois at {temp_range}°C.",
    },
    # THERMAL TIGHTS — Rennrad
    ("cl-thermal-tights-rennrad", "de"): {
        "name": "Thermo-Bib-Tights",
        "reason": "Eng anliegende Thermo-Trägerhose mit Windschutz bei {temp_min:.0f}°C.",
    },
    ("cl-thermal-tights-rennrad", "en"): {
        "name": "Thermal Bib Tights",
        "reason": "Tight-fitting thermal bib tights with wind protection at {temp_min:.0f}°C.",
    },
    # THERMAL TIGHTS — Gravel
    ("cl-thermal-tights-gravel", "de"): {
        "name": "Gravel Thermo-Hose (robust)",
        "reason": "Robuste Thermo-Radhose mit Windschutz bei {temp_min:.0f}°C.",
    },
    ("cl-thermal-tights-gravel", "en"): {
        "name": "Gravel Thermal Pants (robust)",
        "reason": "Rugged thermal cycling pants with wind protection at {temp_min:.0f}°C.",
    },
    # THERMAL TIGHTS — MTB
    ("cl-thermal-tights-mtb", "de"): {
        "name": "MTB Thermo-Hose (weit, abriebfest)",
        "reason": "Weite, abriebfeste Thermo-Hose mit Innenhose bei {temp_min:.0f}°C.",
    },
    ("cl-thermal-tights-mtb", "en"): {
        "name": "MTB Thermal Pants (loose, abrasion-resistant)",
        "reason": "Loose, abrasion-resistant thermal pants with liner at {temp_min:.0f}°C.",
    },
    # THERMAL TIGHTS — City
    ("cl-thermal-tights-city", "de"): {
        "name": "Warme Alltagshose",
        "reason": "Gefütterte, bequeme Hose für kalte Fahrten bei {temp_min:.0f}°C.",
    },
    ("cl-thermal-tights-city", "en"): {
        "name": "Warm Casual Pants",
        "reason": "Lined, comfortable pants for cold rides at {temp_min:.0f}°C.",
    },
    # SHORT JERSEY — Rennrad
    ("cl-jersey-short-rennrad", "de"): {
        "name": "Aero-Radtrikot (eng)",
        "reason": "Eng anliegend und aerodynamisch bei {temp_max:.0f}°C.",
    },
    ("cl-jersey-short-rennrad", "en"): {
        "name": "Aero Cycling Jersey (tight)",
        "reason": "Tight-fitting and aerodynamic at {temp_max:.0f}°C.",
    },
    # SHORT JERSEY — Gravel
    ("cl-jersey-short-gravel", "de"): {
        "name": "Gravel-Trikot (Relaxed Fit)",
        "reason": "Etwas lockerer Schnitt für Komfort bei {temp_max:.0f}°C.",
    },
    ("cl-jersey-short-gravel", "en"): {
        "name": "Gravel Jersey (relaxed fit)",
        "reason": "Slightly relaxed cut for comfort at {temp_max:.0f}°C.",
    },
    # SHORT JERSEY — MTB
    ("cl-jersey-short-mtb", "de"): {
        "name": "MTB-Jersey (locker, robust)",
        "reason": "Lockeres, robustes Jersey mit Belüftung bei {temp_max:.0f}°C.",
    },
    ("cl-jersey-short-mtb", "en"): {
        "name": "MTB Jersey (loose, rugged)",
        "reason": "Loose, rugged jersey with ventilation at {temp_max:.0f}°C.",
    },
    # SHORT JERSEY — City
    ("cl-jersey-short-city", "de"): {
        "name": "Legeres Funktionsshirt",
        "reason": "Alltagstaugliches Funktionsshirt bei {temp_max:.0f}°C.",
    },
    ("cl-jersey-short-city", "en"): {
        "name": "Casual Performance Shirt",
        "reason": "Everyday performance shirt at {temp_max:.0f}°C.",
    },
    # LONG JERSEY — Rennrad
    ("cl-jersey-long-rennrad", "de"): {
        "name": "Langarm-Radtrikot (eng)",
        "reason": "Eng anliegend mit Wärme bei {temp_range}°C.",
    },
    ("cl-jersey-long-rennrad", "en"): {
        "name": "Long-sleeve Cycling Jersey (tight)",
        "reason": "Tight-fitting warmth at {temp_range}°C.",
    },
    # LONG JERSEY — Gravel
    ("cl-jersey-long-gravel", "de"): {
        "name": "Langarm Gravel-Jersey",
        "reason": "Robustes Langarm-Trikot bei {temp_range}°C.",
    },
    ("cl-jersey-long-gravel", "en"): {
        "name": "Long-sleeve Gravel Jersey",
        "reason": "Rugged long-sleeve jersey at {temp_range}°C.",
    },
    # LONG JERSEY — MTB
    ("cl-jersey-long-mtb", "de"): {
        "name": "Langarm MTB-Jersey (locker)",
        "reason": "Lockeres Langarm-Jersey mit Belüftung bei {temp_range}°C.",
    },
    ("cl-jersey-long-mtb", "en"): {
        "name": "Long-sleeve MTB Jersey (loose)",
        "reason": "Loose long-sleeve jersey with ventilation at {temp_range}°C.",
    },
    # LONG JERSEY — City
    ("cl-jersey-long-city", "de"): {
        "name": "Langarm-Funktionsshirt",
        "reason": "Alltagstaugliches Langarm-Funktionsshirt bei {temp_range}°C.",
    },
    ("cl-jersey-long-city", "en"): {
        "name": "Long-sleeve Performance Shirt",
        "reason": "Everyday long-sleeve performance shirt at {temp_range}°C.",
    },
    # LIGHT LONG JERSEY — Rennrad
    ("cl-jersey-long-light-rennrad", "de"): {
        "name": "Leichtes Langarm-Radtrikot (eng)",
        "reason": "Eng anliegend, Ärmel aufrollbar bei {temp_range}°C.",
    },
    ("cl-jersey-long-light-rennrad", "en"): {
        "name": "Light Long-sleeve Jersey (tight)",
        "reason": "Tight-fitting, can roll up sleeves at {temp_range}°C.",
    },
    # LIGHT LONG JERSEY — Gravel
    ("cl-jersey-long-light-gravel", "de"): {
        "name": "Leichtes Gravel-Langarmtrikot",
        "reason": "Lockerer Schnitt, Ärmel aufrollbar bei {temp_range}°C.",
    },
    ("cl-jersey-long-light-gravel", "en"): {
        "name": "Light Long-sleeve Gravel Jersey",
        "reason": "Relaxed fit, can roll up sleeves at {temp_range}°C.",
    },
    # LIGHT LONG JERSEY — MTB
    ("cl-jersey-long-light-mtb", "de"): {
        "name": "Leichtes MTB-Langarmtrikot",
        "reason": "Lockeres MTB-Shirt mit langen Ärmeln bei {temp_range}°C.",
    },
    ("cl-jersey-long-light-mtb", "en"): {
        "name": "Light Long-sleeve MTB Jersey",
        "reason": "Loose MTB shirt with long sleeves at {temp_range}°C.",
    },
    # LIGHT LONG JERSEY — City
    ("cl-jersey-long-light-city", "de"): {
        "name": "Leichtes Langarm-Funktionsshirt",
        "reason": "Legeres Langarmshirt bei {temp_range}°C.",
    },
    ("cl-jersey-long-light-city", "en"): {
        "name": "Light Long-sleeve Performance Shirt",
        "reason": "Casual long-sleeve shirt at {temp_range}°C.",
    },
    # BASE LAYER MERINO — Rennrad
    ("cl-base-merino-rennrad", "de"): {
        "name": "Merino-Baselayer (eng, Kompression)",
        "reason": "Eng anliegend mit Kompression bei {feels:.0f}°C.",
    },
    ("cl-base-merino-rennrad", "en"): {
        "name": "Merino Base Layer (tight, compression)",
        "reason": "Tight-fitting with compression at {feels:.0f}°C.",
    },
    # BASE LAYER MERINO — Gravel
    ("cl-base-merino-gravel", "de"): {
        "name": "Merino-Baselayer (Merinowolle)",
        "reason": "Merinowolle reguliert Wärme bei {feels:.0f}°C.",
    },
    ("cl-base-merino-gravel", "en"): {
        "name": "Merino Base Layer (merino wool)",
        "reason": "Merino wool regulates warmth at {feels:.0f}°C.",
    },
    # BASE LAYER MERINO — MTB
    ("cl-base-merino-mtb", "de"): {
        "name": "Merino-Baselayer (locker)",
        "reason": "Locker sitzend, feuchtigkeitsregulierend bei {feels:.0f}°C.",
    },
    ("cl-base-merino-mtb", "en"): {
        "name": "Merino Base Layer (loose)",
        "reason": "Loose-fitting, moisture-regulating at {feels:.0f}°C.",
    },
    # BASE LAYER MERINO — City
    ("cl-base-merino-city", "de"): {
        "name": "Warmes Funktionsunterhemd",
        "reason": "Normales Funktionsshirt unter der Kleidung bei {feels:.0f}°C.",
    },
    ("cl-base-merino-city", "en"): {
        "name": "Warm Functional Undershirt",
        "reason": "Normal functional undershirt under clothing at {feels:.0f}°C.",
    },
    # BASE LAYER WICKING — Rennrad
    ("cl-base-wicking-rennrad", "de"): {
        "name": "Leichtes Unterhemd (eng, Kompression)",
        "reason": "Eng anliegend, transportiert Schweiß bei {feels:.0f}°C.",
    },
    ("cl-base-wicking-rennrad", "en"): {
        "name": "Light Base Layer (tight, compression)",
        "reason": "Tight-fitting, wicks sweat at {feels:.0f}°C.",
    },
    # BASE LAYER WICKING — Gravel
    ("cl-base-wicking-gravel", "de"): {
        "name": "Feuchtigkeitsableitendes Unterhemd",
        "reason": "Transportiert Schweiß von der Haut bei {feels:.0f}°C.",
    },
    ("cl-base-wicking-gravel", "en"): {
        "name": "Moisture-wicking Base Layer",
        "reason": "Moves sweat away from skin at {feels:.0f}°C.",
    },
    # BASE LAYER WICKING — MTB
    ("cl-base-wicking-mtb", "de"): {
        "name": "Lockeres Funktionsunterhemd",
        "reason": "Locker sitzend, leitet Feuchtigkeit ab bei {feels:.0f}°C.",
    },
    ("cl-base-wicking-mtb", "en"): {
        "name": "Loose Functional Base Layer",
        "reason": "Loose-fitting, wicks moisture at {feels:.0f}°C.",
    },
    # BASE LAYER WICKING — City
    ("cl-base-wicking-city", "de"): {
        "name": "Leichtes Alltagsunterhemd",
        "reason": "Optional bei {feels:.0f}°C — bequem unter Alltagskleidung.",
    },
    ("cl-base-wicking-city", "en"): {
        "name": "Light Casual Undershirt",
        "reason": "Optional at {feels:.0f}°C — comfortable under everyday clothes.",
    },
    # SHOES — Rennrad
    ("cl-shoes-rennrad", "de"): {
        "name": "Rennrad-Klickschuhe",
        "reason": "{ventilation} bei {temp_max:.0f}°C. Steife Sohle für maximale Kraftübertragung.",
    },
    ("cl-shoes-rennrad", "en"): {
        "name": "Road Clip-in Shoes",
        "reason": "{ventilation} at {temp_max:.0f}°C. Stiff sole for max power transfer.",
    },
    # SHOES — Gravel
    ("cl-shoes-gravel", "de"): {
        "name": "Gravel-Klickschuhe (Profilsohle)",
        "reason": "{ventilation} bei {temp_max:.0f}°C. Griffige Sohle für Abstecher abseits der Straße.",
    },
    ("cl-shoes-gravel", "en"): {
        "name": "Gravel Clip-in Shoes (tread sole)",
        "reason": "{ventilation} at {temp_max:.0f}°C. Grippy sole for off-road excursions.",
    },
    # SHOES — MTB
    ("cl-shoes-mtb", "de"): {
        "name": "MTB-Schuhe (Flatpedal oder SPD)",
        "reason": "{ventilation} bei {temp_max:.0f}°C. Robuste Sohle mit Grip für Trails.",
    },
    ("cl-shoes-mtb", "en"): {
        "name": "MTB Shoes (flat pedal or SPD)",
        "reason": "{ventilation} at {temp_max:.0f}°C. Rugged sole with grip for trails.",
    },
    # SHOES — City
    ("cl-shoes-city", "de"): {
        "name": "Feste Alltagsschuhe",
        "reason": "Bequeme Schuhe mit fester Sohle bei {temp_max:.0f}°C.",
    },
    ("cl-shoes-city", "en"): {
        "name": "Sturdy Everyday Shoes",
        "reason": "Comfortable shoes with firm sole at {temp_max:.0f}°C.",
    },
    # LIGHT GLOVES — Rennrad
    ("cl-gloves-light-rennrad", "de"): {
        "name": "Leichte Rennrad-Handschuhe",
        "reason": "Aerodynamisch und dünn bei {feels:.0f}°C.",
    },
    ("cl-gloves-light-rennrad", "en"): {
        "name": "Light Road Cycling Gloves",
        "reason": "Aerodynamic and thin at {feels:.0f}°C.",
    },
    # LIGHT GLOVES — Gravel
    ("cl-gloves-light-gravel", "de"): {
        "name": "Gravel-Handschuhe (mehr Grip)",
        "reason": "Grip und Polsterung für Schotter bei {feels:.0f}°C.",
    },
    ("cl-gloves-light-gravel", "en"): {
        "name": "Gravel Gloves (extra grip)",
        "reason": "Grip and cushioning for gravel at {feels:.0f}°C.",
    },
    # LIGHT GLOVES — MTB
    ("cl-gloves-light-mtb", "de"): {
        "name": "MTB-Handschuhe (Polsterung + Grip)",
        "reason": "Extra Polsterung und Grip für Trails bei {feels:.0f}°C.",
    },
    ("cl-gloves-light-mtb", "en"): {
        "name": "MTB Gloves (padding + grip)",
        "reason": "Extra padding and grip for trails at {feels:.0f}°C.",
    },
    # LIGHT GLOVES — City
    ("cl-gloves-light-city", "de"): {
        "name": "Optionale Alltagshandschuhe",
        "reason": "Leichte Handschuhe nach Bedarf bei {feels:.0f}°C.",
    },
    ("cl-gloves-light-city", "en"): {
        "name": "Optional Casual Gloves",
        "reason": "Light gloves as needed at {feels:.0f}°C.",
    },
    # WARM GLOVES — Rennrad
    ("cl-gloves-warm-rennrad", "de"): {
        "name": "Warme Rennrad-Handschuhe",
        "reason": "Isoliert, eng anliegend bei {feels:.0f}°C.",
    },
    ("cl-gloves-warm-rennrad", "en"): {
        "name": "Warm Road Cycling Gloves",
        "reason": "Insulated, tight-fitting at {feels:.0f}°C.",
    },
    # WARM GLOVES — Gravel
    ("cl-gloves-warm-gravel", "de"): {
        "name": "Warme Gravel-Handschuhe",
        "reason": "Isoliert mit extra Grip bei {feels:.0f}°C.",
    },
    ("cl-gloves-warm-gravel", "en"): {
        "name": "Warm Gravel Gloves",
        "reason": "Insulated with extra grip at {feels:.0f}°C.",
    },
    # WARM GLOVES — MTB
    ("cl-gloves-warm-mtb", "de"): {
        "name": "Warme MTB-Handschuhe",
        "reason": "Isoliert, gepolstert und griffig bei {feels:.0f}°C.",
    },
    ("cl-gloves-warm-mtb", "en"): {
        "name": "Warm MTB Gloves",
        "reason": "Insulated, padded, and grippy at {feels:.0f}°C.",
    },
    # WARM GLOVES — City
    ("cl-gloves-warm-city", "de"): {
        "name": "Warme Alltagshandschuhe",
        "reason": "Bequeme warme Handschuhe bei {feels:.0f}°C.",
    },
    ("cl-gloves-warm-city", "en"): {
        "name": "Warm Casual Gloves",
        "reason": "Comfortable warm gloves at {feels:.0f}°C.",
    },
    # RAIN JACKET — Rennrad
    ("cl-rain-jacket-rennrad", "de"): {
        "name": "Wasserdichte Rennradjacke (eng)",
        "reason": "Eng anliegend, versiegelte Nähte bei {precip:.0f}% Regen.",
    },
    ("cl-rain-jacket-rennrad", "en"): {
        "name": "Waterproof Road Jacket (tight)",
        "reason": "Tight-fitting, sealed seams at {precip:.0f}% rain.",
    },
    # RAIN JACKET — Gravel
    ("cl-rain-jacket-gravel", "de"): {
        "name": "Wasserdichte Gravel-Jacke",
        "reason": "Robuste Regenjacke für Schotterpisten bei {precip:.0f}% Regen.",
    },
    ("cl-rain-jacket-gravel", "en"): {
        "name": "Waterproof Gravel Jacket",
        "reason": "Rugged rain jacket for gravel roads at {precip:.0f}% rain.",
    },
    # RAIN JACKET — MTB
    ("cl-rain-jacket-mtb", "de"): {
        "name": "Wasserdichte MTB-Jacke (robust)",
        "reason": "Robuste Regenjacke mit Belüftung bei {precip:.0f}% Regen.",
    },
    ("cl-rain-jacket-mtb", "en"): {
        "name": "Waterproof MTB Jacket (rugged)",
        "reason": "Rugged rain jacket with ventilation at {precip:.0f}% rain.",
    },
    # RAIN JACKET — City
    ("cl-rain-jacket-city", "de"): {
        "name": "Allwetter-Regenjacke",
        "reason": "Alltagstaugliche Regenjacke bei {precip:.0f}% Regen.",
    },
    ("cl-rain-jacket-city", "en"): {
        "name": "Everyday Rain Jacket",
        "reason": "Everyday rain jacket at {precip:.0f}% rain.",
    },
}


# ---------------------------------------------------------------------------
# Equipment item translations
# ---------------------------------------------------------------------------
EQUIPMENT_TRANSLATIONS: dict[tuple[str, str], ItemTranslation] = {
    ("eq-warm-drink", "de"): {
        "name": "Isolierte Flasche mit Warmgetränk",
        "reason": "Warme Flüssigkeit hilft bei {temp_min:.0f}°C die Körpertemperatur zu halten.",
    },
    ("eq-warm-drink", "en"): {
        "name": "Insulated Bottle with Warm Drink",
        "reason": "Warm fluids help maintain body temperature at {temp_min:.0f}°C.",
    },
    ("eq-water", "de"): {
        "name": "Trinkflasche 750 ml",
        "reason": "Hydratation bei {temp_max:.0f}°C{dist_suffix}.",
    },
    ("eq-water", "en"): {
        "name": "Water Bottle 750ml",
        "reason": "Stay hydrated at {temp_max:.0f}°C{dist_suffix}.",
    },
    ("eq-sunscreen", "de"): {
        "name": "Sonnenschutz LSF 30+",
        "reason": "UV-Index {uv_index:.0f} — Sonnenschutz empfohlen bei mehrstündigen Fahrten.",
    },
    ("eq-sunscreen", "en"): {
        "name": "Sunscreen SPF 30+",
        "reason": "UV index {uv_index:.0f} — sun protection recommended for multi-hour rides.",
    },
    ("eq-face-mask-air", "de"): {
        "name": "Atemschutzmaske (FFP2)",
        "reason": "Luftqualitätsindex {air_quality_index:.0f} — Atemschutz bei schlechter Luftqualität empfohlen.",
    },
    ("eq-face-mask-air", "en"): {
        "name": "Face Mask (FFP2)",
        "reason": "Air quality index {air_quality_index:.0f} — respiratory protection recommended for poor air quality.",
    },
    ("eq-lights-before-sunrise", "de"): {
        "name": "Fahrradlichter (vorne + hinten)",
        "reason": "Start um {ride_start} vor Sonnenaufgang ({sunrise}) — Beleuchtung nötig.",
    },
    ("eq-lights-before-sunrise", "en"): {
        "name": "Bike Lights (front + rear)",
        "reason": "Start at {ride_start} before sunrise ({sunrise}) — lights needed.",
    },
    ("eq-lights-after-sunset", "de"): {
        "name": "Fahrradlichter (vorne + hinten)",
        "reason": "Fahrt bis ca. {ride_end} — Sonnenuntergang um {sunset}, Beleuchtung einplanen.",
    },
    ("eq-lights-after-sunset", "en"): {
        "name": "Bike Lights (front + rear)",
        "reason": "Ride until ~{ride_end} — sunset at {sunset}, pack lights.",
    },
    ("eq-lights-both", "de"): {
        "name": "Fahrradlichter (vorne + hinten)",
        "reason": "Fahrt {ride_start}–{ride_end} — vor Sonnenaufgang ({sunrise}) und nach Sonnenuntergang ({sunset}).",
    },
    ("eq-lights-both", "en"): {
        "name": "Bike Lights (front + rear)",
        "reason": "Ride {ride_start}–{ride_end} — before sunrise ({sunrise}) and after sunset ({sunset}).",
    },
    ("eq-mudguards", "de"): {
        "name": "Schutzbleche",
        "reason": "{precip:.0f}% Niederschlag — Spritzschutz für Fahrer und Ausrüstung.",
    },
    ("eq-mudguards", "en"): {
        "name": "Mudguards",
        "reason": "{precip:.0f}% precipitation — spray protection for rider and gear.",
    },
    ("eq-dry-bag", "de"): {
        "name": "Dry Bag für Wertsachen",
        "reason": "Handy und Geldbörse schützen bei {precip:.0f}% Regenrisiko.",
    },
    ("eq-dry-bag", "en"): {
        "name": "Dry Bag for Valuables",
        "reason": "Protect phone and wallet at {precip:.0f}% rain chance.",
    },
    ("eq-repair-kit", "de"): {
        "name": "Reparaturset",
        "reason": "Unverzichtbar für jede Fahrt.",
    },
    ("eq-repair-kit", "en"): {
        "name": "Repair Kit",
        "reason": "Essential for every ride.",
    },
    ("eq-energy", "de"): {
        "name": "Energieriegel",
        "reason": "Nachhaltige Energie für {dist:.0f} km Distanz.",
    },
    ("eq-energy", "en"): {
        "name": "Energy Bars",
        "reason": "Sustained energy for {dist:.0f} km distance.",
    },
    # ── SAFETY EQUIPMENT ─────────────────────────────────────────────
    # Helmets (per bike type)
    ("eq-helmet-rennrad", "de"): {
        "name": "Rennradhelm (Aero)",
        "reason": "Leichter, aerodynamischer Helm — immer tragen.",
    },
    ("eq-helmet-rennrad", "en"): {
        "name": "Road Helmet (aero)",
        "reason": "Lightweight, aerodynamic helmet — always wear one.",
    },
    ("eq-helmet-gravel", "de"): {
        "name": "Allround-Radhelm",
        "reason": "Vielseitiger Helm mit erweitertem Hinterkopfschutz.",
    },
    ("eq-helmet-gravel", "en"): {
        "name": "All-round Cycling Helmet",
        "reason": "Versatile helmet with extended rear coverage.",
    },
    ("eq-helmet-mtb", "de"): {
        "name": "MTB-Helm (Enduro/Fullface)",
        "reason": "Maximaler Schutz für Trails — Kinnbügel empfohlen.",
    },
    ("eq-helmet-mtb", "en"): {
        "name": "MTB Helmet (enduro/full-face)",
        "reason": "Maximum trail protection — chin guard recommended.",
    },
    ("eq-helmet-city", "de"): {
        "name": "Urban-Fahrradhelm",
        "reason": "Schicker Helm für den Alltag — Sicherheit geht vor.",
    },
    ("eq-helmet-city", "en"): {
        "name": "Urban Cycling Helmet",
        "reason": "Stylish helmet for daily rides — safety first.",
    },
    # Reflective vest
    ("eq-reflective-vest", "de"): {
        "name": "Reflektierende Warnweste",
        "reason": "Sichtbarkeit erhöhen bei Dämmerung oder schlechter Sicht.",
    },
    ("eq-reflective-vest", "en"): {
        "name": "Reflective Safety Vest",
        "reason": "Increase visibility at dusk or in poor conditions.",
    },
    # Protectors
    ("eq-protectors-mtb", "de"): {
        "name": "Knie- & Ellbogenschoner",
        "reason": "Schutz vor Stürzen auf Trails — immer empfohlen für MTB.",
    },
    ("eq-protectors-mtb", "en"): {
        "name": "Knee & Elbow Pads",
        "reason": "Crash protection on trails — always recommended for MTB.",
    },
    ("eq-protectors-gravel", "de"): {
        "name": "Leichte Knieschoner (optional)",
        "reason": "Zusätzlicher Schutz auf technischen Schotterpisten.",
    },
    ("eq-protectors-gravel", "en"): {
        "name": "Light Knee Pads (optional)",
        "reason": "Extra protection on technical gravel roads.",
    },
    # First aid kit
    ("eq-first-aid", "de"): {
        "name": "Erste-Hilfe-Set (kompakt)",
        "reason": "Pflaster, Desinfektionstücher und Verband für unterwegs.",
    },
    ("eq-first-aid", "en"): {
        "name": "First Aid Kit (compact)",
        "reason": "Band-aids, antiseptic wipes, and bandage for the road.",
    },
    # Lock
    ("eq-lock-city", "de"): {
        "name": "Fahrradschloss",
        "reason": "Sicheres Schloss für Zwischenstopps in der Stadt — unverzichtbar.",
    },
    ("eq-lock-city", "en"): {
        "name": "Bike Lock",
        "reason": "Secure lock for city stops — essential.",
    },
    ("eq-lock", "de"): {
        "name": "Leichtes Kabelschloss",
        "reason": "Leichtes Schloss für Pausen bei {dist:.0f} km langen Fahrten.",
    },
    ("eq-lock", "en"): {
        "name": "Light Cable Lock",
        "reason": "Light lock for breaks on {dist:.0f} km rides.",
    },
    # Bell
    ("eq-bell-city", "de"): {
        "name": "Fahrradklingel",
        "reason": "In Deutschland gesetzlich vorgeschrieben (StVZO) — auf jedem Rad Pflicht.",
    },
    ("eq-bell-city", "en"): {
        "name": "Bike Bell",
        "reason": "Legally required in Germany (StVZO) — mandatory on every bike.",
    },
    ("eq-bell-gravel", "de"): {
        "name": "Fahrradklingel",
        "reason": "Empfohlen auf gemischten Rad-/Fußwegen.",
    },
    ("eq-bell-gravel", "en"): {
        "name": "Bike Bell",
        "reason": "Recommended on shared bike/pedestrian paths.",
    },
}


# ---------------------------------------------------------------------------
# WMO weather description translations (keyed by (wmo_code, locale))
# ---------------------------------------------------------------------------
WMO_DESCRIPTIONS: dict[tuple[int, str], str] = {
    (0, "de"): "Klarer Himmel",
    (0, "en"): "Clear sky",
    (1, "de"): "Überwiegend klar",
    (1, "en"): "Mainly clear",
    (2, "de"): "Teilweise bewölkt",
    (2, "en"): "Partly cloudy",
    (3, "de"): "Bedeckt",
    (3, "en"): "Overcast",
    (45, "de"): "Nebel",
    (45, "en"): "Fog",
    (48, "de"): "Raureif-Nebel",
    (48, "en"): "Depositing rime fog",
    (51, "de"): "Leichter Nieselregen",
    (51, "en"): "Light drizzle",
    (53, "de"): "Mäßiger Nieselregen",
    (53, "en"): "Moderate drizzle",
    (55, "de"): "Starker Nieselregen",
    (55, "en"): "Dense drizzle",
    (56, "de"): "Leichter gefrierender Nieselregen",
    (56, "en"): "Light freezing drizzle",
    (57, "de"): "Starker gefrierender Nieselregen",
    (57, "en"): "Dense freezing drizzle",
    (61, "de"): "Leichter Regen",
    (61, "en"): "Slight rain",
    (63, "de"): "Mäßiger Regen",
    (63, "en"): "Moderate rain",
    (65, "de"): "Starker Regen",
    (65, "en"): "Heavy rain",
    (66, "de"): "Leichter gefrierender Regen",
    (66, "en"): "Light freezing rain",
    (67, "de"): "Starker gefrierender Regen",
    (67, "en"): "Heavy freezing rain",
    (71, "de"): "Leichter Schneefall",
    (71, "en"): "Slight snow fall",
    (73, "de"): "Mäßiger Schneefall",
    (73, "en"): "Moderate snow fall",
    (75, "de"): "Starker Schneefall",
    (75, "en"): "Heavy snow fall",
    (77, "de"): "Schneekörner",
    (77, "en"): "Snow grains",
    (80, "de"): "Leichte Regenschauer",
    (80, "en"): "Slight rain showers",
    (81, "de"): "Mäßige Regenschauer",
    (81, "en"): "Moderate rain showers",
    (82, "de"): "Heftige Regenschauer",
    (82, "en"): "Violent rain showers",
    (85, "de"): "Leichte Schneeschauer",
    (85, "en"): "Slight snow showers",
    (86, "de"): "Starke Schneeschauer",
    (86, "en"): "Heavy snow showers",
    (95, "de"): "Gewitter",
    (95, "en"): "Thunderstorm",
    (96, "de"): "Gewitter mit leichtem Hagel",
    (96, "en"): "Thunderstorm with slight hail",
    (99, "de"): "Gewitter mit starkem Hagel",
    (99, "en"): "Thunderstorm with heavy hail",
}


# ---------------------------------------------------------------------------
# Label translations for recommendations.py
# ---------------------------------------------------------------------------
BIKE_LABELS: dict[tuple[str, str], str] = {
    ("rennrad", "de"): "Rennrad",
    ("rennrad", "en"): "Road bike",
    ("gravel", "de"): "Gravel",
    ("gravel", "en"): "Gravel",
    ("mtb", "de"): "MTB",
    ("mtb", "en"): "MTB",
    ("city", "de"): "City",
    ("city", "en"): "City",
}

INTENSITY_LABELS: dict[tuple[str, str], str] = {
    ("gemuetlich", "de"): "Entspannt",
    ("gemuetlich", "en"): "Relaxed",
    ("moderat", "de"): "Moderat",
    ("moderat", "en"): "Moderate",
    ("sportlich", "de"): "Sportlich",
    ("sportlich", "en"): "Sporty",
}

DAY_LABELS: dict[str, dict[str, str]] = {
    "today": {"de": "Heute", "en": "Today"},
    "day": {"de": "Tag {n}", "en": "Day {n}"},
}

RIDE_NAME_TEMPLATE: dict[str, str] = {
    "de": "{start} → {end}",
    "en": "{start} → {end}",
}

RIDE_NAME_TEMPLATE_NO_DEST: dict[str, str] = {
    "de": "{location} Fahrt",
    "en": "{location} Ride",
}

RIDING_STYLE_TEMPLATE: dict[str, str] = {
    "de": "{bike} · {intensity}",
    "en": "{bike} · {intensity}",
}

SHOE_VENTILATION: dict[str, str] = {
    "de_good": "Gute Belüftung",
    "de_stiff": "Steife Sohle für effiziente Kraftübertragung",
    "en_good": "Good ventilation",
    "en_stiff": "Stiff sole for efficient power transfer",
}


# ---------------------------------------------------------------------------
# Condition-reason translations keyed by (reason_code, locale)
# ---------------------------------------------------------------------------
class ConditionReasonTranslation(TypedDict):
    label: str
    detail: str  # f-string template with {actual} and {threshold}


CONDITION_REASON_TRANSLATIONS: dict[tuple[str, str], ConditionReasonTranslation] = {
    # --- NOT RECOMMENDED ---
    ("thunderstorm", "de"): {
        "label": "Gewitter",
        "detail": "Gewitter vorhergesagt — zu gefährlich zum Radfahren.",
    },
    ("thunderstorm", "en"): {
        "label": "Thunderstorm",
        "detail": "Thunderstorm forecast — too dangerous for cycling.",
    },
    ("snow", "de"): {
        "label": "Schneefall",
        "detail": "Schneefall vorhergesagt — Sturzgefahr auf glatten Straßen.",
    },
    ("snow", "en"): {
        "label": "Snowfall",
        "detail": "Snowfall forecast — risk of crashes on slippery roads.",
    },
    ("extreme_cold", "de"): {
        "label": "Extreme Kälte",
        "detail": "Temperatur: {actual:.0f}°C (Grenze: {threshold:.0f}°C)",
    },
    ("extreme_cold", "en"): {
        "label": "Extreme cold",
        "detail": "Temperature: {actual:.0f}°C (limit: {threshold:.0f}°C)",
    },
    ("extreme_wind", "de"): {
        "label": "Extremer Wind",
        "detail": "Wind: {actual:.0f} km/h (Grenze: {threshold:.0f} km/h)",
    },
    ("extreme_wind", "en"): {
        "label": "Extreme wind",
        "detail": "Wind: {actual:.0f} km/h (limit: {threshold:.0f} km/h)",
    },
    ("extreme_heat", "de"): {
        "label": "Extreme Hitze",
        "detail": "Gefühlt: {actual:.0f}°C (Grenze: {threshold:.0f}°C)",
    },
    ("extreme_heat", "en"): {
        "label": "Extreme heat",
        "detail": "Feels like: {actual:.0f}°C (limit: {threshold:.0f}°C)",
    },
    # --- CAUTION ---
    ("high_heat", "de"): {
        "label": "Große Hitze",
        "detail": "Gefühlt: {actual:.0f}°C (Grenze: {threshold:.0f}°C)",
    },
    ("high_heat", "en"): {
        "label": "High heat",
        "detail": "Feels like: {actual:.0f}°C (limit: {threshold:.0f}°C)",
    },
    ("high_precip", "de"): {
        "label": "Regen wahrscheinlich",
        "detail": "Niederschlag: {actual:.0f}% (Grenze: {threshold:.0f}%)",
    },
    ("high_precip", "en"): {
        "label": "Rain likely",
        "detail": "Precipitation: {actual:.0f}% (limit: {threshold:.0f}%)",
    },
    ("cold", "de"): {
        "label": "Kalt",
        "detail": "Temperatur: {actual:.0f}°C (Grenze: {threshold:.0f}°C)",
    },
    ("cold", "en"): {
        "label": "Cold",
        "detail": "Temperature: {actual:.0f}°C (limit: {threshold:.0f}°C)",
    },
    ("high_wind", "de"): {
        "label": "Starker Wind",
        "detail": "Wind: {actual:.0f} km/h (Grenze: {threshold:.0f} km/h)",
    },
    ("high_wind", "en"): {
        "label": "Strong wind",
        "detail": "Wind: {actual:.0f} km/h (limit: {threshold:.0f} km/h)",
    },
    # --- IDEAL / GOOD (positive) ---
    ("pleasant_temp", "de"): {
        "label": "Angenehme Temperaturen",
        "detail": "Gefühlt: {actual:.0f}°C — angenehmer Bereich zum Radfahren.",
    },
    ("pleasant_temp", "en"): {
        "label": "Pleasant temperature",
        "detail": "Feels like: {actual:.0f}°C — comfortable range for cycling.",
    },
    ("low_precip", "de"): {
        "label": "Trocken",
        "detail": "Niederschlag: {actual:.0f}% (Grenze: {threshold:.0f}%)",
    },
    ("low_precip", "en"): {
        "label": "Dry",
        "detail": "Precipitation: {actual:.0f}% (limit: {threshold:.0f}%)",
    },
    ("calm_wind", "de"): {
        "label": "Wenig Wind",
        "detail": "Wind: {actual:.0f} km/h (Grenze: {threshold:.0f} km/h)",
    },
    ("calm_wind", "en"): {
        "label": "Calm wind",
        "detail": "Wind: {actual:.0f} km/h (limit: {threshold:.0f} km/h)",
    },
    # --- AIR QUALITY ---
    ("extreme_air_quality", "de"): {
        "label": "Extreme Luftverschmutzung",
        "detail": "Luftqualitätsindex: {actual:.0f} (Grenze: {threshold:.0f})",
    },
    ("extreme_air_quality", "en"): {
        "label": "Extreme air pollution",
        "detail": "Air quality index: {actual:.0f} (limit: {threshold:.0f})",
    },
    ("poor_air_quality", "de"): {
        "label": "Schlechte Luftqualität",
        "detail": "Luftqualitätsindex: {actual:.0f} (Grenze: {threshold:.0f})",
    },
    ("poor_air_quality", "en"): {
        "label": "Poor air quality",
        "detail": "Air quality index: {actual:.0f} (limit: {threshold:.0f})",
    },
}


# ---------------------------------------------------------------------------
# Safety/comfort tip translations keyed by (tip_id, locale)
# ---------------------------------------------------------------------------
TIP_TRANSLATIONS: dict[tuple[str, str], str] = {
    (
        "tip-extreme-heat",
        "de",
    ): "Extreme Hitze: Ozonbelastung möglich, Dehydrierungsgefahr. Training ggf. verschieben.",
    (
        "tip-extreme-heat",
        "en",
    ): "Extreme heat: risk of ozone exposure and dehydration. Consider postponing your ride.",
    (
        "tip-heat",
        "de",
    ): "Viel trinken (mind. 1 L/h), Sonnenschutz verwenden, Bergetappen meiden.",
    ("tip-heat", "en"): "Drink at least 1 L/h, apply sunscreen, avoid mountain stages.",
    (
        "tip-ice",
        "de",
    ): "Vorsicht vor Glätte! Besonders nasses Laub und Brücken können rutschig sein.",
    ("tip-ice", "en"): "Watch for ice! Wet leaves and bridges are especially slippery.",
    (
        "tip-visibility",
        "de",
    ): "Helle, reflektierende Kleidung tragen. Licht einschalten — Sichtbarkeit ist reduziert.",
    (
        "tip-visibility",
        "en",
    ): "Wear bright/reflective clothing and use lights — visibility is reduced.",
    (
        "tip-layering",
        "de",
    ): "Zwiebelschalen-Prinzip: Schichten zum einfachen An- und Ausziehen mitnehmen.",
    (
        "tip-layering",
        "en",
    ): "Layer up: easy to add/remove clothes as conditions change.",
    (
        "tip-hypothermia",
        "de",
    ): "Regenklamotten anlassen! Gefahr des Auskühlens durch Verdunstung von Schweiß.",
    (
        "tip-hypothermia",
        "en",
    ): "Keep rain gear on! Risk of cooling down from sweat evaporation.",
    (
        "tip-wind-endurance",
        "de",
    ): "Lange Fahrt bei Wind: Energie einteilen, windgeschützte Pausen einplanen. Windschatten nutzen wenn möglich.",
    (
        "tip-wind-endurance",
        "en",
    ): "Long ride in wind: pace yourself, plan sheltered rest stops. Draft behind others when possible.",
    (
        "tip-air-quality-moderate",
        "de",
    ): "Mäßige Luftqualität: Intensives Training kann die Atemwege belasten. Pausen an schattenreichen Plätzen einlegen.",
    (
        "tip-air-quality-moderate",
        "en",
    ): "Moderate air quality: intense exercise may strain your airways. Take breaks in sheltered areas.",
    (
        "tip-air-quality-poor",
        "de",
    ): "Schlechte Luftqualität: Atemschutzmaske empfohlen. Route abseits stark befahrener Straßen wählen oder Training verschieben.",
    (
        "tip-air-quality-poor",
        "en",
    ): "Poor air quality: face mask recommended. Choose routes away from heavy traffic or consider postponing your ride.",
}


def get_condition_reason_translation(
    code: str,
    locale: str,
) -> ConditionReasonTranslation | None:
    """Get condition reason translation for the given locale."""
    return CONDITION_REASON_TRANSLATIONS.get((code, locale))


def get_tip_translation(tip_id: str, locale: str) -> str:
    """Get tip message translation for the given locale."""
    return TIP_TRANSLATIONS.get((tip_id, locale), "")


def get_clothing_translation(item_id: str, locale: str) -> ItemTranslation | None:
    """Get clothing item translation for the given locale."""
    return CLOTHING_TRANSLATIONS.get((item_id, locale))


def get_equipment_translation(item_id: str, locale: str) -> ItemTranslation | None:
    """Get equipment item translation for the given locale."""
    return EQUIPMENT_TRANSLATIONS.get((item_id, locale))


# ── REPAIR KIT ITEM TRANSLATIONS ────────────────────────────────────────

RepairKitTranslation = dict  # {"name": str}

REPAIR_KIT_TRANSLATIONS: dict[tuple[str, str], RepairKitTranslation] = {
    # ── Minimal tier ──────────────────────────────────────────────────
    ("rk-spare-tube", "de"): {"name": "Ersatzschlauch"},
    ("rk-spare-tube", "en"): {"name": "Spare Tube"},
    ("rk-tire-levers", "de"): {"name": "Reifenheber"},
    ("rk-tire-levers", "en"): {"name": "Tire Levers"},
    ("rk-mini-pump", "de"): {"name": "Minipumpe"},
    ("rk-mini-pump", "en"): {"name": "Mini Pump"},
    ("rk-multi-tool", "de"): {"name": "Multitool"},
    ("rk-multi-tool", "en"): {"name": "Multi-Tool"},
    # ── Standard tier extras ─────────────────────────────────────────
    ("rk-patch-kit", "de"): {"name": "Flickzeug"},
    ("rk-patch-kit", "en"): {"name": "Patch Kit"},
    ("rk-quick-link", "de"): {"name": "Kettenschloss (Quick Link)"},
    ("rk-quick-link", "en"): {"name": "Quick Link"},
    ("rk-zip-ties", "de"): {"name": "Kabelbinder"},
    ("rk-zip-ties", "en"): {"name": "Zip Ties"},
    ("rk-tire-boot", "de"): {"name": "Reifenflicken (Tire Boot)"},
    ("rk-tire-boot", "en"): {"name": "Tire Boot"},
    # ── Extended tier extras ─────────────────────────────────────────
    ("rk-spare-tube-2", "de"): {"name": "Zweiter Ersatzschlauch"},
    ("rk-spare-tube-2", "en"): {"name": "Second Spare Tube"},
    ("rk-chain-tool", "de"): {"name": "Kettennieter"},
    ("rk-chain-tool", "en"): {"name": "Chain Tool"},
    ("rk-spoke-wrench", "de"): {"name": "Speichenschlüssel"},
    ("rk-spoke-wrench", "en"): {"name": "Spoke Wrench"},
    ("rk-electrical-tape", "de"): {"name": "Isolierband"},
    ("rk-electrical-tape", "en"): {"name": "Electrical Tape"},
    # ── Bike-type-specific ───────────────────────────────────────────
    ("rk-co2-cartridge", "de"): {"name": "CO\u2082-Kartusche + Adapter"},
    ("rk-co2-cartridge", "en"): {"name": "CO\u2082 Cartridge + Inflator"},
    ("rk-tubeless-plugs", "de"): {"name": "Tubeless-Reparaturset"},
    ("rk-tubeless-plugs", "en"): {"name": "Tubeless Plug Kit"},
    ("rk-tire-boot-gravel", "de"): {"name": "Gravel-Reifenflicken (verstärkt)"},
    ("rk-tire-boot-gravel", "en"): {"name": "Gravel Tire Boot (reinforced)"},
    ("rk-disc-brake-pad", "de"): {"name": "Bremsbelag (Ersatz)"},
    ("rk-disc-brake-pad", "en"): {"name": "Disc Brake Pad (spare)"},
    ("rk-chain-lube", "de"): {"name": "Kettenöl-Sachet"},
    ("rk-chain-lube", "en"): {"name": "Chain Lube Sachet"},
}


def get_repair_kit_translation(
    item_id: str, locale: str
) -> RepairKitTranslation | None:
    """Get repair kit item translation for the given locale."""
    return REPAIR_KIT_TRANSLATIONS.get((item_id, locale))


def get_wmo_description(code: int, locale: str) -> str:
    """Get WMO weather description for the given locale."""
    return WMO_DESCRIPTIONS.get(
        (code, locale), WMO_DESCRIPTIONS.get((code, "en"), "Unknown")
    )
