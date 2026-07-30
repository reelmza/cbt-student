"use client";

import { X } from "lucide-react";
import useDraggablePanel from "@/lib/use-draggable-panel";

type PeriodicTableProps = {
  onClose: () => void;
};

// [atomic number, symbol, name, atomic mass, category, group, period]
// Lanthanides and actinides sit on rows 8 and 9, the two pull-out rows.
type ElementEntry = [number, string, string, string, string, number, number];

const ELEMENTS: ElementEntry[] = [
  [1, "H", "Hydrogen", "1.008", "nonmetal", 1, 1],
  [2, "He", "Helium", "4.003", "noble", 18, 1],

  [3, "Li", "Lithium", "6.94", "alkali", 1, 2],
  [4, "Be", "Beryllium", "9.012", "alkaline", 2, 2],
  [5, "B", "Boron", "10.81", "metalloid", 13, 2],
  [6, "C", "Carbon", "12.011", "nonmetal", 14, 2],
  [7, "N", "Nitrogen", "14.007", "nonmetal", 15, 2],
  [8, "O", "Oxygen", "15.999", "nonmetal", 16, 2],
  [9, "F", "Fluorine", "18.998", "halogen", 17, 2],
  [10, "Ne", "Neon", "20.180", "noble", 18, 2],

  [11, "Na", "Sodium", "22.990", "alkali", 1, 3],
  [12, "Mg", "Magnesium", "24.305", "alkaline", 2, 3],
  [13, "Al", "Aluminium", "26.982", "post-transition", 13, 3],
  [14, "Si", "Silicon", "28.085", "metalloid", 14, 3],
  [15, "P", "Phosphorus", "30.974", "nonmetal", 15, 3],
  [16, "S", "Sulfur", "32.06", "nonmetal", 16, 3],
  [17, "Cl", "Chlorine", "35.45", "halogen", 17, 3],
  [18, "Ar", "Argon", "39.95", "noble", 18, 3],

  [19, "K", "Potassium", "39.098", "alkali", 1, 4],
  [20, "Ca", "Calcium", "40.078", "alkaline", 2, 4],
  [21, "Sc", "Scandium", "44.956", "transition", 3, 4],
  [22, "Ti", "Titanium", "47.867", "transition", 4, 4],
  [23, "V", "Vanadium", "50.942", "transition", 5, 4],
  [24, "Cr", "Chromium", "51.996", "transition", 6, 4],
  [25, "Mn", "Manganese", "54.938", "transition", 7, 4],
  [26, "Fe", "Iron", "55.845", "transition", 8, 4],
  [27, "Co", "Cobalt", "58.933", "transition", 9, 4],
  [28, "Ni", "Nickel", "58.693", "transition", 10, 4],
  [29, "Cu", "Copper", "63.546", "transition", 11, 4],
  [30, "Zn", "Zinc", "65.38", "transition", 12, 4],
  [31, "Ga", "Gallium", "69.723", "post-transition", 13, 4],
  [32, "Ge", "Germanium", "72.630", "metalloid", 14, 4],
  [33, "As", "Arsenic", "74.922", "metalloid", 15, 4],
  [34, "Se", "Selenium", "78.971", "nonmetal", 16, 4],
  [35, "Br", "Bromine", "79.904", "halogen", 17, 4],
  [36, "Kr", "Krypton", "83.798", "noble", 18, 4],

  [37, "Rb", "Rubidium", "85.468", "alkali", 1, 5],
  [38, "Sr", "Strontium", "87.62", "alkaline", 2, 5],
  [39, "Y", "Yttrium", "88.906", "transition", 3, 5],
  [40, "Zr", "Zirconium", "91.224", "transition", 4, 5],
  [41, "Nb", "Niobium", "92.906", "transition", 5, 5],
  [42, "Mo", "Molybdenum", "95.95", "transition", 6, 5],
  [43, "Tc", "Technetium", "98", "transition", 7, 5],
  [44, "Ru", "Ruthenium", "101.07", "transition", 8, 5],
  [45, "Rh", "Rhodium", "102.91", "transition", 9, 5],
  [46, "Pd", "Palladium", "106.42", "transition", 10, 5],
  [47, "Ag", "Silver", "107.87", "transition", 11, 5],
  [48, "Cd", "Cadmium", "112.41", "transition", 12, 5],
  [49, "In", "Indium", "114.82", "post-transition", 13, 5],
  [50, "Sn", "Tin", "118.71", "post-transition", 14, 5],
  [51, "Sb", "Antimony", "121.76", "metalloid", 15, 5],
  [52, "Te", "Tellurium", "127.60", "metalloid", 16, 5],
  [53, "I", "Iodine", "126.90", "halogen", 17, 5],
  [54, "Xe", "Xenon", "131.29", "noble", 18, 5],

  [55, "Cs", "Caesium", "132.91", "alkali", 1, 6],
  [56, "Ba", "Barium", "137.33", "alkaline", 2, 6],
  [72, "Hf", "Hafnium", "178.49", "transition", 4, 6],
  [73, "Ta", "Tantalum", "180.95", "transition", 5, 6],
  [74, "W", "Tungsten", "183.84", "transition", 6, 6],
  [75, "Re", "Rhenium", "186.21", "transition", 7, 6],
  [76, "Os", "Osmium", "190.23", "transition", 8, 6],
  [77, "Ir", "Iridium", "192.22", "transition", 9, 6],
  [78, "Pt", "Platinum", "195.08", "transition", 10, 6],
  [79, "Au", "Gold", "196.97", "transition", 11, 6],
  [80, "Hg", "Mercury", "200.59", "transition", 12, 6],
  [81, "Tl", "Thallium", "204.38", "post-transition", 13, 6],
  [82, "Pb", "Lead", "207.2", "post-transition", 14, 6],
  [83, "Bi", "Bismuth", "208.98", "post-transition", 15, 6],
  [84, "Po", "Polonium", "209", "post-transition", 16, 6],
  [85, "At", "Astatine", "210", "metalloid", 17, 6],
  [86, "Rn", "Radon", "222", "noble", 18, 6],

  [87, "Fr", "Francium", "223", "alkali", 1, 7],
  [88, "Ra", "Radium", "226", "alkaline", 2, 7],
  [104, "Rf", "Rutherfordium", "267", "transition", 4, 7],
  [105, "Db", "Dubnium", "268", "transition", 5, 7],
  [106, "Sg", "Seaborgium", "269", "transition", 6, 7],
  [107, "Bh", "Bohrium", "270", "transition", 7, 7],
  [108, "Hs", "Hassium", "269", "transition", 8, 7],
  [109, "Mt", "Meitnerium", "278", "transition", 9, 7],
  [110, "Ds", "Darmstadtium", "281", "transition", 10, 7],
  [111, "Rg", "Roentgenium", "282", "transition", 11, 7],
  [112, "Cn", "Copernicium", "285", "transition", 12, 7],
  [113, "Nh", "Nihonium", "286", "post-transition", 13, 7],
  [114, "Fl", "Flerovium", "289", "post-transition", 14, 7],
  [115, "Mc", "Moscovium", "290", "post-transition", 15, 7],
  [116, "Lv", "Livermorium", "293", "post-transition", 16, 7],
  [117, "Ts", "Tennessine", "294", "halogen", 17, 7],
  [118, "Og", "Oganesson", "294", "noble", 18, 7],

  [57, "La", "Lanthanum", "138.91", "lanthanide", 3, 8],
  [58, "Ce", "Cerium", "140.12", "lanthanide", 4, 8],
  [59, "Pr", "Praseodymium", "140.91", "lanthanide", 5, 8],
  [60, "Nd", "Neodymium", "144.24", "lanthanide", 6, 8],
  [61, "Pm", "Promethium", "145", "lanthanide", 7, 8],
  [62, "Sm", "Samarium", "150.36", "lanthanide", 8, 8],
  [63, "Eu", "Europium", "151.96", "lanthanide", 9, 8],
  [64, "Gd", "Gadolinium", "157.25", "lanthanide", 10, 8],
  [65, "Tb", "Terbium", "158.93", "lanthanide", 11, 8],
  [66, "Dy", "Dysprosium", "162.50", "lanthanide", 12, 8],
  [67, "Ho", "Holmium", "164.93", "lanthanide", 13, 8],
  [68, "Er", "Erbium", "167.26", "lanthanide", 14, 8],
  [69, "Tm", "Thulium", "168.93", "lanthanide", 15, 8],
  [70, "Yb", "Ytterbium", "173.05", "lanthanide", 16, 8],
  [71, "Lu", "Lutetium", "174.97", "lanthanide", 17, 8],

  [89, "Ac", "Actinium", "227", "actinide", 3, 9],
  [90, "Th", "Thorium", "232.04", "actinide", 4, 9],
  [91, "Pa", "Protactinium", "231.04", "actinide", 5, 9],
  [92, "U", "Uranium", "238.03", "actinide", 6, 9],
  [93, "Np", "Neptunium", "237", "actinide", 7, 9],
  [94, "Pu", "Plutonium", "244", "actinide", 8, 9],
  [95, "Am", "Americium", "243", "actinide", 9, 9],
  [96, "Cm", "Curium", "247", "actinide", 10, 9],
  [97, "Bk", "Berkelium", "247", "actinide", 11, 9],
  [98, "Cf", "Californium", "251", "actinide", 12, 9],
  [99, "Es", "Einsteinium", "252", "actinide", 13, 9],
  [100, "Fm", "Fermium", "257", "actinide", 14, 9],
  [101, "Md", "Mendelevium", "258", "actinide", 15, 9],
  [102, "No", "Nobelium", "259", "actinide", 16, 9],
  [103, "Lr", "Lawrencium", "266", "actinide", 17, 9],
];

