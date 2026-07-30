"use client";

import { Delete, X } from "lucide-react";
// The number-only build: same parser and functions, without the bignumber /
// matrix machinery a calculator never touches.
import { evaluate, format } from "mathjs/number";
import { useState } from "react";
import useDraggablePanel from "@/lib/use-draggable-panel";

type CalculatorProps = {
  onClose: () => void;
};

const PANEL_WIDTH = 330;
const PRECISION = 12;

const toRad = (x: number) => (x * Math.PI) / 180;
const toDeg = (x: number) => (x * 180) / Math.PI;

// Passed as evaluate() scope in degree mode, where it shadows mathjs' own
// radian trig. Radian mode passes an empty scope and gets the built-ins.
const DEGREE_SCOPE = {
  sin: (x: number) => Math.sin(toRad(x)),
  cos: (x: number) => Math.cos(toRad(x)),
  tan: (x: number) => Math.tan(toRad(x)),
  asin: (x: number) => toDeg(Math.asin(x)),
  acos: (x: number) => toDeg(Math.acos(x)),
  atan: (x: number) => toDeg(Math.atan(x)),
};

// Longest first, so backspace removes "log10(" rather than just its "(".
const TOKENS = [
  "log10(",
  "asin(",
  "acos(",
  "atan(",
  "sqrt(",
  "cbrt(",
  "log(",
  "exp(",
  "sin(",
  "cos(",
  "tan(",
  " mod ",
  "10^(",
  "*10^",
  "pi",
];

type Key = {
  label: string;
  insert?: string;
  invLabel?: string;
  invInsert?: string;
  action?: "equals" | "clear" | "delete" | "ans";
  kind?: "num" | "op" | "fn" | "eq";
  // Operators continue from the last answer instead of starting a new entry
  operator?: boolean;
};

const KEYS: Key[][] = [
  [
    {
      label: "sin",
      insert: "sin(",
      invLabel: "sin⁻¹",
      invInsert: "asin(",
      kind: "fn",
    },
    {
      label: "cos",
      insert: "cos(",
      invLabel: "cos⁻¹",
      invInsert: "acos(",
      kind: "fn",
    },
    {
      label: "tan",
      insert: "tan(",
      invLabel: "tan⁻¹",
      invInsert: "atan(",
      kind: "fn",
    },
    { label: "(", insert: "(", kind: "fn" },
    { label: ")", insert: ")", kind: "fn" },
  ],
  [
    {
      label: "ln",
      insert: "log(",
      invLabel: "eˣ",
      invInsert: "exp(",
      kind: "fn",
    },
    {
      label: "log",
      insert: "log10(",
      invLabel: "10ˣ",
      invInsert: "10^(",
      kind: "fn",
    },
    {
      label: "√",
      insert: "sqrt(",
      invLabel: "∛",
      invInsert: "cbrt(",
      kind: "fn",
    },
    { label: "xʸ", insert: "^", kind: "fn", operator: true },
    {
      label: "x²",
      insert: "^2",
      invLabel: "x³",
      invInsert: "^3",
      kind: "fn",
      operator: true,
    },
  ],
  [
    { label: "π", insert: "pi", kind: "fn" },
    { label: "e", insert: "e", kind: "fn" },
    { label: "n!", insert: "!", kind: "fn", operator: true },
    { label: "1/x", insert: "1/(", kind: "fn" },
    { label: "mod", insert: " mod ", kind: "fn", operator: true },
  ],
  [
    { label: "7", insert: "7", kind: "num" },
    { label: "8", insert: "8", kind: "num" },
    { label: "9", insert: "9", kind: "num" },
    { label: "÷", insert: "/", kind: "op", operator: true },
    { label: "AC", action: "clear", kind: "op" },
  ],
  [
    { label: "4", insert: "4", kind: "num" },
    { label: "5", insert: "5", kind: "num" },
    { label: "6", insert: "6", kind: "num" },
    { label: "×", insert: "*", kind: "op", operator: true },
    { label: "DEL", action: "delete", kind: "op" },
  ],
  [
    { label: "1", insert: "1", kind: "num" },
    { label: "2", insert: "2", kind: "num" },
    { label: "3", insert: "3", kind: "num" },
    { label: "−", insert: "-", kind: "op", operator: true },
    { label: "Ans", action: "ans", kind: "op" },
  ],
  [
    { label: "0", insert: "0", kind: "num" },
    { label: ".", insert: ".", kind: "num" },
    { label: "×10ˣ", insert: "*10^", kind: "num" },
    { label: "+", insert: "+", kind: "op", operator: true },
    { label: "=", action: "equals", kind: "eq" },
  ],
];

