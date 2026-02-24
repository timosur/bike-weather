# Data Shapes

## Overview

This directory contains the TypeScript interfaces that define the data contracts between the UI components and the host application. These are the shapes of data that components expect via props -- they are NOT backend database models. The implementation agent decides how to store, fetch, and transform data to match these shapes.

## Entities by Section

### Ride Planner

| Entity | Description |
|---|---|
| `BikeType` | Union type for bike categories: rennrad, gravel, mtb, city |
| `RidingIntensity` | Union type for riding effort: gemuetlich, moderat, sportlich |
| `RideLocation` | Address with optional lat/lon coordinates |
| `DayStop` | Overnight stop for multi-day tours with location and optional planned km |
| `RideInput` | Complete ride planning form data including location, dates, bike type, intensity, distance, elevation, and day stops |
| `LocationSuggestion` | Autocomplete suggestion with display text and coordinates |
| `BikeTypeOption` | Display option for bike type selector (value, label, description, icon) |
| `RidingIntensityOption` | Display option for intensity selector (value, label, description) |
| `QuickPreset` | Pre-configured ride preset for quick form fill |
| `ValidationErrors` | Per-field validation error messages |

### Ride Report

| Entity | Description |
|---|---|
| `ConditionRating` | Overall ride condition: ideal, good, caution, not-recommended |
| `WeatherIcon` | Weather condition icon identifier (sun, cloud-sun, cloud, rain, snow, thunderstorm, fog) |
| `ClothingIcon` | Clothing item icon identifier (jersey, jacket, gloves, etc.) |
| `WeatherData` | Weather data for a day: temps, precipitation, wind, humidity, UV, sunrise/sunset |
| `ClothingAlternative` | Swappable alternative for a clothing item |
| `ClothingItem` | Individual clothing recommendation with icon, reason, and alternatives |
| `EquipmentItem` | Equipment recommendation with name and reason |
| `DayForecast` | Single-day forecast with weather, clothing, and equipment |
| `RideReport` | Complete ride report with multiple day forecasts |

### Product Recommendations

| Entity | Description |
|---|---|
| `CategoryIcon` | Product category icon identifier (jacket, gloves, pants, etc.) |
| `ClothingZoneId` | Body zone a product matches: head, upperBody, lowerBody, hands, feet |
| `Shop` | Affiliate shop with name, logo, and tag |
| `ProductCategory` | Product category with name, icon, and count |
| `TempRange` | Temperature range a product is suited for |
| `PrecipitationRating` | Precipitation resistance level |
| `WindRating` | Wind protection level |
| `WeatherSuitability` | Structured weather suitability for a product |
| `Product` | Affiliate product with pricing, shop, weather suitability, and zone matching |
| `AffiliateDisclosure` | Advertising disclosure badge label and disclaimer text |

### My Routes

| Entity | Description |
|---|---|
| `RidingStyle` | Riding style label: Sporty, Easy, Touring |
| `SavedRoute` | Saved route with metadata, last condition rating, and timestamps |

### Login

| Entity | Description |
|---|---|
| `AuthTab` | Active auth tab: login or register |
| `LoginFormData` | Login form data: email, password |
| `RegisterFormData` | Registration form data: email, password, passwordConfirm |

### FAQ

| Entity | Description |
|---|---|
| `FaqItem` | FAQ entry with question, answer, and category |

### Contact

| Entity | Description |
|---|---|
| `ContactCategory` | Contact form category: feedback, bug, feature, sonstiges |
| `ContactFormData` | Contact form data: category, name, email, message |

## File

All interfaces are aggregated in `overview.ts` for quick reference.