const CATEGORY_STYLES: Record<string, string> = {
  alkali: "bg-red-100 text-red-900 border-red-200",
  alkaline: "bg-orange-100 text-orange-900 border-orange-200",
  transition: "bg-amber-100 text-amber-900 border-amber-200",
  "post-transition": "bg-teal-100 text-teal-900 border-teal-200",
  metalloid: "bg-lime-100 text-lime-900 border-lime-200",
  nonmetal: "bg-emerald-100 text-emerald-900 border-emerald-200",
  halogen: "bg-sky-100 text-sky-900 border-sky-200",
  noble: "bg-violet-100 text-violet-900 border-violet-200",
  lanthanide: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  actinide: "bg-rose-100 text-rose-900 border-rose-200",
};

const CATEGORY_LABELS: [string, string][] = [
  ["alkali", "Alkali metal"],
  ["alkaline", "Alkaline earth"],
  ["transition", "Transition metal"],
  ["post-transition", "Post-transition"],
  ["metalloid", "Metalloid"],
  ["nonmetal", "Nonmetal"],
  ["halogen", "Halogen"],
  ["noble", "Noble gas"],
  ["lanthanide", "Lanthanide"],
  ["actinide", "Actinide"],
];

const PANEL_WIDTH = 890;
const CELL = 38;
const ROW = 42;

