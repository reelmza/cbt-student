import { useEffect, useState, useCallback, useRef } from "react";

export const VIOLATION_TYPES = {
  TAB_SWITCH: { label: "Tab Switch", severity: "high" },
  WINDOW_BLUR: { label: "Window Focus Lost", severity: "medium" },
  RIGHT_CLICK: { label: "Right Click", severity: "low" },
  KEYBOARD_SHORTCUT: { label: "Suspicious Shortcut", severity: "high" },
  COPY: { label: "Copy Attempt", severity: "low" },
  CUT: { label: "Cut Attempt", severity: "low" },
  PASTE: { label: "Paste Attempt", severity: "medium" },
  FULLSCREEN_EXIT: { label: "Fullscreen Exited", severity: "medium" },
} as const;

export type ViolationType = keyof typeof VIOLATION_TYPES;

export interface Violation {
  id: number;
  type: ViolationType;
  label: string;
  severity: "high" | "medium" | "low";
  timestamp: Date;
  detail?: string;
}

interface Options {
  blockOn?: readonly ViolationType[];
  maxViolations?: number;
  onViolation?: (v: Violation) => void;
  disableRightClick?: boolean;
  disableClipboard?: boolean;
}

export function useSecurityMonitor({
  blockOn = ["TAB_SWITCH", "KEYBOARD_SHORTCUT", "FULLSCREEN_EXIT"],
  maxViolations,
  onViolation,
  disableRightClick = true,
  disableClipboard = false,
}: Options = {}) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeViolation, setActiveViolation] = useState<Violation | null>(
    null
  );

  // Keep latest opts in a ref so report() never needs them as deps
  const optsRef = useRef({
    blockOn,
    maxViolations,
    onViolation,
    disableRightClick,
    disableClipboard,
  });
  useEffect(() => {
    optsRef.current = {
      blockOn,
      maxViolations,
      onViolation,
      disableRightClick,
      disableClipboard,
    };
  });

  // Stable report — empty deps means this never changes reference,
  // so all listeners below are registered exactly once regardless of Strict Mode
  const report = useCallback((type: ViolationType, detail?: string) => {
    const { blockOn, maxViolations, onViolation } = optsRef.current;

    const violation: Violation = {
      id: Date.now(),
      type,
      detail,
      timestamp: new Date(),
      ...VIOLATION_TYPES[type],
    };

    setViolations((prev) => {
      const next = [...prev, violation];
      if (maxViolations && next.length >= maxViolations) {
        setIsBlocked(true);
        setActiveViolation(violation);
      }
      return next;
    });

    if ((blockOn as string[]).includes(type)) {
      setIsBlocked(true);
      setActiveViolation(violation);
    }

    onViolation?.(violation);
  }, []); // intentionally empty — optsRef handles freshness

  // Tab switch / window blur — blur is a superset of visibilitychange
  useEffect(() => {
    const handler = () => report("TAB_SWITCH");
    window.addEventListener("blur", handler);
    return () => window.removeEventListener("blur", handler);
  }, [report]);

  // Right click
  useEffect(() => {
    if (!optsRef.current.disableRightClick) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      report("RIGHT_CLICK");
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [report]);

  // Keyboard shortcuts
  useEffect(() => {
    const BLOCKED_COMBOS = [
      { key: "F12" },
      { ctrl: true, shift: true, key: "I" },
      { ctrl: true, shift: true, key: "J" },
      { ctrl: true, shift: true, key: "C" },
      { ctrl: true, key: "U" },
      { ctrl: true, key: "W" },
    ];

    const handler = (e: KeyboardEvent) => {
      const hit = BLOCKED_COMBOS.some(
        (c) =>
          (!c.ctrl || e.ctrlKey) && (!c.shift || e.shiftKey) && e.key === c.key
      );
      if (hit) {
        e.preventDefault();
        report("KEYBOARD_SHORTCUT", e.key);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [report]);

  // Clipboard
  useEffect(() => {
    if (!optsRef.current.disableClipboard) return;
    const onCopy = () => report("COPY");
    const onCut = () => report("CUT");
    const onPaste = () => report("PASTE");
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [report]);

  // Fullscreen exit
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) report("FULLSCREEN_EXIT");
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [report]);

  const unblock = useCallback(() => {
    setIsBlocked(false);
    setActiveViolation(null);
  }, []);

  const reset = useCallback(() => {
    setViolations([]);
    setIsBlocked(false);
    setActiveViolation(null);
  }, []);

  return { violations, isBlocked, activeViolation, unblock, reset };
}