// mathjs syntax in, readable maths out. mathjs' log() is the natural log, so
// it renders as ln( and log10( takes over the log( name. The two never
// collide, since "log10(" contains no "log(" substring.
const prettify = (raw: string) =>
  raw
    .replace(/log\(/g, "ln(")
    .replace(/log10\(/g, "log(")
    .replace(/sqrt\(/g, "√(")
    .replace(/cbrt\(/g, "∛(")
    .replace(/\*10\^/g, "×10^")
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/pi/g, "π");

const Calculator = ({ onClose }: CalculatorProps) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [isDegrees, setIsDegrees] = useState(true);
  const [isInverse, setIsInverse] = useState(false);

  // True while the display still shows a finished calculation, so the next
  // keypress either extends that answer or starts a fresh entry.
  const [justEvaluated, setJustEvaluated] = useState(false);

  const { panelRef, position, startDrag } = useDraggablePanel(PANEL_WIDTH);

  const insert = (token: string, operator?: boolean) => {
    setExpression((prev) => {
      if (!justEvaluated) return prev + token;
      return operator ? result + token : token;
    });

    if (justEvaluated) {
      setResult("");
      setJustEvaluated(false);
    }
  };

  const clearAll = () => {
    setExpression("");
    setResult("");
    setJustEvaluated(false);
  };

  const backspace = () => {
    if (justEvaluated) {
      clearAll();
      return;
    }
    setExpression((prev) => {
      const token = TOKENS.find((t) => prev.endsWith(t));
      return token ? prev.slice(0, -token.length) : prev.slice(0, -1);
    });
  };

  const recallAnswer = () => {
    if (answer === null) return;
    insert(format(answer, { precision: PRECISION }));
  };

  const handleEquals = () => {
    if (!expression.trim()) return;

    try {
      const value = evaluate(expression, isDegrees ? { ...DEGREE_SCOPE } : {});

      if (typeof value !== "number" || Number.isNaN(value)) {
        setResult("Error");
        return;
      }

      if (!Number.isFinite(value)) {
        setResult("Infinity");
        return;
      }

      setResult(format(value, { precision: PRECISION }));
      setAnswer(value);
      setJustEvaluated(true);
    } catch {
      setResult("Error");
    }
  };

  const handleKey = (key: Key) => {
    if (key.action === "equals") return handleEquals();
    if (key.action === "clear") return clearAll();
    if (key.action === "delete") return backspace();
    if (key.action === "ans") return recallAnswer();

    const token =
      isInverse && key.invInsert ? key.invInsert : (key.insert ?? "");
    if (token) insert(token, key.operator);
  };

  const keyClass =
    "h-9 rounded-lg font-semibold flex items-center justify-center cursor-pointer select-none transition active:scale-[0.96] focus-visible:outline-none";
  const kindClass: Record<string, string> = {
    num: "bg-theme-gray-light text-black/80 hover:bg-theme-gray-light/70 text-[15px]",
    op: "bg-accent-light text-accent-dim hover:bg-accent-light/70 text-[13px]",
    fn: "bg-theme-gray-light/60 text-black/70 hover:bg-theme-gray-light text-[11px]",
    eq: "bg-accent text-white hover:bg-accent-dim text-[15px]",
  };
  const toggleClass =
    "h-6 px-2 rounded-md text-[11px] font-semibold cursor-pointer transition select-none";

  return (
    <div
      ref={panelRef}
      style={{
        left: position.x,
        top: position.y,
        width: PANEL_WIDTH,
        maxWidth: "calc(100vw - 32px)",
      }}
      className="fixed z-50 rounded-xl border border-accent/15 bg-white shadow-2xl font-sans"
    >
      {/* Drag handle / header */}
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between px-4 py-2.5 border-b cursor-move touch-none select-none"
      >
        <span className="text-sm font-semibold text-accent-dim">
          Scientific Calculator
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

      {/* Angle unit & inverse toggles */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <button
          type="button"
          onClick={() => setIsDegrees((prev) => !prev)}
          aria-label="Toggle angle unit"
          className={`${toggleClass} bg-accent-light text-accent-dim hover:bg-accent-light/70`}
        >
          {isDegrees ? "DEG" : "RAD"}
        </button>
        <button
          type="button"
          onClick={() => setIsInverse((prev) => !prev)}
          aria-pressed={isInverse}
          className={`${toggleClass} ${
            isInverse
              ? "bg-accent text-white"
              : "bg-theme-gray-light text-black/70 hover:bg-theme-gray-light/70"
          }`}
        >
          INV
        </button>
      </div>

      {/* Display */}
      <div className="px-3 pt-2">
        <div className="rounded-lg bg-theme-gray-light/60 px-3 py-2">
          <div className="h-5 text-right text-xs text-theme-gray overflow-x-auto whitespace-nowrap">
            {prettify(expression)}
          </div>
          <div className="h-8 flex items-end justify-end text-2xl font-semibold tabular-nums text-black/80 overflow-x-auto whitespace-nowrap">
            {result || (expression ? "" : "0")}
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-5 gap-1.5 p-3">
        {KEYS.flat().map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => handleKey(key)}
            className={`${keyClass} ${kindClass[key.kind ?? "num"]}`}
          >
            {key.action === "delete" ? (
              <Delete size={16} />
            ) : isInverse && key.invLabel ? (
              key.invLabel
            ) : (
              key.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;
