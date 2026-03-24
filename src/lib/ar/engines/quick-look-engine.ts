import type { RenderEngineDescriptor } from "./types";

export function createQuickLookEngine(options: {
  hasUsdzAsset: boolean;
}): RenderEngineDescriptor {
  return {
    kind: "quick-look",
    badge: options.hasUsdzAsset ? "Apple Quick Look" : "AR Camera Preview",
    headline: options.hasUsdzAsset
      ? "Native iPhone AR available"
      : "Camera-based AR preview available",
    helperText: options.hasUsdzAsset
      ? "Hands off to Quick Look for native iOS AR performance while the same premium menu shell stays consistent."
      : "Quick Look assets can still be added later, but the experience can already open in the live camera preview.",
    actionLabel: options.hasUsdzAsset ? "Open AR View" : "Open AR View",
    canLaunch: options.hasUsdzAsset
  };
}
