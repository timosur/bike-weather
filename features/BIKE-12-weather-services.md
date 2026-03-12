# BIKE-12: Weather & Ride Services

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-12    |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Core weather and ride calculation services. Fetches weather forecasts from an external API, performs wind analysis (headwind/crosswind/tailwind estimation), and calculates estimated ride speed based on bike type, intensity, and weather conditions. Defines bike profiles with type-specific parameters.

## Scope

Sub-features and areas covered:

- Weather forecast service — fetches forecast data from external weather API
- Wind analysis — calculates headwind/crosswind/tailwind based on riding direction and wind direction
- Speed estimation — estimates riding speed factoring in bike type, intensity, terrain, and weather conditions
- Bike profiles — defines parameters per bike type (road, gravel, MTB, city) affecting speed and clothing
- Felt temperature calculation — adjusts temperature by wind chill and riding intensity

### Key Files

- `backend/app/services/weather.py` — external weather API integration
- `backend/app/services/wind_analysis.py` — wind direction analysis and impact calculation
- `backend/app/rules/speed_estimation.py` — speed estimation by bike type and conditions
- `backend/app/rules/bike_profiles.py` — bike type profiles and parameters
- `backend/app/rules/condition.py` — weather condition evaluation and felt temperature

## Acceptance Criteria (Summary)

- Weather service fetches accurate forecast data for a given location, date, and time
- Wind analysis determines headwind/crosswind/tailwind percentages based on direction
- Speed estimation accounts for bike type, intensity, wind, and precipitation
- Felt temperature is adjusted by intensity (athletic +2°C, moderate ±0°C, relaxed −2°C)
- Bike profiles define distinct parameters for road, gravel, MTB, and city bikes

---

## Tech Design

_Retroactive — see `docs/spec/architecture.md` and `docs/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
