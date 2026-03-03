# Plan: Illustrated Mini-Icon System for Clothing Items

## Problem
The current clothing icons (22 types) are hard to distinguish — vest/jacket/jersey all look like similar torso silhouettes, the three glove types are nearly identical, and there's no visual hierarchy telling you which body zone an item belongs to.

## Approach
**Illustrated flat-fill icons with zone-colored containers.** Each body zone gets its own background color (replacing the uniform emerald), and the icon itself is white — creating an instant at-a-glance "what zone + which item" signal.

### Zone Color Palette
| Zone       | Light bg                  | Dark bg                    | Light icon             | Dark icon              |
|------------|---------------------------|----------------------------|------------------------|------------------------|
| Head       | `bg-sky-50`               | `bg-sky-950/30`            | `text-sky-600`         | `text-sky-400`         |
| Upper body | `bg-emerald-50`           | `bg-emerald-950/30`        | `text-emerald-600`     | `text-emerald-400`     |
| Lower body | `bg-amber-50`             | `bg-amber-950/30`          | `text-amber-600`       | `text-amber-400`       |
| Hands      | `bg-violet-50`            | `bg-violet-950/30`         | `text-violet-600`      | `text-violet-400`      |
| Feet       | `bg-rose-50`              | `bg-rose-950/30`           | `text-rose-600`        | `text-rose-400`        |
| Neck/Face  | `bg-sky-50`               | `bg-sky-950/30`            | `text-sky-600`         | `text-sky-400`         |

### Icon Redesign — Key Differentiators per Icon
Each icon must be a **filled** silhouette shape (not just strokes) with a distinguishing detail so items in the same zone are clearly different.

**Head zone (sky):**
- `headband` — wide band shape wrapping around (no brim, open top)
- `helmet-cover` — dome with ventilation slits on top
- `sunglasses` — wraparound single-lens sport shape
- `glasses` — two distinct round lenses + bridge

**Upper body (emerald):**
- `base-layer` — tight-fit shirt, thin outline, thermal wave pattern
- `jersey` — short-sleeve cycling shirt with front zip line + back pockets
- `jersey-long` — same as jersey but sleeves extend to wrist
- `vest` — sleeveless body, armholes visible
- `jacket` — full jacket with collar, sleeves, front zip
- `rain-jacket` — jacket silhouette + water droplets in corner
- `arm-warmers` — two tube shapes (isolated arms, no body)

**Lower body (amber):**
- `pants-short` — clearly above-knee length, elastic waistband line
- `pants-long` — full-length tight, ankle cuffs
- `leg-warmers` — two tube shapes (isolated legs, no waist)
- `overpants` — pants silhouette + water droplets

**Hands (violet):**
- `gloves-light` — fingerless/half-finger glove, open fingertips visible
- `gloves-warm` — full-finger glove, insulation lines on back
- `gloves-waterproof` — full-finger glove + water droplets

**Feet (rose):**
- `shoes` — cycling shoe side profile with cleat bump on sole
- `shoe-covers` — shoe silhouette with cover overlay line + zip
- `socks` — ankle-height sock shape (no shoe)

**Neck/face (sky):**
- `neck-gaiter` — tube scarf around neck/chin
- `face-mask` — half-face coverage with nose bridge + ear loops

## Implementation Todos

### 1. `redesign-icons` — Rewrite CyclingGearIcons.tsx
Replace all 22 clothing icons with flat filled-shape illustrations. Each icon:
- Uses `fill="currentColor"` for the main shape (not just stroke)
- Has a unique distinguishing detail (e.g. rain droplets, open fingertips, ventilation slots)
- Works at both 14px (alt badges) and 32px (main card)
- Remove the 3D headband/sunglasses experiments (replace with flat filled versions for consistency)

### 2. `zone-colors` — Add zone-to-color mapping + update ClothingItemCard
- Create a `getZoneColors(icon: ClothingIcon)` utility that maps icon → zone → color classes
- Update `ClothingItemCard.tsx` container from hardcoded emerald to dynamic zone colors
- Update alternative badge styling to use zone accent colors too

### 3. `product-category-icons` — Upgrade the 7 product category icons
Same flat-fill treatment for the product category grid icons (jacket, gloves, pants, headwear, shoes, light, accessories). Keep emerald since these aren't zone-specific.

### 4. `verify-build` — Build verification + visual check
- Run `tsc --noEmit` and `npm run build`
- Ensure no unused imports remain (Lucide was already removed from ClothingItemCard)

## Notes
- Equipment icons (safety, hydration, tools, nutrition, gear) stay as Lucide — they're category-level, not item-specific, and already clear enough.
- The zone coloring makes the ride report scannable: "I see sky=head, emerald=torso, amber=legs" without reading text.
- Alternative badges in the card keep the same zone color but lighter/muted.
