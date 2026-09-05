"use client";

import { X } from "lucide-react";
import { useState } from "react";
import useDraggablePanel from "@/lib/use-draggable-panel";

type FourFigureTableProps = {
  onClose: () => void;
};

const PANEL_WIDTH = 880;

// Past this angle a tangent changes too fast across six minutes for a single
// mean difference to mean anything, which is where printed tables stop too.
const UNUSABLE_DIFFERENCE = 999;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const range = <T,>(count: number, build: (index: number) => T): T[] =>
  Array.from({ length: count }, (_, index) => build(index));

/* Rounded first, so a value a hair under a power of ten (tan 45° lands on
 * 0.9999999999999999) is not read as belonging to the decade below it */
const exponentOf = (value: number) => {
  const rounded = Number(value.toPrecision(4));
  return Math.floor(Math.log10(Math.abs(rounded) || 1));
};

/* Four significant figures, so the decimal point moves with the magnitude:
 * 1.000, 9.999, 98.01 */
const sig4 = (value: number) =>
  value.toFixed(Math.max(0, 3 - exponentOf(value)));

/* The place value of the fourth significant digit, which is the unit a mean
 * difference is counted in */
const sig4Unit = (value: number) => 10 ** (exponentOf(value) - 3);

const fixed4 = (value: number) => value.toFixed(4);
const tenThousandth = () => 1e-4;

// Logarithms are read as a mantissa, so the leading zero is dropped: .3010
const mantissa = (value: number) => value.toFixed(4).slice(1);

type NumericTable = {
  id: string;
  label: string;
  rowHeading: string;
  colCaption: string;
  note: string;
  rows: { label: string; base: number }[];
  cols: string[];
  colStep: number;
  diffs: string[];
  diffStep: number;
  fn: (x: number) => number;
  format: (value: number) => string;
  unit: (value: number) => number;
};

// 1.0 through 9.9, the row spine shared by most of the tables
const DECIMAL_ROWS = range(90, (i) => {
  const base = 1 + i / 10;
  return { label: base.toFixed(1), base };
});

const DIGIT_COLS = range(10, (i) => String(i));
const DIGIT_DIFFS = range(9, (i) => String(i + 1));

// 0° through 89°, columns every six minutes, differences every minute
const ANGLE_ROWS = range(90, (i) => ({ label: `${i}°`, base: i }));
const MINUTE_COLS = range(10, (i) => `${i * 6}'`);
const MINUTE_DIFFS = range(5, (i) => `${i + 1}'`);
const MINUTE = 1 / 60;

const TABLES: NumericTable[] = [
  {
    id: "log",
    label: "Log",
    rowHeading: "x",
    colCaption: "Hundredths",
    note: "Mantissa only. Add the characteristic yourself. Mean differences are added.",
    rows: DECIMAL_ROWS,
    cols: DIGIT_COLS,
    colStep: 0.01,
    diffs: DIGIT_DIFFS,
    diffStep: 0.001,
    fn: Math.log10,
    format: mantissa,
    unit: tenThousandth,
  },
  {
    id: "antilog",
    label: "Antilog",
    rowHeading: "Mantissa",
    colCaption: "Third decimal place",
    note: "Gives the digits only. Place the decimal point using the characteristic. Mean differences are added.",
    rows: range(100, (i) => ({
      label: `.${String(i).padStart(2, "0")}`,
      base: i / 100,
    })),
    cols: DIGIT_COLS,
    colStep: 0.001,
    diffs: DIGIT_DIFFS,
    diffStep: 0.0001,
    fn: (m) => 10 ** m,
    format: sig4,
    unit: sig4Unit,
  },
  {
    id: "sine",
    label: "Sine",
    rowHeading: "Angle",
    colCaption: "Minutes",
    note: "Natural sines. Mean differences are added.",
    rows: ANGLE_ROWS,
    cols: MINUTE_COLS,
    colStep: 0.1,
    diffs: MINUTE_DIFFS,
    diffStep: MINUTE,
    fn: (deg) => Math.sin(radians(deg)),
    format: fixed4,
    unit: tenThousandth,
  },
  {
    id: "cosine",
    label: "Cosine",
    rowHeading: "Angle",
    colCaption: "Minutes",
    note: "Natural cosines. A cosine falls as the angle grows, so mean differences are subtracted.",
    rows: ANGLE_ROWS,
    cols: MINUTE_COLS,
    colStep: 0.1,
    diffs: MINUTE_DIFFS,
    diffStep: MINUTE,
    fn: (deg) => Math.cos(radians(deg)),
    format: fixed4,
    unit: tenThousandth,
  },
  {
    id: "tangent",
    label: "Tangent",
    rowHeading: "Angle",
    colCaption: "Minutes",
    note: "Natural tangents. Mean differences are added, and are shown as a dot where the angle changes too fast for them to be reliable.",
    rows: ANGLE_ROWS,
    cols: MINUTE_COLS,
    colStep: 0.1,
    diffs: MINUTE_DIFFS,
    diffStep: MINUTE,
    fn: (deg) => Math.tan(radians(deg)),
    format: (value) => (value < 1 ? fixed4(value) : sig4(value)),
    unit: (value) => (value < 1 ? 1e-4 : sig4Unit(value)),
  },
  {
    id: "square",
    label: "Square",
    rowHeading: "x",
    colCaption: "Hundredths",
    note: "Squares of 1 to 10. Mean differences are added.",
    rows: DECIMAL_ROWS,
    cols: DIGIT_COLS,
    colStep: 0.01,
    diffs: DIGIT_DIFFS,
    diffStep: 0.001,
    fn: (x) => x * x,
    format: sig4,
    unit: sig4Unit,
  },
  {
    id: "sqrt-1-10",
    label: "Root 1-10",
    rowHeading: "x",
    colCaption: "Hundredths",
    note: "Square roots of 1 to 10. Mean differences are added.",
    rows: DECIMAL_ROWS,
    cols: DIGIT_COLS,
    colStep: 0.01,
    diffs: DIGIT_DIFFS,
    diffStep: 0.001,
    fn: Math.sqrt,
    format: sig4,
    unit: sig4Unit,
  },
  {
    id: "sqrt-10-100",
    label: "Root 10-100",
    rowHeading: "x",
    colCaption: "Tenths",
    note: "Square roots of 10 to 100. Mean differences are added.",
    rows: range(90, (i) => ({ label: String(10 + i), base: 10 + i })),
    cols: DIGIT_COLS,
    colStep: 0.1,
    diffs: DIGIT_DIFFS,
    diffStep: 0.01,
    fn: Math.sqrt,
    format: sig4,
    unit: sig4Unit,
  },
  {
    id: "reciprocal",
    label: "Reciprocal",
    rowHeading: "x",
    colCaption: "Hundredths",
    note: "A reciprocal falls as the number grows, so mean differences are subtracted.",
    rows: DECIMAL_ROWS,
    cols: DIGIT_COLS,
    colStep: 0.01,
    diffs: DIGIT_DIFFS,
    diffStep: 0.001,
    fn: (x) => 1 / x,
    format: fixed4,
    unit: tenThousandth,
  },
];

