---
applyTo: "frontend/**"
---

# Frontend Instructions

## Structure

All pages lazy-loaded in `App.tsx` with React Router v7. Import alias `@/*` → `src/*`.

- `src/pages/` — page components (default exports, one per route)
- `src/components/` — organized by feature domain (`shell/`, `ride-planner/`, `admin/`, etc.)
- `src/api/` — API client modules, one per backend resource
- `src/contexts/AuthContext.tsx` — OIDC auth state via `oidc-client-ts`
- `src/i18n/` — i18next config and locale files

## Patterns

### API Client

Every backend resource has a matching `src/api/<resource>.ts` module. All use `apiFetch()` from `src/api/client.ts`.

- Always check existing API modules before creating new ones: `ls frontend/src/api/`
- Follow the established pattern: export typed functions that call `apiFetch()`

### Routing & Guards

- `RequireAuth` wrapper for authenticated routes
- `RequireAdmin` wrapper for admin routes
- All page components use default exports and are lazy-loaded in `App.tsx`

### Internationalization

- All user-facing strings go through `useTranslation()` (i18next)
- German (`de.json`) is the default/fallback language
- English (`en.json`) is the secondary language
- Translation keys in `frontend/src/i18n/locales/`
- Backend content translated via `Accept-Language` header sent by the API client

### Styling

- **Tailwind CSS** with class-based dark mode
- **Fonts:** Outfit (headings), Inter (body), IBM Plex Mono (mono)
- No inline styles or CSS modules — Tailwind only
- Dark mode: use `dark:` variants, toggled via class on root element

### Components

- Check existing components before creating new ones: `ls frontend/src/components/`
- Organize by feature domain, not by component type
- TypeScript interfaces for all props
- Handle loading, error, and empty states

## TypeScript

- Strict mode: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- No `any` types — use proper typing
- Prefer interfaces over type aliases for object shapes

## Testing

```bash
cd frontend && npx playwright test                    # all E2E tests
cd frontend && npx playwright test e2e/auth.spec.ts   # single spec
```
