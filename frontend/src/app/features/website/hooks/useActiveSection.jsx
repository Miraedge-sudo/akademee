import { useState, useEffect } from "react";

/**
 * Tracks which section is currently in the viewport.
 * Returns the active section ID so nav links can be highlighted.
 *
 * @param {string[]} sectionIds - Array of section element IDs to observe
 * @param {number} offset - Offset from top in px (default 100 for header height)
 */
export function useActiveSection(sectionIds = [], offset = 100) {
  const [activeId, setActiveId] = useState(sectionIds[0] || "");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first section that is currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${offset}px 0px -40% 0px`,
        threshold: 0,
      }
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds.join(","), offset]);

  return activeId;
}


