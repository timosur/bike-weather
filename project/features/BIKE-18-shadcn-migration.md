# BIKE-18: shadcn/ui Component Migration

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-18    |
| **Status**       | Planned    |
| **Created**      | 2026-03-12 |
| **Dependencies** | None       |

## Description

Replace self-built UI primitives with [shadcn/ui](https://ui.shadcn.com/) components to improve maintainability, accessibility (Radix UI primitives), and consistency. This includes upgrading from Tailwind CSS v3 to v4 and customizing the shadcn theme to match the existing stone/emerald visual design.

The migration follows an **incremental strategy**: low-level primitives first (Button, Input, Badge, Skeleton), then complex composites (Dialog, Sheet, Tabs, Toast, Tooltip, Table). Domain-specific components (e.g., `ConditionBadge`, `DayTabs`, `WeatherChart`) remain custom but may adopt shadcn primitives internally.

**Scope: public-facing UI first.** Admin panel migration is deferred to a follow-up.

## Scope

### Phase 1 — Foundation

- Upgrade Tailwind CSS v3 → v4
- Install shadcn/ui CLI and dependencies (`class-variance-authority`, `clsx`, `tailwind-merge`, Radix UI packages)
- Configure shadcn theme: stone color scale, emerald accent, `Outfit`/`Inter`/`IBM Plex Mono` fonts, dark mode via `class` strategy
- Create `cn()` utility (`lib/utils.ts`)
- Add base shadcn `Button` component (not currently extracted — buttons are inline Tailwind classes throughout)

### Phase 2 — Low-level primitives

Replace the following self-built components with shadcn equivalents:

| Self-built                                                       | shadcn replacement                   | Location                                              |
| ---------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| `SkeletonPrimitives` (Block, Circle, Line, Button, Card)         | `Skeleton` + `Card`                  | `components/skeleton/`                                |
| `StatusBadge`                                                    | `Badge`                              | `components/admin/shared/` (used in public views too) |
| `ConditionBadge` (internal only)                                 | `Badge` used inside custom component | `components/ride-report/`                             |
| `FormComponents` (TextInput, TextArea, SelectInput, NumberInput) | `Input`, `Textarea`, `Select`        | `components/admin/shared/`                            |
| `FormField`                                                      | `Label` + form layout                | `components/admin/shared/`                            |
| `ToggleSwitch`                                                   | `Switch`                             | `components/admin/shared/`                            |
| `SegmentedToggle`                                                | `Tabs`                               | `components/shell/`                                   |

### Phase 3 — Complex composites (public-facing)

| Self-built                | shadcn replacement | Location                   |
| ------------------------- | ------------------ | -------------------------- |
| `DeleteConfirmDialog`     | `AlertDialog`      | `components/my-routes/`    |
| `UnsavedChangesDialog`    | `AlertDialog`      | `components/common/`       |
| `GpxImportModal`          | `Dialog`           | `components/ride-planner/` |
| `EditRouteModal`          | `Dialog`           | `components/my-routes/`    |
| `ToastContainer` (common) | `Sonner`           | `components/common/`       |
| `InfoTooltip`             | `Tooltip`          | `components/common/`       |

### Out of scope (deferred)

- Admin-specific components: `AdminDataTable`, `SlidePanel`, `SearchFilterBar`, admin `ToastContainer`, `ConfirmDialog`
- Admin layout: `AdminSidebar`, `AdminHeader`, `AdminLayout`
- Domain-specific presentation components (keep custom): `WeatherIcon`, `WeatherChart`, `ClothingItemCard`, `RouteMap`, `ProductCard`, etc.

## User Stories

- As a **developer**, I want standardized UI primitives from shadcn/ui, so that I spend less time maintaining custom components and more time on features.
- As a **developer**, I want Tailwind v4 with the latest features and performance improvements, so that the frontend build stays modern and fast.
- As a **user**, I want consistent, accessible interactive elements (dialogs, tooltips, toasts), so that keyboard navigation and screen readers work reliably.
- As a **user**, I want the visual design to remain unchanged after migration, so that my experience is not disrupted.
- As a **developer**, I want a shared `cn()` utility and shadcn theming conventions, so that future components follow a single pattern.

## Acceptance Criteria

- [ ] AC-1: Tailwind CSS v4 is installed and the entire frontend builds without errors (`npm run build` passes)
- [ ] AC-2: shadcn/ui is initialized with a `components.json` config pointing to the project's theme
- [ ] AC-3: The shadcn theme uses stone color palette, emerald as primary accent, `class`-based dark mode, and the existing font stack (Outfit headings, Inter body, IBM Plex Mono code)
- [ ] AC-4: A `cn()` utility exists at `frontend/src/lib/utils.ts` combining `clsx` and `tailwind-merge`
- [ ] AC-5: Phase 2 primitives (`Skeleton`, `Badge`, `Input`, `Textarea`, `Select`, `Switch`, `Tabs`, `Button`, `Card`, `Label`) are available as shadcn components under `components/ui/`
- [ ] AC-6: Phase 3 composites (`AlertDialog`, `Dialog`, `Sonner`, `Tooltip`) are available as shadcn components under `components/ui/`
- [ ] AC-7: All public-facing pages that previously used self-built primitives now use shadcn equivalents — no visual regression (colors, spacing, dark mode)
- [ ] AC-8: The self-built component files replaced by shadcn equivalents are removed (no dead code)
- [ ] AC-9: All existing Playwright E2E tests pass
- [ ] AC-10: Keyboard navigation works on all replaced dialogs and tooltips (Radix handles focus trapping, Escape to close)
- [ ] AC-11: `ConditionBadge` and other domain components that use `Badge` internally are updated to use the shadcn `Badge` variant system

## Edge Cases

- EC-1: Tailwind v3 → v4 breaking changes in config format (`tailwind.config.js` → CSS-based config), `@apply` behavior, and deprecated utilities — must audit and fix all occurrences
- EC-2: Dark mode — shadcn uses CSS variables for theming; must ensure `class`-based dark mode toggle still works with CSS variable approach
- EC-3: `ToggleSwitch` has a custom animation (`translate-x-4.5`); shadcn `Switch` uses Radix which handles its own animation — verify visual parity
- EC-4: `ToastContainer` uses a custom `useToast` hook; replacing with Sonner requires migrating all `useToast()` call sites to `toast()` from Sonner
- EC-5: `GpxImportModal` combines file upload UI with a dialog — after replacing the dialog shell, the inner upload logic must remain intact
- EC-6: `InfoTooltip` uses manual click-to-toggle on mobile; Radix `Tooltip` is hover-only by default — may need `Popover` for mobile tap support or keep the click handler
- EC-7: Font loading — shadcn defaults include `@fontsource` or next/font; ensure existing `@fontsource/outfit`, `@fontsource/inter`, `@fontsource/ibm-plex-mono` imports remain
- EC-8: `z-index` stacking — current dialogs use `z-50`, `z-[60]`, `z-[70]`; Radix portals manage their own stacking — verify no layering conflicts with the Leaflet map or other absolute elements

---

<!-- Appended by architecture skill -->

## Tech Design

### Service Impact Map

```
Frontend: Config + theme overhaul, ~15 component replacements, 1 hook removal
Backend:  No changes
Agent:    No changes
Database: No changes
```

This is a **frontend-only** change. No API, model, or backend work required.

### Phase 1 — Foundation: Tailwind v4 + shadcn Bootstrap

#### Tailwind v3 → v4 Upgrade

Tailwind v4 moves configuration from JavaScript into CSS. The current `tailwind.config.js` and `postcss.config.js` will be replaced:

- **Remove:** `tailwind.config.js`, `postcss.config.js`
- **Replace:** All configuration moves into `src/index.css` using `@import "tailwindcss"` and `@theme` directives
- **Vite plugin:** Switch from `postcss: { tailwindcss }` to `@tailwindcss/vite` plugin in `vite.config.ts`
- **Dependencies removed:** `tailwindcss` (v3), `postcss`, `autoprefixer` from devDependencies
- **Dependencies added:** `tailwindcss` (v4), `@tailwindcss/vite`

The single `@apply` usage in `index.css` (`bg-stone-50 dark:bg-stone-950`) will be converted to plain CSS properties.

#### shadcn/ui Initialization

shadcn/ui is not a package — it generates component source files into your project. Setup:

1. Install peer dependencies: `tailwind-merge`, `clsx`, `class-variance-authority` (cva), `lucide-react` (already installed)
2. Create `src/lib/utils.ts` with the `cn()` utility (combines `clsx` + `tailwind-merge`)
3. Create `components.json` at `frontend/` root — tells the shadcn CLI where to put components and which theme to use

#### Theme Configuration

The shadcn/ui theme uses CSS custom properties. These map to the existing visual system:

| Design token           | Light value (stone)     | Dark value (stone)      | Purpose                            |
| ---------------------- | ----------------------- | ----------------------- | ---------------------------------- |
| `--background`         | stone-50 (`#fafaf9`)    | stone-950 (`#0c0a09`)   | Page background                    |
| `--foreground`         | stone-900 (`#1c1917`)   | stone-100 (`#f5f5f4`)   | Default text                       |
| `--primary`            | emerald-600 (`#059669`) | emerald-500 (`#10b981`) | Accent buttons, links, focus rings |
| `--primary-foreground` | white                   | white                   | Text on primary                    |
| `--card`               | white                   | stone-900 (`#1c1917`)   | Card backgrounds                   |
| `--border`             | stone-200 (`#e7e5e4`)   | stone-800 (`#292524`)   | Borders, dividers                  |
| `--ring`               | emerald-500/40          | emerald-500/40          | Focus ring color                   |
| `--muted`              | stone-100 (`#f5f5f4`)   | stone-800 (`#292524`)   | Muted backgrounds                  |
| `--destructive`        | red-600                 | red-500                 | Delete buttons, error states       |
| `--accent`             | stone-100               | stone-800               | Hover backgrounds                  |

Dark mode approach: `:root` defines light values; `.dark` selector overrides them. The existing `useTheme` hook (toggles `dark` class on `<html>`) works unchanged.

Font stack stays the same — Outfit for headings, Inter for body, IBM Plex Mono for code. These are configured in the CSS `@theme` block and kept loaded via `@fontsource` imports.

### Phase 2 — Primitive Component Mapping

Each shadcn component lives in `src/components/ui/` as a standalone file. The CLI generates them; we then customize the theme tokens.

#### Component Tree After Migration

```
src/components/ui/          ← shadcn primitives (new)
├── alert-dialog.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── skeleton.tsx
├── switch.tsx
├── tabs.tsx
├── textarea.tsx
├── tooltip.tsx
└── sonner.tsx

src/components/skeleton/    ← REMOVE (replaced by ui/skeleton + ui/card)
src/components/common/
├── InfoTooltip.tsx          ← Refactor: uses ui/tooltip internally
├── TurnstileWidget.tsx      ← Keep as-is (third-party widget)
├── UnsavedChangesDialog.tsx ← Refactor: uses ui/alert-dialog internally
└── ToastContainer.tsx       ← REMOVE (replaced by Sonner)

src/components/shell/
├── SegmentedToggle.tsx      ← REMOVE (replaced by ui/tabs)
├── ThemeToggle.tsx           ← Refactor: uses ui/tabs for toggle
└── ... (rest unchanged)

src/components/ride-report/
├── ConditionBadge.tsx        ← Refactor: uses ui/badge internally
└── ... (rest unchanged)

src/components/my-routes/
├── DeleteConfirmDialog.tsx   ← Refactor: uses ui/alert-dialog internally
├── EditRouteModal.tsx        ← Refactor: uses ui/dialog internally
└── ... (rest unchanged)

src/components/ride-planner/
├── GpxImportModal.tsx        ← Refactor: uses ui/dialog shell, keeps upload logic
└── ... (rest unchanged)
```

#### Replacement Strategy Per Component

**Skeleton primitives** → `ui/skeleton.tsx` + `ui/card.tsx`
- `SkeletonBlock`, `SkeletonCircle`, `SkeletonLine`, `SkeletonButton` → single `<Skeleton>` component with className for sizing
- `SkeletonCard` → `<Card>` wrapper with `<Skeleton>` children
- `ContentPageSkeleton` → update to use new primitives
- Consumers: `RidePlannerSkeleton`, `RideReportSkeleton`, `MyRoutesSkeleton`, `AuthPageSkeleton`, `ProductCategoriesSkeleton`, `ProductCategoryDetailSkeleton`

**SegmentedToggle** → `ui/tabs.tsx`
- Used by `ThemeToggle` (light/dark switch) and potentially other toggle UIs
- shadcn `Tabs` provides `TabsList` + `TabsTrigger` which matches the visual pattern
- The `ThemeToggle` component is refactored to use `<Tabs>` + `<TabsTrigger>`

**StatusBadge / ConditionBadge** → `ui/badge.tsx`
- shadcn `Badge` supports `variant` prop; add custom variants (`success`, `warning`, `caution`, `destructive`, `neutral`) to match the existing color palette
- `ConditionBadge` stays as a domain component but uses `<Badge variant={...}>` internally for the pill rendering

**Form inputs** → `ui/input.tsx`, `ui/textarea.tsx`, `ui/select.tsx`, `ui/switch.tsx`, `ui/label.tsx`
- Phase 2 installs these primitives; their usage in admin forms is deferred
- Public forms (e.g., `EditRouteModal`, `ContactPage` form inputs) adopt them in Phase 3

### Phase 3 — Composite Component Mapping

**Dialogs** → `ui/dialog.tsx` and `ui/alert-dialog.tsx`

_Alert-style dialogs_ (confirm/cancel pattern):
- `DeleteConfirmDialog` → `<AlertDialog>` with `<AlertDialogAction>` (red/destructive) and `<AlertDialogCancel>`
- `UnsavedChangesDialog` → `<AlertDialog>` with save/discard/stay actions mapped to alert dialog buttons

_Content dialogs_ (forms inside a modal):
- `GpxImportModal` → `<Dialog>` shell (`DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`); file upload logic stays as-is inside `DialogContent`
- `EditRouteModal` → `<Dialog>` with form inputs refactored to use `<Input>`, `<Select>`, `<Label>`

Radix dialogs provide: focus trapping, Escape to close, portal rendering, proper aria attributes. This eliminates all custom `useEffect` keyboard handlers and manual backdrop click logic.

**Toast notifications** → `ui/sonner.tsx` (Sonner library)
- Sonner replaces the custom `ToastProvider` / `useToast` context
- `<Toaster />` from Sonner is rendered once in `App.tsx` (replacing `<ToastProvider>` + `<ToastContainer>`)
- All `addToast(message, type)` call sites become `toast.success(message)` / `toast.error(message)` / `toast(message)` from Sonner
- Affected public pages: `ReportPage`, `RoutesPage` (2 files)
- Affected admin pages: 6+ files — these continue using the old `useToast` hook for now (admin deferred). To avoid breaking admin, keep the `ToastProvider` in place during Phase 3 and only remove it when admin migrates. Alternatively, create a thin wrapper that maps `addToast` to Sonner calls for backward compatibility during the transition.

**InfoTooltip** → `ui/tooltip.tsx` + `ui/popover.tsx` (optional)
- Desktop: shadcn `<Tooltip>` (hover-triggered, Radix)
- Mobile: Radix Tooltip is hover-only and won't work on touch. Two options:
  - **Option A:** Use `<Popover>` on mobile (click-triggered), detect via media query or pointer type
  - **Option B:** Keep the existing click handler and wrap the Radix `Tooltip` — open on hover for desktop, toggle on click for mobile
- Recommend **Option B** — minimal disruption, preserves current mobile UX

### Dependencies

**New npm dependencies:**

| Package                        | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `tailwindcss` (v4)             | Upgrade from v3                                           |
| `@tailwindcss/vite`            | Vite plugin for Tailwind v4 (replaces PostCSS plugin)     |
| `tailwind-merge`               | Merge Tailwind classes without conflicts (used in `cn()`) |
| `clsx`                         | Conditional class joining (used in `cn()`)                |
| `class-variance-authority`     | Component variant system (used by shadcn components)      |
| `@radix-ui/react-alert-dialog` | AlertDialog primitive                                     |
| `@radix-ui/react-dialog`       | Dialog primitive                                          |
| `@radix-ui/react-tabs`         | Tabs primitive                                            |
| `@radix-ui/react-tooltip`      | Tooltip primitive                                         |
| `@radix-ui/react-switch`       | Switch primitive                                          |
| `@radix-ui/react-select`       | Select primitive                                          |
| `@radix-ui/react-label`        | Label primitive                                           |
| `@radix-ui/react-slot`         | Slot utility (used by Button `asChild`)                   |
| `sonner`                       | Toast library                                             |

**Removed npm dependencies:**

| Package        | Reason                                    |
| -------------- | ----------------------------------------- |
| `postcss`      | Tailwind v4 uses Vite plugin, not PostCSS |
| `autoprefixer` | Tailwind v4 includes vendor prefixing     |

**Removed files:**

| File                                              | Reason                                    |
| ------------------------------------------------- | ----------------------------------------- |
| `tailwind.config.js`                              | Config moves to CSS                       |
| `postcss.config.js`                               | No longer needed                          |
| `src/components/skeleton/SkeletonPrimitives.tsx`  | Replaced by `ui/skeleton`                 |
| `src/components/skeleton/ContentPageSkeleton.tsx` | Rewritten using `ui/skeleton` + `ui/card` |
| `src/components/skeleton/index.ts`                | Barrel re-export updated                  |
| `src/components/common/ToastContainer.tsx`        | Replaced by Sonner                        |
| `src/components/shell/SegmentedToggle.tsx`        | Replaced by `ui/tabs`                     |

### Tech Decisions

1. **Why shadcn/ui over a full component library (MUI, Chakra, etc.)?** shadcn generates source files into the project — no version lock-in, full control over styling, and zero runtime overhead from a library wrapper. The existing Tailwind styling approach is preserved.

2. **Why Tailwind v4 now?** shadcn's latest tooling defaults to v4. Migrating Tailwind as part of this feature avoids doing two migrations. The project has minimal Tailwind config customization (only font families) and only one `@apply` usage, making this a low-risk upgrade.

3. **Why Sonner over shadcn's built-in toast?** Sonner is the recommended toast solution for shadcn/ui. It's lighter than building a custom toast system and handles stacking, animations, and auto-dismiss out of the box. It also supports the same `success` / `error` / `info` types as the current `useToast` hook.

4. **Why keep admin on old components during this phase?** The admin panel has 7+ pages with interconnected components (`AdminDataTable`, `SlidePanel`, `FormComponents`). Migrating both at once increases risk and scope. The admin components are isolated behind auth and don't share code paths with public components, so they can migrate independently.

5. **Why keep `useToast` wrapper during transition?** Admin pages heavily use `addToast()`. Rather than rewriting 6+ admin pages, a thin compatibility wrapper maps `addToast` to Sonner calls. This is removed when admin migrates.

### Migration Order (Implementation Sequence)

```
Step 1: Tailwind v4 upgrade
        ├── Remove tailwind.config.js, postcss.config.js
        ├── Install @tailwindcss/vite, update vite.config.ts
        ├── Rewrite index.css with @import "tailwindcss" + @theme
        ├── Verify build passes, dark mode works
        │
Step 2: shadcn/ui bootstrap
        ├── Install peer deps (clsx, tailwind-merge, cva)
        ├── Create lib/utils.ts (cn function)
        ├── Create components.json
        ├── Generate Button component (first shadcn component)
        │
Step 3: Primitive components
        ├── Generate: Skeleton, Badge, Card, Label, Input, Textarea, Select, Switch, Tabs
        ├── Replace SkeletonPrimitives → ui/skeleton + ui/card
        ├── Update all skeleton consumers (6 skeleton wrapper components)
        ├── Replace SegmentedToggle → ui/tabs in ThemeToggle
        ├── Add custom Badge variants, update ConditionBadge
        │
Step 4: Composite components
        ├── Generate: AlertDialog, Dialog, Tooltip, Sonner
        ├── Refactor DeleteConfirmDialog → ui/alert-dialog
        ├── Refactor UnsavedChangesDialog → ui/alert-dialog
        ├── Refactor GpxImportModal → ui/dialog
        ├── Refactor EditRouteModal → ui/dialog + ui/input
        ├── Replace ToastContainer → Sonner; create addToast compatibility wrapper
        ├── Refactor InfoTooltip → ui/tooltip with click-for-mobile
        │
Step 5: Cleanup
        ├── Remove dead component files
        ├── Remove unused imports
        ├── Verify E2E tests pass
        └── Verify dark mode, responsive, keyboard nav
```

### Risks & Mitigations

| Risk                                                 | Impact                                     | Mitigation                                                                                      |
| ---------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Tailwind v4 class name changes break existing styles | High — visual regressions across all pages | Run `npx @tailwindcss/upgrade` tool first; manually audit any flagged changes                   |
| Radix portals conflict with Leaflet map z-index      | Medium — dialogs hidden behind map         | Test dialog opening on map pages; adjust Radix portal z-index via className if needed           |
| Sonner toast styling doesn't match existing design   | Low — inconsistent UX                      | Sonner supports full theme customization via `toastOptions` and CSS variables                   |
| Build size increase from Radix packages              | Low — minor bundle growth                  | Radix packages are small and tree-shakeable; monitor with `vite-plugin-visualizer` if concerned |

<!-- Appended by QA skill -->
