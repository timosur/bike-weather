# Product Requirements Document — Bike Weather

## Vision

Bike Weather helps cyclists dress right for every ride. It combines real weather forecasts with a rule-based recommendation engine to give personalized clothing, gear, safety, and tip advice — so riders spend less time guessing and more time riding.

## Target Users

| User                         | Needs                                                     | Pain Points                                             |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| **Recreational cyclists**    | Quick answer: "What should I wear for my ride tomorrow?"  | Over- or under-dressing; checking multiple weather apps |
| **Commuter cyclists**        | Reliable daily clothing guidance for predictable routes   | No time to research conditions every morning            |
| **Touring / gravel riders**  | Route-aware recommendations (GPX import) for longer rides | Weather changes along a route; packing the wrong gear   |
| **Admin / content managers** | Manage products, content, FAQ from a dashboard            | Keeping product catalog and CMS content up to date      |

## Core Features (Roadmap)

| Priority | Feature                          | Description                                                                            |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| P0 (MVP) | Ride planner & report            | Enter ride details → get weather-based clothing/gear recommendations                   |
| P0       | Rule-based recommendation engine | Deterministic rules for clothing (by body zone & temperature), equipment, safety, tips |
| P0       | Authentication                   | Login, registration, password recovery via Authentik OIDC                              |
| P0       | Weather service                  | Fetch and process weather forecasts for ride planning                                  |
| P1       | Saved routes                     | Save, edit, delete, share favorite routes; quick re-check with current weather         |
| P1       | Product catalog & matching       | Browse products by category; inline product links in ride reports                      |
| P1       | GPX import                       | Upload GPX files from Komoot/Strava to pre-fill planner                                |
| P1       | Admin panel                      | CRUD for products, categories, shops, FAQ, content pages, contact messages             |
| P1       | LLM product scraper (agent)      | Automated product extraction from shop websites using OpenAI + Anthropic               |
| P1       | i18n (DE/EN)                     | Full German + English support across frontend and backend content                      |
| P1       | Observability                    | Grafana Faro (frontend), OpenTelemetry (backend), distributed tracing                  |
| P2       | Search-based product import      | Replace category scraping with search-term-driven import and direct item matching      |
| P2       | Test contracts & CI hardening    | CI test gating, OpenAPI contract tests, generated TypeScript types                     |
| P2       | shadcn/ui component migration    | Replace self-built primitives with shadcn/ui; upgrade Tailwind v3 → v4                 |
| P2       | Air quality in reports           | Include air conditions and pollutions in ride reports                                  |

## Success Metrics

- **Ride reports generated per week** — primary usage indicator
- **Saved routes per user** — engagement / retention signal
- **Product click-through rate** — affiliate link effectiveness
- **Report generation time (p95)** — performance target: < 2s
- **Frontend error rate** — monitored via Grafana Faro

## Constraints

- **Self-hosted infrastructure** — runs on a K3s homelab cluster via ArgoCD; no cloud PaaS
- **Limited compute** — 1 AMD control plane + 2 ARM workers; multi-arch images required
- **Authentik dependency** — all auth flows go through Authentik OIDC; no custom auth
- **German-first audience** — German is the default language; English is secondary
- **Single developer** — lean workflow; automation and AI-assisted development are critical

## Non-Goals

- **Native mobile apps** — web-only, responsive design serves mobile users
- **Real-time weather alerts / push notifications** — reports are on-demand, not live
- **Social features** — no ride groups, feeds, or community; sharing is link-based only
- **Route planning / navigation** — we recommend gear for rides, we don't plan the route itself
- **E-commerce / direct sales** — product links are affiliate; no checkout flow
