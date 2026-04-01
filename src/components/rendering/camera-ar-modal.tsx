"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent as ReactTouchEvent
} from "react";
import type { DeviceCapabilities } from "@/lib/ar/capabilities";
import { ThreeStageController } from "@/lib/ar/three-stage";
import type { MenuDish } from "@/lib/menu/types";

interface CameraArModalProps {
  open: boolean;
  dish: MenuDish;
  capabilities: DeviceCapabilities;
  onClose: () => void;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function CameraArModal({
  open,
  dish,
  capabilities,
  onClose
}: CameraArModalProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<ThreeStageController | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !stageRef.current) {
      return;
    }

    stageRef.current.querySelectorAll("canvas.stage-canvas").forEach((canvas) => {
      canvas.remove();
    });

    const controller = new ThreeStageController(
      stageRef.current,
      {
        performanceTier: capabilities.performanceTier,
        prefersReducedMotion: capabilities.prefersReducedMotion,
        presentationMode: "camera"
      },
      {
        onError: setError
      }
    );
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, [open, capabilities.performanceTier, capabilities.prefersReducedMotion]);

  useEffect(() => {
    if (!open || !controllerRef.current) {
      return;
    }

    void controllerRef.current.setDish(dish);
  }, [open, dish]);

  useEffect(() => {
    const videoNode = videoRef.current;

    if (!open) {
      stopStream(streamRef.current);
      streamRef.current = null;

      if (videoNode) {
        videoNode.srcObject = null;
      }

      return;
    }

    let cancelled = false;

    async function startCamera() {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not available in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoNode) {
          videoNode.srcObject = stream;
          await videoNode.play().catch(() => undefined);
        }
      } catch {
        setError("Camera permission is required to open the AR view.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;

      if (videoNode) {
        videoNode.srcObject = null;
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function stopDismiss(event: MouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      aria-modal="true"
      className="camera-ar-modal"
      onClick={onClose}
      role="dialog"
    >
      <video
        ref={videoRef}
        autoPlay
        className="camera-ar-modal__video"
        muted
        playsInline
      />

      <div
        className="camera-ar-modal__stage"
        onClick={stopDismiss}
        onTouchStart={stopDismiss}
        ref={stageRef}
      />

      <div className="camera-ar-modal__chrome" onClick={stopDismiss} onTouchStart={stopDismiss}>
        <div className="camera-ar-modal__topbar glass-panel">
          <div>
            <span className="eyebrow">Live AR View</span>
            <strong>{dish.name}</strong>
          </div>
          <button className="camera-ar-modal__close ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="camera-ar-modal__hint glass-panel">
          <span>Point at your table, then drag to rotate and pinch to scale the dish.</span>
        </div>

        {error ? <div className="camera-ar-modal__error glass-panel">{error}</div> : null}
      </div>
    </div>
  );
}
