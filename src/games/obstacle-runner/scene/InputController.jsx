import { useEffect, useRef } from "react";
import { RUNNER_CONFIG } from "./runnerConfig";

export default function InputController({ runnerStateRef }) {
  const touchStartRef = useRef(null);

  useEffect(() => {
    const moveLane = (direction) => {
      const state = runnerStateRef.current;
      state.targetLane = Math.max(0, Math.min(RUNNER_CONFIG.lanes.length - 1, state.targetLane + direction));
    };

    const onKeyDown = (event) => {
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable) return;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        moveLane(-1);
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        moveLane(1);
      }
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w" || event.key === " ") {
        event.preventDefault();
        runnerStateRef.current.requestedAction = "Jump";
      }
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        runnerStateRef.current.requestedAction = "Slide";
      }
      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        runnerStateRef.current.requestedAction = "Stumble";
      }
    };

    const onTouchStart = (event) => {
      const touch = event.changedTouches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event) => {
      const start = touchStartRef.current;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      touchStartRef.current = null;
      if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        moveLane(dx > 0 ? 1 : -1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [runnerStateRef]);

  return null;
}
