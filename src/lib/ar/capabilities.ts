export type PlatformKind = "android" | "ios" | "desktop" | "unknown";

export type PerformanceTier = "constrained" | "balanced" | "high";

export interface DeviceCapabilities {
  ready: boolean;
  platform: PlatformKind;
  isMobile: boolean;
  hasTouch: boolean;
  supportsWebXR: boolean;
  supportsQuickLook: boolean;
  prefersReducedMotion: boolean;
  performanceTier: PerformanceTier;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
}

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

export const defaultCapabilities: DeviceCapabilities = {
  ready: false,
  platform: "unknown",
  isMobile: false,
  hasTouch: false,
  supportsWebXR: false,
  supportsQuickLook: false,
  prefersReducedMotion: false,
  performanceTier: "balanced",
  deviceMemoryGb: null,
  hardwareConcurrency: null
};

function detectPlatform(userAgent: string, maxTouchPoints: number): PlatformKind {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("android")) {
    return "android";
  }

  if (
    normalized.includes("iphone") ||
    normalized.includes("ipad") ||
    normalized.includes("ipod") ||
    (normalized.includes("macintosh") && maxTouchPoints > 1)
  ) {
    return "ios";
  }

  if (normalized.length > 0) {
    return "desktop";
  }

  return "unknown";
}

function detectPerformanceTier(
  deviceMemoryGb: number | null,
  hardwareConcurrency: number | null
): PerformanceTier {
  if (
    (deviceMemoryGb !== null && deviceMemoryGb <= 4) ||
    (hardwareConcurrency !== null && hardwareConcurrency <= 4)
  ) {
    return "constrained";
  }

  if (
    (deviceMemoryGb !== null && deviceMemoryGb <= 8) ||
    (hardwareConcurrency !== null && hardwareConcurrency <= 8)
  ) {
    return "balanced";
  }

  return "high";
}

export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (typeof window === "undefined") {
    return defaultCapabilities;
  }

  const userAgent = navigator.userAgent;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const platform = detectPlatform(userAgent, maxTouchPoints);
  const isMobile = platform === "android" || platform === "ios";
  const hasTouch = maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const deviceMemoryGb = (navigator as NavigatorWithDeviceMemory).deviceMemory ?? null;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? null;
  const performanceTier = detectPerformanceTier(deviceMemoryGb, hardwareConcurrency);

  let supportsWebXR = false;

  if (navigator.xr?.isSessionSupported) {
    try {
      supportsWebXR = await navigator.xr.isSessionSupported("immersive-ar");
    } catch {
      supportsWebXR = false;
    }
  }

  const supportsQuickLook = platform === "ios";

  return {
    ready: true,
    platform,
    isMobile,
    hasTouch,
    supportsWebXR,
    supportsQuickLook,
    prefersReducedMotion,
    performanceTier,
    deviceMemoryGb,
    hardwareConcurrency
  };
}

