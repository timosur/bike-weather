import type { ClothingIcon, ClothingItem } from "./types";
import type { ClothingZoneId } from "../product-recommendations/types";

/** Maps every ClothingIcon to a body zone */
const iconToZone: Record<ClothingIcon, ClothingZoneId> = {
  headband: "head",
  "helmet-cover": "head",
  sunglasses: "head",
  glasses: "head",
  "base-layer": "upperBody",
  jersey: "upperBody",
  "jersey-long": "upperBody",
  vest: "upperBody",
  jacket: "upperBody",
  "rain-jacket": "upperBody",
  "arm-warmers": "upperBody",
  "pants-short": "lowerBody",
  "pants-long": "lowerBody",
  "leg-warmers": "lowerBody",
  overpants: "lowerBody",
  "gloves-light": "hands",
  "gloves-warm": "hands",
  "gloves-waterproof": "hands",
  shoes: "feet",
  "shoe-covers": "feet",
  socks: "feet",
};

/** Get the body zone for a clothing icon */
export function getZoneForIcon(icon: ClothingIcon): ClothingZoneId {
  return iconToZone[icon] ?? "upperBody";
}

/** Group clothing items by body zone, preserving order within each zone */
export function groupItemsByZone(items: ClothingItem[]): Record<ClothingZoneId, ClothingItem[]> {
  const groups: Record<ClothingZoneId, ClothingItem[]> = {
    head: [],
    upperBody: [],
    lowerBody: [],
    hands: [],
    feet: [],
  };

  for (const item of items) {
    const zone = getZoneForIcon(item.icon);
    groups[zone].push(item);
  }

  return groups;
}

/** Ordered list of zones from top to bottom (for rendering) */
export const ZONE_ORDER: ClothingZoneId[] = ["head", "upperBody", "hands", "lowerBody", "feet"];
