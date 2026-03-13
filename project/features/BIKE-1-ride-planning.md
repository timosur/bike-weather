# BIKE-1: Ride Planning & Reports

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| **ID**           | BIKE-1                                         |
| **Status**       | Deployed                                       |
| **Created**      | 2024-01-01                                     |
| **Dependencies** | BIKE-2 (geocoding), BIKE-12 (weather services) |

## Description

Core feature. Users enter ride details (location, date/time, bike type, intensity, distance) and receive a weather-based ride report with personalized clothing, equipment, safety, and tip recommendations. The rule-based recommendation engine selects items by body zone and temperature range, adjusted for bike type. Reports display weather conditions alongside organized recommendation sections.

## Scope

Sub-features and areas covered:

- Ride planner form (location, date, time, bike type, intensity, distance)
- Ride report generation via weather API + rule engine
- Clothing recommendations by body zone (head, eyes, neck/face, base layer, jersey, jacket, legs, hands, feet) with felt-temperature thresholds
- Equipment recommendations (lights, mudguards, hydration, repair kit)
- Safety warnings (wind, precipitation, visibility, heat/cold extremes)
- Contextual tips (nutrition, UV, night riding)
- Bike type selection (road, gravel, MTB, city) affecting clothing variants and speed estimation
- Optional captcha verification after throttle threshold

### Key Files

- `backend/app/api/routes/rides.py` — POST /api/rides/report endpoint
- `backend/app/services/recommendations.py` — orchestrates weather fetch + rule engine
- `backend/app/rules/clothing_rules.py` — clothing selection by body zone and temperature
- `backend/app/rules/equipment_rules.py` — equipment recommendations
- `backend/app/rules/safety_rules.py` — safety warnings
- `backend/app/rules/tips_rules.py` — contextual tips
- `backend/app/rules/condition.py` — weather condition evaluation
- `backend/app/rules/translations.py` — DE/EN recommendation text
- `backend/app/rules/bike_profiles.py` — bike type profiles
- `frontend/src/pages/PlannerPage.tsx` — planner form page
- `frontend/src/pages/ReportPage.tsx` — ride report display
- `frontend/src/components/ride-planner/` — planner form components
- `frontend/src/components/ride-report/` — report display components
- `frontend/src/api/rides.ts` — API client for rides

## Acceptance Criteria (Summary)

- User can fill out ride details and generate a weather-based report
- Report shows clothing recommendations organized by body zone
- Clothing items change based on felt temperature (adjusted by intensity)
- Bike type selection affects clothing variants (e.g., aero vs. relaxed fit)
- Equipment, safety, and tip sections render based on weather conditions
- Report displays weather forecast data (temperature, wind, precipitation, UV)

---

## Tech Design

_Retroactive — see `project/spec/architecture.md` and `project/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
