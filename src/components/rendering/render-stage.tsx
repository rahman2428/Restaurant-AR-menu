"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type TouchEvent
} from "react";
import type { DeviceCapabilities } from "@/lib/ar/capabilities";
import type { RenderEngineDescriptor } from "@/lib/ar/engines/types";
import { ThreeStageController } from "@/lib/ar/three-stage";
import type { MenuDish } from "@/lib/menu/types";

export interface RenderStageHandle {
  enterImmersiveAr: () => Promise<boolean>;
}

interface RenderStageProps {
  dish: MenuDish;
  preloadDishes: MenuDish[];
  engine: RenderEngineDescriptor;
  capabilities: DeviceCapabilities;
  onPrevious: () => void;
  onNext: () => void;
}

export const RenderStage = forwardRef<RenderStageHandle, RenderStageProps>(function RenderStage(
  { dish, preloadDishes, engine, capabilities, onPrevious, onNext },
  ref
) {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ThreeStageController | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  useEffect(() => {
    if (!stageContainerRef.current) {
      return;
    }

    stageContainerRef.current.querySelectorAll("canvas.stage-canvas").forEach((canvas) => {
      canvas.remove();
    });

    const controller = new ThreeStageController(
      stageContainerRef.current,
      {
        performanceTier: capabilities.performanceTier,
        prefersReducedMotion: capabilities.prefersReducedMotion
      },
      {
        onError: setStageError,
        onSessionStateChange: setSessionActive
      }
    );
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [capabilities.performanceTier, capabilities.prefersReducedMotion]);

  useEffect(() => {
    if (controllerRef.current) {
      void controllerRef.current.setDish(dish);
    }
  }, [dish]);

  useEffect(() => {
    preloadDishes.forEach((entry) => controllerRef.current?.preloadDish(entry));
  }, [preloadDishes]);

  useImperativeHandle(
    ref,
    () => ({
      enterImmersiveAr: async () => {
        return (await controllerRef.current?.enterImmersiveAr()) ?? false;
      }
    }),
    []
  );

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStartRef.current;

    if (!start) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) > 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        onNext();
      } else {
        onPrevious();
      }
    }

    swipeStartRef.current = null;
  }

  const helperCopy = sessionActive
    ? "Move your device to detect a surface, then tap to place the dish."
    : capabilities.hasTouch
      ? "Swipe to browse, drag to rotate, and use Open AR View for the live camera experience."
      : "Drag to orbit, scroll to zoom, and use Open AR View to launch the live AR experience.";

  return (
    <div
      aria-label={`${dish.name} interactive preview`}
      className="glass-panel stage-shell"
      role="region"
    >
      <div ref={stageContainerRef} className="stage-shell__canvas-wrap" />

      <div className="stage-overlay">
        <div className="stage-status">
          <span className="capability-pill capability-pill--warm">{engine.badge}</span>
          <p>{helperCopy}</p>
        </div>

        <button
          aria-label="Previous dish"
          className="stage-nav stage-nav--left"
          onClick={onPrevious}
          type="button"
        >
          <span aria-hidden="true">{"<"}</span>
        </button>

        <button
          aria-label="Next dish"
          className="stage-nav stage-nav--right"
          onClick={onNext}
          type="button"
        >
          <span aria-hidden="true">{">"}</span>
        </button>

        <div
          className="swipe-rail"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="presentation"
        >
          Swipe here to browse the menu
        </div>

        {stageError ? <div className="stage-toast">{stageError}</div> : null}
      </div>
    </div>
  );
});
