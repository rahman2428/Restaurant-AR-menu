import type { RenderEngineDescriptor } from "./types";

export function createViewerEngine(): RenderEngineDescriptor {
  return {
    kind: "viewer",
    badge: "AR Camera Preview",
    headline: "Camera-based AR preview available",
    helperText:
      "Opens a professional camera-backed preview while keeping the premium 3D viewer available for close inspection.",
    actionLabel: "Open AR View",
    canLaunch: false
  };
}
