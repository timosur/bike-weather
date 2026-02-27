# Bike Weather — Recommendation Matrix

> Overview of all clothing, equipment, and safety recommendations by temperature and weather conditions.
> Based on the [Pedalieri cycling clothing guide](http://www.pedalieri.de/2012/03/19/der-radklamotten-guide-anziehen-was-zum-wetter-passt/) and our own additions.
>
> **Temperature** = felt temperature (feels-like), adjusted by intensity:
> athletic +2°C, moderate ±0°C, relaxed −2°C.

---

## Clothing by Body Zone

### Head

| Condition | Item | Description |
|---|---|---|
| feels ≥ 30°C | Cycling cap | Light cycling cap under helmet for sun protection |
| feels 5–14°C | Headband | Light headband under helmet |
| feels < 5°C | Helmet cover | Waterproof helmet cover (insulating) |
| Precipitation > 30% AND feels < 20°C | Helmet rain cover | Waterproof cover against rain |

### Eyes

| Condition | Item | Description |
|---|---|---|
| UV index ≥ 3 | Sport sunglasses | UV protection |
| UV < 3 AND Precipitation > 30% | Clear cycling glasses | Protection from spray |
| feels < 5°C | Cycling glasses (wind protection) | Close-fitting, protects eyes from cold drafts |

### Neck / Face

| Condition | Item | Description |
|---|---|---|
| feels < 5°C | Neck gaiter / neck protection | Protects neck and nape from cold |
| feels < 0°C | Breathing mask / face mask | Protects airways and face from cold |

### Base Layer (Undershirt)

| Condition | Item | Description |
|---|---|---|
| feels < 10°C | Merino undershirt | Long-sleeve, temperature-regulating, odor-resistant |
| feels ≥ 10°C | Performance undershirt | Short-sleeve, moisture-wicking |

### Jersey / Mid Layer

| Condition | Item | Alternatives |
|---|---|---|
| feels < 0°C | Thermal long-sleeve jersey | — |
| feels 0–9°C | Long-sleeve jersey | Short-sleeve jersey + arm warmers |
| feels 10–19°C | Light long-sleeve jersey | Short-sleeve jersey + arm warmers |
| feels 20–29°C | Short-sleeve jersey | — |
| feels ≥ 30°C | Short-sleeve jersey | Sleeveless jersey |

### Jacket / Outer Layer (Priority: first matching rule)

| Condition | Item | Alternatives |
|---|---|---|
| Precipitation > 50% | Waterproof rain jacket | — |
| Precipitation 21–50% | Packable rain jacket | Light wind vest |
| Wind > 30 km/h | Wind jacket | — |
| Wind 16–30 km/h | Wind vest | Packable wind jacket |
| feels < 5°C | Insulated cycling jacket | — |
| feels 5–9°C (no wind/rain trigger) | Windstopper jacket | Wind vest |
| — | None | — |

### Legs

| Condition | Item | Alternatives |
|---|---|---|
| feels < 0°C | Thermal bib tights + cycling underwear | Thermal tights + leg warmers |
| feels 0–4°C | Thermal bib tights | Tights + leg warmers |
| feels 5–14°C | Long padded cycling tights | Short cycling shorts + leg warmers |
| feels ≥ 15°C | Short padded cycling shorts | — |

### Rain Pants (Additional)

| Condition | Item |
|---|---|
| Precipitation > 50% AND feels < 25°C | Waterproof overpants |

### Hands

| Condition | Item |
|---|---|
| feels < 0°C | Waterproof winter gloves |
| feels 0–9°C AND Precipitation > 40% | Waterproof winter gloves |
| feels 0–9°C AND Precipitation ≤ 40% | Warm cycling gloves |
| feels ≥ 10°C | Light cycling gloves |

### Feet — Overshoes

| Condition | Item |
|---|---|
| Precipitation > 30% | Waterproof overshoes |
| feels < 10°C AND Precipitation ≤ 30% | Windstopper overshoes |

### Feet — Socks

| Condition | Item |
|---|---|
| feels < 5°C | Warm merino socks |
| feels 5–14°C | Midweight socks |
| feels ≥ 15°C | Thin merino socks |

---

## Equipment

| Condition | Item |
|---|---|
| Always | 750ml water bottle |
| feels < 5°C | Insulated bottle with warm drink |
| UV index ≥ 3 | Sunscreen SPF 30+ |
| Departure before sunrise | Bike lights (front + rear) |
| Arrival after sunset | Bike lights (front + rear) |
| Precipitation > 50% | Fenders |
| Precipitation > 50% | Dry bag for valuables |
| Distance > 30 km | Puncture repair kit |
| Distance > 50 km | Energy bar |

---

## Safety & Comfort Tips

| Condition | Category | Severity | Tip |
|---|---|---|---|
| feels > 35°C | Heat | ⚠️ Warning | Extreme heat: ozone exposure possible, risk of dehydration. Consider postponing training. |
| feels > 30°C | Heat | ℹ️ Info | Drink plenty (at least 1L/h), use sun protection, avoid mountain stages. |
| temp_min ≤ 2°C | Safety | ⚠️ Warning | Watch out for slippery surfaces! Wet leaves and bridges can be slick. |
| Precipitation > 30% | Safety | ℹ️ Info | Wear bright, reflective clothing. Turn on lights — visibility is reduced. |
| 10°C ≤ feels ≤ 20°C | Comfort | ℹ️ Info | Layering principle: bring layers for easy on/off adjustments. |
| feels < 10°C AND Precipitation > 30% | Safety | ⚠️ Warning | Keep rain gear on! Risk of cooling down due to sweat evaporation. |

---

## Ride Conditions (Condition Rating)

| Condition | Rating |
|---|---|
| Thunderstorm (WMO 95, 96, 99) | 🔴 Not recommended |
| Snow (WMO 71, 73, 75, 77, 85, 86) | 🔴 Not recommended |
| temp_min < −5°C | 🔴 Not recommended |
| Wind > 50 km/h | 🔴 Not recommended |
| feels > 40°C | 🔴 Not recommended |
| feels > 35°C | 🟡 Caution |
| Precipitation > 50% | 🟡 Caution |
| temp_min < 5°C | 🟡 Caution |
| Wind > 30 km/h | 🟡 Caution |
| Precipitation < 20% AND 12 ≤ feels ≤ 22 AND Wind < 15 | 🟢 Ideal |
| Everything else | 🔵 Good |