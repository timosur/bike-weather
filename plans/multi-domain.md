# Multi-Domain: Serve on bike-weather.com + fahrrad-wetter.com

## Goal

Expose the site on both `bike-weather.com` and `fahrrad-wetter.com` without redirects, optimized for SEO.

## Approach

**Language-based domain split** — the best strategy since the app already has full i18n (de/en):

- `fahrrad-wetter.com` → German default
- `bike-weather.com` → English default

Both domains serve the same app but with different default language and proper `hreflang` cross-references. This avoids duplicate content penalties while maximizing SEO in both language markets.

Users can still switch language on either domain — the default just differs.

## Technical Changes

### 1. Frontend — Domain-Aware Runtime Config

**`docker-entrypoint.sh` / `config.js`**
- Add a `SITE_DOMAIN` or `CANONICAL_BASE_URL` to `window.__RUNTIME_CONFIG__`
- Alternatively, derive domain from `window.location.origin` at runtime (simpler, no config needed)

**`index.html` — Meta Tags**
- Currently hardcoded canonical: `https://bike-weather.com/`
- Needs to be dynamic or injected at build/serve time
- Options:
  - **Runtime JS**: Set canonical/OG tags via React Helmet or equivalent on mount
  - **Entrypoint templating**: `docker-entrypoint.sh` already does `envsubst` — add domain substitution

**Default Language**
- Detect domain in `src/i18n/` init:
  - `fahrrad-wetter.com` → `de`
  - `bike-weather.com` → `en`
- Fall back to browser `Accept-Language` if domain is unknown (e.g. localhost)

### 2. Frontend — SEO Files

**`public/robots.txt`**
- Currently: `Sitemap: https://bike-weather.com/sitemap.xml`
- Must be domain-aware. Options:
  - Serve dynamically via nginx config (rewrite based on `$host`)
  - Generate two versions at entrypoint startup

**`public/sitemap.xml`**
- All 7 page URLs hardcoded to `https://bike-weather.com/...`
- Needs two sitemaps — one per domain with correct base URL
- Cross-reference via `xhtml:link hreflang` entries pointing to the other domain's equivalent page
- Example:
  ```xml
  <!-- On bike-weather.com/sitemap.xml -->
  <url>
    <loc>https://bike-weather.com/planner</loc>
    <xhtml:link rel="alternate" hreflang="de" href="https://fahrrad-wetter.com/planner"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://bike-weather.com/planner"/>
  </url>
  ```

**`public/site.webmanifest`**
- `name`, `short_name`, `start_url` may need to vary per domain
- Can be templated at entrypoint or served dynamically

### 3. Frontend — hreflang Tags in HTML

- Currently in `sitemap.xml` only
- Should also be in `<head>` of every page for full coverage:
  ```html
  <link rel="alternate" hreflang="de" href="https://fahrrad-wetter.com/current-path"/>
  <link rel="alternate" hreflang="en" href="https://bike-weather.com/current-path"/>
  <link rel="alternate" hreflang="x-default" href="https://bike-weather.com/current-path"/>
  ```
- Implement via a React component (e.g. `<HreflangTags />`) that reads current path and builds links

### 4. Frontend — Canonical URL

- Each page must set `<link rel="canonical">` to the appropriate domain based on current language:
  - German content → canonical to `fahrrad-wetter.com`
  - English content → canonical to `bike-weather.com`
- Prevents duplicate content penalties across domains

### 5. Backend — CORS

**`app/config.py`**
- `CORS_ORIGINS` must include both:
  ```
  CORS_ORIGINS=["https://bike-weather.com","https://fahrrad-wetter.com"]
  ```
- No code change needed — already supports a list of origins

### 6. Backend — FRONTEND_URL

- Currently single-valued, used for auth redirect URLs
- Options:
  - Accept a list and pick based on request `Origin`/`Referer` header
  - Or keep as primary domain; auth redirects always go to one domain (simpler, acceptable)

### 7. Auth — Authentik OIDC

- OIDC redirect URIs must include both domains:
  - `https://bike-weather.com/auth/callback`
  - `https://fahrrad-wetter.com/auth/callback`
- Allowed origins must include both
- `scripts/setup_authentik.py` should be updated to provision both redirect URIs
- Frontend OIDC client already uses `window.location.origin` for redirect_uri — no change needed there

### 8. Infrastructure — DNS & TLS

- **DNS**: `fahrrad-wetter.com` A/AAAA records pointing to same server as `bike-weather.com`
- **TLS**: Certificate covering both domains (Let's Encrypt supports multiple SANs, or use separate certs)
- **Ingress/Reverse Proxy**: Add `fahrrad-wetter.com` as additional hostname to existing ingress rule
  - Both hostnames route to the same frontend service
  - Backend API calls go through the same `/api` proxy regardless of frontend domain

### 9. Homelab — Kubernetes Ingress

- Add second host entry to the frontend Ingress resource:
  ```yaml
  rules:
    - host: bike-weather.com
      http: ...
    - host: fahrrad-wetter.com
      http: ...
  tls:
    - hosts:
        - bike-weather.com
        - fahrrad-wetter.com
      secretName: bike-weather-tls
  ```

## Implementation Order

1. **Frontend runtime domain detection** — i18n default language + canonical URL logic
2. **Frontend SEO components** — `<HreflangTags />`, canonical tag management, OG tag updates
3. **Frontend SEO files** — Domain-aware `robots.txt`, `sitemap.xml`, `site.webmanifest` via entrypoint templating or nginx
4. **Backend CORS** — Add second origin (config-only change)
5. **Authentik setup** — Add second redirect URI
6. **Infrastructure** — DNS, TLS, Ingress for `fahrrad-wetter.com`

## Considerations

- **Google Search Console**: Register both domains and set up domain-level property
- **Structured Data / JSON-LD**: If added later, ensure URLs match the serving domain
- **Social Sharing**: OG/Twitter meta tags must reflect the domain the user is on
- **Email Links**: Any transactional emails (password reset, etc.) should use the domain the user signed up from
- **Analytics**: Tag traffic by domain to track SEO performance per market
- **Cookie Domain**: If cookies are used, ensure they're scoped per domain (not shared)
- **Service Workers / PWA**: `site.webmanifest` scope and start_url must match the serving domain
