"use client";

import { Delete, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CalculatorProps = {
  onClose: () => void;
};

const PANEL_WIDTH = 280;
const MARGIN = 16;

const Calculator = ({ onClose }: CalculatorProps) => {
  // Calculator engine state
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  // Start at far right of the page
  useEffect(() => {
    setPosition({
      x: Math.max(MARGIN, window.innerWidth - PANEL_WIDTH - MARGIN),
      y: 96,
    });
  }, []);

  // Keep panel inside the viewport while dragging
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragOffset.current || !panelRef.current) return;
      const height = panelRef.current.offsetHeight;
      const maxX = window.innerWidth - PANEL_WIDTH - MARGIN;
      const maxY = window.innerHeight - height - MARGIN;
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

  // Calculator engine
  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  };

  const toggleSign = () => {
    setDisplay(
      display.startsWith("-")
        ? display.slice(1)
        : display === "0"
          ? "0"
          : `-${display}`,
    );
  };

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const compute = (a: number, b: number, op: string) => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previous === null) {
      setPrevious(inputValue);
    } else if (operator && !waitingForOperand) {
      const result = compute(previous, inputValue, operator);
      setDisplay(Number.isFinite(result) ? String(result) : "Error");
      setPrevious(Number.isFinite(result) ? result : null);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    if (operator === null || previous === null) return;
    const inputValue = parseFloat(display);
    const result = compute(previous, inputValue, operator);
    setDisplay(Number.isFinite(result) ? String(result) : "Error");
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const keyClass =
    "h-12 rounded-lg text-base font-semibold flex items-center justify-center cursor-pointer select-none transition active:scale-[0.96] focus-visible:outline-none";
  const numKey = `${keyClass} bg-theme-gray-light text-black/80 hover:bg-theme-gray-light/70`;
  const opKey = `${keyClass} bg-accent-light text-accent-dim hover:bg-accent-light/70`;

  return (
    <div
      ref={panelRef}
      style={{
        left: position.x,
        top: position.y,
        width: PANEL_WIDTH,
      }}
      className="fixed z-50 rounded-xl border border-accent/15 bg-white shadow-2xl font-sans"
    >
      {/* Drag handle / header */}
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between px-4 py-2.5 border-b cursor-move touch-none select-none"
      >
        <span className="text-sm font-semibold text-accent-dim">
          Calculator
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="p-1 rounded-md text-theme-gray hover:bg-theme-gray-light hover:text-black/80 cursor-pointer transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Display */}
      <div className="px-4 pt-4 pb-2">
        <div className="h-14 flex items-end justify-end rounded-lg bg-theme-gray-light/60 px-3 py-2 text-3xl font-semibold tabular-nums text-black/80 overflow-x-auto">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2 p-4 pt-2">
        <button type="button" className={opKey} onClick={clearAll}>
          C
        </button>
        <button type="button" className={opKey} onClick={toggleSign}>
          +/-
        </button>
        <button type="button" className={opKey} onClick={percent}>
          %
        </button>
        <button
          type="button"
          className={opKey}
          onClick={() => performOperation("÷")}
        >
          ÷
        </button>

        {["7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            className={numKey}
            onClick={() => inputDigit(d)}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className={opKey}
          onClick={() => performOperation("×")}
        >
          ×
        </button>

        {["4", "5", "6"].map((d) => (
          <button
            key={d}
            type="button"
            className={numKey}
            onClick={() => inputDigit(d)}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className={opKey}
          onClick={() => performOperation("-")}
        >
          −
        </button>

        {["1", "2", "3"].map((d) => (
          <button
            key={d}
            type="button"
            className={numKey}
            onClick={() => inputDigit(d)}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          className={opKey}
          onClick={() => performOperation("+")}
        >
          +
        </button>

        <button
          type="button"
          className={numKey}
          onClick={() => inputDigit("0")}
        >
          0
        </button>
        <button type="button" className={numKey} onClick={inputDecimal}>
          .
        </button>
        <button
          type="button"
          className={`${numKey} flex`}
          onClick={backspace}
          aria-label="Backspace"
        >
          <Delete size={20} />
        </button>
        <button
          type="button"
          className={`${keyClass} bg-accent text-white hover:bg-accent-dim`}
          onClick={handleEquals}
        >
          =
        </button>
      </div>
    </div>
  );
};

export default Calculator;
