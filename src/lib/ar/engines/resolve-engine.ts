import type { DeviceCapabilities } from "../capabilities";
import type { MenuDish } from "@/lib/menu/types";
import { createQuickLookEngine } from "./quick-look-engine";
import { createViewerEngine } from "./viewer-engine";
import { createWebXrEngine } from "./webxr-engine";
import type { RenderEngineDescriptor } from "./types";

export function resolveRenderEngine(
  capabilities: DeviceCapabilities,
  dish: MenuDish
): RenderEngineDescriptor {
  if (capabilities.supportsWebXR) {
    return createWebXrEngine();
  }

  if (capabilities.supportsQuickLook) {
    return createQuickLookEngine({
      hasUsdzAsset: Boolean(dish.assets.usdz && dish.assets.usdzReady)
    });
  }

  return createViewerEngine();
}

