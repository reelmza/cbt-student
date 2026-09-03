"use client";

import {
  Atom,
  Calculator as CalculatorIcon,
  Check,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Calculator from "./calculator";
import PeriodicTable from "./periodic-table";

// Add a tool by listing it here and rendering its panel below. Only one tool
// is open at a time, so the panels never fight over screen space.
const TOOLS = [
  { id: "calculator", name: "Scientific Calculator", icon: CalculatorIcon },
  { id: "periodic-table", name: "Periodic Table", icon: Atom },
];

const ExamTools = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dismiss the menu on any click landing outside it
  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenu(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [openMenu]);

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpenMenu((prev) => !prev)}
          aria-label="Exam tools"
          aria-expanded={openMenu}
          title="Exam tools"
          className={`flex h-12 lg:h-10 items-center justify-center gap-1 rounded-lg border px-2 transition cursor-pointer ${
            activeTool || openMenu
              ? "border-accent bg-accent-light text-accent-dim"
              : "border-theme-gray-mid bg-white text-theme-gray hover:bg-theme-gray-light"
          }`}
        >
          <span className="px-1 text-sm font-medium">Calculator</span>
          <ChevronDown
            size={14}
            className={`transition ${openMenu ? "rotate-180" : ""}`}
          />
        </button>

        {openMenu && (
          <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-accent/15 bg-white py-1 shadow-xl">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool((prev) => (prev === tool.id ? null : tool.id));
                  setOpenMenu(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm cursor-pointer transition hover:bg-accent-light ${
                  activeTool === tool.id
                    ? "text-accent-dim font-semibold"
                    : "text-black/80"
                }`}
              >
                <tool.icon size={18} className="shrink-0" />
                <span className="grow">{tool.name}</span>
                {activeTool === tool.id && (
                  <Check size={14} className="shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTool === "calculator" && (
        <Calculator onClose={() => setActiveTool(null)} />
      )}

      {activeTool === "periodic-table" && (
        <PeriodicTable onClose={() => setActiveTool(null)} />
      )}
    </>
  );
};

export default ExamTools;
