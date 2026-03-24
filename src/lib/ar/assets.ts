import type { DeviceCapabilities } from "./capabilities";
import type { MenuDish } from "@/lib/menu/types";

export interface DishAssetSelection {
  previewGlb: string | null;
  quickLookUsdz: string | null;
  quickLookReady: boolean;
  preloadGlbs: string[];
}

export function getAdjacentDishes(dishes: MenuDish[], currentIndex: number): MenuDish[] {
  if (dishes.length <= 1) {
    return dishes;
  }

  const previous = dishes[(currentIndex - 1 + dishes.length) % dishes.length];
  const current = dishes[currentIndex];
  const next = dishes[(currentIndex + 1) % dishes.length];

  return [previous, current, next];
}

export function resolveDishAssets(
  dish: MenuDish,
  dishes: MenuDish[],
  currentIndex: number,
  capabilities: DeviceCapabilities
): DishAssetSelection {
  const neighbors = getAdjacentDishes(dishes, currentIndex);
  const preloadGlbs =
    capabilities.performanceTier === "constrained"
      ? [dish.assets.glb].filter(Boolean) as string[]
      : neighbors
          .map((entry) => entry.assets.glb)
          .filter((value): value is string => Boolean(value));

  return {
    previewGlb: dish.assets.glb ?? null,
    quickLookUsdz: dish.assets.usdz ?? null,
    quickLookReady: dish.assets.usdzReady,
    preloadGlbs
  };
}

export function formatPrice(priceInr: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(priceInr);
}

