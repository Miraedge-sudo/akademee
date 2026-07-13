import { useState, useEffect, useCallback } from "react";

/**
 * Creates a subtle cursor-following glow orb that follows the mouse.
 * Best used on dark backgrounds (Bold template).
 *
 * @param {string} color - The glow color (CSS hex/rgba)
 * @param {number} size - Diameter of the glow in px
 * @param {number} opacity - Max opacity of the glow (0–1)
 */
export function useCursorGlow(color = "#085041", size = 400, opacity = 0.03) {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [visible, setVisible] = useState(false);

  const handleMouse = useCallback((e) => {
    setPos({ x: e.clientX, y: e.clientY });
    if (!visible) setVisible(true);
  }, [visible]);

  const handleLeave = useCallback(() => {
    setPos({ x: -999, y: -999 });
    setVisible(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("mouseleave", handleLeave);
    };
  }, [handleMouse, handleLeave]);

  const CursorGlow = () => (
    <div
      className="fixed pointer-events-none z-[1] rounded-full transition-opacity duration-500"
      style={{
        width: size,
        height: size,
        left: pos.x - size / 2,
        top: pos.y - size / 2,
        background: `radial-gradient(circle, ${color} 0%, ${color}00 70%)`,
        opacity: visible ? opacity : 0,
        transform: "translate(0, 0)",
      }}
    />
  );

  return { CursorGlow, cursorPos: pos };
}

/**
 * Lightweight spotlight effect on cards — shines a highlight following the cursor
 * within a specific container element.
 *
 * @param {React.RefObject} ref - ref to the container element
 * @param {string} color - highlight color
 */
export function useCardSpotlight(ref, color = "#085041") {
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, active: false });

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setSpotlight({ x, y, active: true });
    };

    const onLeave = () => setSpotlight((p) => ({ ...p, active: false }));

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref]);

  const spotlightStyle = spotlight.active
    ? {
        background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, ${color}12 0%, transparent 60%)`,
      }
    : {};

  return { spotlightStyle, isActive: spotlight.active };
}
