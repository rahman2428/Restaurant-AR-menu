"use client";

import { useEffect, useState } from "react";
import {
  defaultCapabilities,
  detectDeviceCapabilities,
  type DeviceCapabilities
} from "@/lib/ar/capabilities";

export function useArCapabilities() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(defaultCapabilities);

  useEffect(() => {
    let cancelled = false;

    void detectDeviceCapabilities().then((result) => {
      if (!cancelled) {
        setCapabilities(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return capabilities;
}
