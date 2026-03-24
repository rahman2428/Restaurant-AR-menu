import type { RenderEngineDescriptor } from "./types";

export function createWebXrEngine(): RenderEngineDescriptor {
  return {
    kind: "webxr",
    badge: "WebXR AR",
    headline: "True world-scale AR available",
    helperText:
      "Uses immersive AR with hit testing, optional anchors, real-world scale placement, and a zero-friction transition from the preview stage.",
    actionLabel: "Open AR View",
    canLaunch: true
  };
}
