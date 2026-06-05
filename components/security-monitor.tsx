"use client";

import { useMemo, useCallback } from "react";
import { useSecurityMonitor } from "@/hooks/useSecurityMonitor";
import type { ViolationType, Violation } from "@/hooks/useSecurityMonitor";
import { Info, X } from "lucide-react";

interface SecurityMonitorProps {
  children: React.ReactNode;
  blockOn?: readonly ViolationType[];
  maxViolations?: number;
  onViolation?: (v: Violation) => void;
  disableRightClick?: boolean;
  disableClipboard?: boolean;
  /**
   * Called when the user clicks "Acknowledge & Continue".
   * Pass null to make the block permanent (no dismiss button shown).
   * Omit entirely to use the default unblock behaviour.
   */
  onDismiss?: (() => void) | null;
  /** Rendered inside the blocked overlay when the block is permanent (onDismiss === null). */
  pardonSlot?: React.ReactNode;
  /** Seed isBlocked as true on mount (e.g. server-loaded violations). */
  initialBlocked?: boolean;
}

export function SecurityMonitor({
  children,
  blockOn,
  maxViolations,
  onViolation,
  disableRightClick = true,
  disableClipboard = false,
  onDismiss,
  pardonSlot,
  initialBlocked = false,
}: SecurityMonitorProps) {
  // Memoize blockOn so it never creates a new array reference between renders
  const stableBlockOn = useMemo(
    () => blockOn ?? ["TAB_SWITCH", "KEYBOARD_SHORTCUT"],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(blockOn)],
  ) as ViolationType[];

  // Stable onViolation reference — wrap in useCallback at the call site,
  // but guard here too so an unmemoized prop doesn't cause listener churn
  const stableOnViolation = useCallback(
    (v: Violation) => onViolation?.(v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { violations, isBlocked, activeViolation, unblock, reset } =
    useSecurityMonitor({
      blockOn: stableBlockOn,
      maxViolations,
      onViolation: stableOnViolation,
      disableRightClick,
      disableClipboard,
      initialBlocked,
    });

  // Resolve dismiss handler:
  // - undefined  → use internal unblock (default)
  // - null       → no button (hard block)
  // - function   → caller controls what happens
  const handleDismiss =
    onDismiss === undefined ? unblock : (onDismiss ?? undefined);

  return (
    <div className="relative min-h-full h-full w-full">
      {children}

      {isBlocked && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/75 font-sans">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-3">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto text-3xl">
              <X size={40} className="text-red-600" />
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {activeViolation?.label ?? "Security Violation"}
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              A prohibited action was detected. This incident has been logged.
            </p>

            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {violations.length} violation{violations.length !== 1 ? "s" : ""}{" "}
              recorded
            </p>

            {handleDismiss && (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleDismiss}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Acknowledge &amp; Continue
                </button>
              </div>
            )}

            {!handleDismiss && pardonSlot && (
              <div className="pt-2">{pardonSlot}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
