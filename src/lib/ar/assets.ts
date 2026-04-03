import type { DeviceCapabilities } from "./capabilities";
import { gltfAssetCache } from "./asset-cache";
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

function runWhenBrowserIsIdle(task: () => void) {
  if (typeof window === "undefined") {
    return;
  }

  const idleCallback = (
    window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    }
  ).requestIdleCallback;

  if (idleCallback) {
    idleCallback(task, { timeout: 1800 });
    return;
  }

  window.setTimeout(task, 260);
}

function uniqueAssetUrls(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function warmDishForLaunch(dish: MenuDish, capabilities: DeviceCapabilities) {
  if (dish.assets.glb) {
    gltfAssetCache.preload(dish.assets.glb);
  }

  if (capabilities.supportsQuickLook && dish.assets.usdz) {
    gltfAssetCache.preloadBinary(dish.assets.usdz);
  }
}

export function warmMenuAssetsInBackground(dishes: MenuDish[], capabilities: DeviceCapabilities) {
  const glbUrls = uniqueAssetUrls(dishes.map((dish) => dish.assets.glb));

  if (glbUrls.length === 0) {
    return;
  }

  const immediateCount = capabilities.performanceTier === "constrained" ? 2 : 4;
  const immediateUrls = glbUrls.slice(0, immediateCount);
  const deferredUrls = glbUrls.slice(immediateCount);

  immediateUrls.forEach((url) => {
    gltfAssetCache.preload(url);
  });

  runWhenBrowserIsIdle(() => {
    if (deferredUrls.length > 0) {
      gltfAssetCache.preloadMany(
        deferredUrls,
        capabilities.performanceTier === "high" ? 3 : 2
      );
    }
  });

  if (!capabilities.supportsQuickLook) {
    return;
  }

  const usdzUrls = uniqueAssetUrls(dishes.map((dish) => dish.assets.usdz));

  if (usdzUrls.length === 0) {
    return;
  }

  const immediateUsdz = usdzUrls.slice(0, 2);
  const deferredUsdz = usdzUrls.slice(2);

  immediateUsdz.forEach((url) => {
    gltfAssetCache.preloadBinary(url);
  });

  runWhenBrowserIsIdle(() => {
    if (deferredUsdz.length > 0) {
      gltfAssetCache.preloadBinaryMany(deferredUsdz, 2);
    }
  });
}

export function formatPrice(priceInr: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(priceInr);
}