const PeriodicTable = ({ onClose }: PeriodicTableProps) => {
  const { panelRef, position, startDrag } = useDraggablePanel(PANEL_WIDTH);

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
          Periodic Table
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close periodic table"
          className="p-1 rounded-md text-theme-gray hover:bg-theme-gray-light hover:text-black/80 cursor-pointer transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Legend sits beside the table so the panel stays short */}
      <div className="flex items-start gap-3 p-3">
        {/* Table — scrolls sideways when a narrow screen caps the panel */}
        <div className="overflow-x-auto">
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(18, ${CELL}px)`,
              // Row 8 is the blank gutter above the lanthanide / actinide rows
              gridTemplateRows: `repeat(7, ${ROW}px) 10px repeat(2, ${ROW}px)`,
            }}
          >
            {/* Placeholders pointing at the two pull-out rows */}
            {[
              { row: 6, text: "57-71", style: CATEGORY_STYLES.lanthanide },
              { row: 7, text: "89-103", style: CATEGORY_STYLES.actinide },
            ].map((ph) => (
              <div
                key={ph.text}
                style={{ gridColumn: 3, gridRow: ph.row }}
                className={`flex items-center justify-center rounded border text-[8px] font-semibold ${ph.style}`}
              >
                {ph.text}
              </div>
            ))}

            {ELEMENTS.map(
              ([number, symbol, name, mass, category, group, period]) => (
                <div
                  key={number}
                  title={`${name} — ${number}, ${mass}`}
                  style={{
                    gridColumn: group,
                    // Rows 8 and 9 of the data render below the gutter row
                    gridRow: period > 7 ? period + 1 : period,
                  }}
                  className={`flex flex-col justify-between rounded border px-1 py-0.5 overflow-hidden ${
                    CATEGORY_STYLES[category] ?? "bg-theme-gray-light"
                  }`}
                >
                  <div className="text-[8px] leading-none opacity-70">
                    {number}
                  </div>
                  <div className="text-[14px] font-bold leading-none text-center">
                    {symbol}
                  </div>
                  <div className="text-[7px] leading-none text-center opacity-70 tabular-nums">
                    {mass}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1 shrink-0">
          {CATEGORY_LABELS.map(([category, label]) => (
            <div key={category} className="flex items-center gap-1.5">
              <span
                className={`size-2.5 shrink-0 rounded-sm border ${CATEGORY_STYLES[category]}`}
              />
              <span className="text-[10px] leading-none text-theme-gray whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeriodicTable;