/* The average change across the row for one step of the fourth figure, counted
 * in whatever place value the row's last printed digit sits in */
const meanDifference = (table: NumericTable, base: number, step: number) => {
  let total = 0;

  for (let col = 0; col < table.cols.length; col++) {
    const x = base + col * table.colStep;
    total += Math.abs(table.fn(x + step * table.diffStep) - table.fn(x));
  }

  const average = total / table.cols.length;
  const difference = Math.round(average / table.unit(table.fn(base)));

  return difference > UNUSABLE_DIFFERENCE ? "·" : String(difference);
};

const HEAD_CELL =
  "h-6 bg-white px-1 text-center text-[10px] font-semibold text-theme-gray";

const FourFigureTable = ({ onClose }: FourFigureTableProps) => {
  const { panelRef, position, startDrag } = useDraggablePanel(PANEL_WIDTH);
  const [activeId, setActiveId] = useState(TABLES[0].id);

  const table = TABLES.find((item) => item.id === activeId) ?? TABLES[0];

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
          Four Figure Table
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close four figure table"
          className="p-1 rounded-md text-theme-gray hover:bg-theme-gray-light hover:text-black/80 cursor-pointer transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Which table is on screen */}
      <div className="flex flex-wrap gap-1 border-b px-3 py-2">
        {TABLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            aria-pressed={item.id === table.id}
            className={`h-8 rounded-md px-2.5 text-xs font-medium cursor-pointer transition duration-150 ${
              item.id === table.id
                ? "bg-accent text-white"
                : "text-theme-gray hover:bg-theme-gray-light hover:text-accent-dim"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Values — the head and the row spine stay put while the body scrolls */}
      <div className="max-h-[58vh] overflow-auto">
        <table
          aria-label={`${table.label} table`}
          className="w-full border-separate border-spacing-0 tabular-nums"
        >
          <thead>
            <tr>
              <th
                scope="col"
                rowSpan={2}
                className={`${HEAD_CELL} sticky left-0 top-0 z-30 border-b border-r border-theme-gray-mid`}
              >
                {table.rowHeading}
              </th>
              <th
                scope="col"
                colSpan={table.cols.length}
                className={`${HEAD_CELL} sticky top-0 z-20 font-normal`}
              >
                {table.colCaption}
              </th>
              <th
                scope="col"
                colSpan={table.diffs.length}
                className={`${HEAD_CELL} sticky top-0 z-20 border-l border-theme-gray-mid font-normal`}
              >
                Mean differences
              </th>
            </tr>
            <tr>
              {table.cols.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={`${HEAD_CELL} sticky top-6 z-20 border-b border-theme-gray-mid`}
                >
                  {col}
                </th>
              ))}
              {table.diffs.map((diff, index) => (
                <th
                  key={diff}
                  scope="col"
                  className={`${HEAD_CELL} sticky top-6 z-20 border-b border-theme-gray-mid text-theme-gray-dim ${
                    index === 0 ? "border-l" : ""
                  }`}
                >
                  {diff}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 h-6 border-r border-theme-gray-mid bg-white px-1 text-center text-[11px] font-semibold text-accent-dim group-hover:bg-accent-light"
                >
                  {row.label}
                </th>

                {table.cols.map((col, index) => (
                  <td
                    key={col}
                    className="h-6 px-1 text-center text-[11px] text-black/80 group-hover:bg-accent-light"
                  >
                    {table.format(table.fn(row.base + index * table.colStep))}
                  </td>
                ))}

                {table.diffs.map((diff, index) => (
                  <td
                    key={diff}
                    className={`h-6 px-1 text-center text-[11px] text-theme-gray group-hover:bg-accent-light ${
                      index === 0 ? "border-l border-theme-gray-mid" : ""
                    }`}
                  >
                    {meanDifference(table, row.base, index + 1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How to read the table on screen */}
      <div className="border-t px-4 py-2 text-[11px] leading-relaxed text-theme-gray">
        {table.note}
      </div>
    </div>
  );
};

export default FourFigureTable;
