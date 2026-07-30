"use client";

import { useEffect, useRef, useState } from "react";

const MARGIN = 16;

// Shared drag behaviour for the floating exam tool panels. A panel opens
// pinned to the top right and stays clamped inside the viewport while dragged.
const useDraggablePanel = (width: number) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Measure the rendered panel where possible, since a panel may be capped
    // to the viewport and end up narrower than its requested width.
    const panelWidth = panelRef.current?.offsetWidth ?? width;
    setPosition({
      x: Math.max(MARGIN, window.innerWidth - panelWidth - MARGIN),
      y: 96,
    });
  }, [width]);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragOffset.current || !panelRef.current) return;
      const maxX = window.innerWidth - panelRef.current.offsetWidth - MARGIN;
      const maxY = window.innerHeight - panelRef.current.offsetHeight - MARGIN;
      const nextX = e.clientX - dragOffset.current.x;
      const nextY = e.clientY - dragOffset.current.y;
      setPosition({
        x: Math.min(Math.max(MARGIN, nextX), Math.max(MARGIN, maxX)),
        y: Math.min(Math.max(MARGIN, nextY), Math.max(MARGIN, maxY)),
      });
    };

    const handleUp = () => {
      dragOffset.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  const startDrag = (e: React.PointerEvent) => {
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  return { panelRef, position, startDrag };
};

export default useDraggablePanel;
