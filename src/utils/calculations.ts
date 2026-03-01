// src/utils/calculations.ts 
// Motor de cálculo (versión con campos alias en inglés y español)
// Láminas comerciales + accesorios completos
// IMPLEMENTACIÓN: optimización de compra por grupos (2 y 3) para láminas y uniones,
// minimizando el costo total comprado (objetivo A del cliente).
// NO se cambió la forma de cálculo de perfiles, cintas, silicón; tornillos/arandelas
// se calculan por la distribución de láminas compradas (como pidió el cliente).

export type Brand = 'KLAR' | 'PCR';

export interface ItemRow {
  item: number;
  id?: string;

  descripcion: string;
  description?: string;
  cantidad: number;
  quantity?: number;
  precio_unitario: number;
  unitPrice?: number;
  total: number;
}

export interface CalcResult {
  width: number;
  height: number;
  marca: Brand;
  largo_comercial: number;

  items: ItemRow[];
  materials: ItemRow[];

  subtotal: number;
  tax: number;
  totalBeforeRounding: number;
  total: number;
  roundingValue: number;

  sheetWidth: number;
  numSheets: number;
  cutWidth: number;
}

const TAX_RATE = 0.13;
const SHEET_WIDTH = 2.10;
const MAX_LENGTH = 11.60;

const COMMERCIAL_LENGTHS = [1.45, 2.90, 4.35, 5.80, 7.25, 8.70, 11.60];

const PRICE_TABLES: Record<Brand, Record<number, number>> = {
  KLAR: {
    1.45: 14800,
    2.90: 29600,
    4.35: 44400,
    5.80: 59200,
    7.25: 74000,
    8.70: 88800,
    11.60: 118400
  },
  PCR: {
    1.45: 12000,
    2.90: 24000,
    4.35: 36000,
    5.80: 48000,
    7.25: 60000,
    8.70: 72000,
    11.60: 96000
  }
};

const UNION_PRICE_TABLE: Record<number, number> = {
  1.45: 2762,
  2.90: 5524,
  4.35: 8286,
  5.80: 11048,
  7.25: 13810,
  8.70: 16572,
  11.60: 22096
};

const PRICE_PERFIL_U = 2654.87;
const PRICE_CINTA_VENTILADA = 690.27;
const PRICE_CINTA_ALUMINIO = 425;
const PRICE_TORNILLO = 65;
const PRICE_ARANDELA = 132.75;
const PRICE_SILICON = 5929.21;

// ==============================
// TABLA REAL DE TORNILLOS Y ARANDELAS
// basado en largo de lámina y cantidad de láminas (1..10)
// ==============================
type FixingRow = {
  screws: number;
  washers: number;
};

type FixingTable = {
  [sheetLength: number]: FixingRow[];
};

export const FIXING_TABLE: FixingTable = {
  2.90: [
    { screws: 20, washers: 20 },
    { screws: 35, washers: 30 },
    { screws: 50, washers: 40 },
    { screws: 65, washers: 50 },
    { screws: 80, washers: 60 },
    { screws: 95, washers: 70 },
    { screws: 110, washers: 80 },
    { screws: 125, washers: 90 },
    { screws: 140, washers: 100 },
    { screws: 155, washers: 110 }
  ],
  4.35: [
    { screws: 30, washers: 30 },
    { screws: 50, washers: 45 },
    { screws: 70, washers: 60 },
    { screws: 90, washers: 75 },
    { screws: 110, washers: 90 },
    { screws: 130, washers: 105 },
    { screws: 150, washers: 120 },
    { screws: 170, washers: 135 },
    { screws: 190, washers: 150 },
    { screws: 210, washers: 165 }
  ],
  5.80: [
    { screws: 40, washers: 40 },
    { screws: 70, washers: 60 },
    { screws: 100, washers: 80 },
    { screws: 130, washers: 100 },
    { screws: 160, washers: 120 },
    { screws: 190, washers: 140 },
    { screws: 220, washers: 160 },
    { screws: 250, washers: 180 },
    { screws: 280, washers: 200 },
    { screws: 310, washers: 220 }
  ],
  7.25: [
    { screws: 50, washers: 50 },
    { screws: 85, washers: 75 },
    { screws: 120, washers: 100 },
    { screws: 155, washers: 125 },
    { screws: 190, washers: 150 },
    { screws: 225, washers: 175 },
    { screws: 260, washers: 200 },
    { screws: 295, washers: 225 },
    { screws: 330, washers: 250 },
    { screws: 365, washers: 275 }
  ],
  8.70: [
    { screws: 60, washers: 60 },
    { screws: 100, washers: 85 },
    { screws: 140, washers: 110 },
    { screws: 180, washers: 135 },
    { screws: 220, washers: 160 },
    { screws: 260, washers: 185 },
    { screws: 300, washers: 210 },
    { screws: 340, washers: 235 },
    { screws: 380, washers: 260 },
    { screws: 420, washers: 285 }
  ],
  11.60: [
    { screws: 80, washers: 80 },
    { screws: 140, washers: 120 },
    { screws: 200, washers: 160 },
    { screws: 260, washers: 200 },
    { screws: 320, washers: 240 },
    { screws: 380, washers: 280 },
    { screws: 440, washers: 320 },
    { screws: 500, washers: 360 },
    { screws: 560, washers: 400 },
    { screws: 620, washers: 440 }
  ]
};

/**
 * getFixings
 * sheetLength: largo comercial (ej. 2.9, 4.35, ...)
 * sheetCount: número de láminas (1..n)
 *
 * Si sheetCount > 10, toma la última fila (clamp).
 */
export function getFixings(sheetLength: number, sheetCount: number): FixingRow {
  const table = FIXING_TABLE[sheetLength];
  if (!table) {
    // fallback: si no hay tabla definida, devolvemos una aproximación conservadora
    // (0 tornillos y 0 arandelas para no romper la app)
    return { screws: 0, washers: 0 };
  }
  const index = Math.max(0, Math.min(sheetCount - 1, table.length - 1));
  return table[index];
}

// -----------------------------
// Helpers
// -----------------------------
function safeNumber(n: unknown): number {
  const num = Number(n);
  if (isNaN(num)) return 0;
  return num;
}

function round(n: number): number {
  return Math.round(safeNumber(n));
}

export function formatCurrency(value: number): string {
  const safe = safeNumber(value);
  try {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(safe);
  } catch {
    return `₡${Math.round(safe)}`;
  }
}

export function generateQuoteNumber(): string {
  const now = new Date();
  return `JN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function selectCommercialLength(height: number): number {
  const h = safeNumber(height);
  if (h > MAX_LENGTH) throw new Error("Altura mayor a 11.60 requiere asesor.");
  for (const L of COMMERCIAL_LENGTHS) if (L >= h) return L;
  return COMMERCIAL_LENGTHS[COMMERCIAL_LENGTHS.length - 1];
}

// -----------------------------
// Helpers para optimización de compra (grupos de 2 y 3)
// -----------------------------
function selectNextCommercialLength(requiredLength: number): number {
  const rl = safeNumber(requiredLength);
  for (const L of COMMERCIAL_LENGTHS) {
    if (L >= rl) return L;
  }
  // fallback to max length
  return COMMERCIAL_LENGTHS[COMMERCIAL_LENGTHS.length - 1];
}

/**
 * Genera todas las particiones posibles usando solo grupos de 3 y 2 (y el resto como singles)
 * para numSheets. Retorna una lista de objetos { g3, g2, singles } donde:
 * 3*g3 + 2*g2 + singles = numSheets
 * Solo genera combinaciones válidas (g3,g2 >=0).
 */
function generateGroupCombinations(numSheets: number): { g3: number; g2: number; singles: number }[] {
  const combos: { g3: number; g2: number; singles: number }[] = [];
  const maxG3 = Math.floor(numSheets / 3);
  for (let g3 = 0; g3 <= maxG3; g3++) {
    const remainingAfterG3 = numSheets - 3 * g3;
    const maxG2 = Math.floor(remainingAfterG3 / 2);
    for (let g2 = 0; g2 <= maxG2; g2++) {
      const singles = remainingAfterG3 - 2 * g2;
      combos.push({ g3, g2, singles });
    }
  }
  return combos;
}

// -----------------------------
// Main: calculateQuote (con optimización de compra)
// -----------------------------
export function calculateQuote(
  widthInput: number,
  heightInput: number,
  roundingValueInput: number = 0,
  brand: Brand = 'KLAR'
): CalcResult {
  const width = safeNumber(widthInput);
  const height = safeNumber(heightInput);
  void roundingValueInput;

  if (width <= 0 || height <= 0) throw new Error("Medidas inválidas");
  if (height > MAX_LENGTH) throw new Error("Altura mayor a 11.60 requiere asesor.");

  const numSheets = Math.ceil(width / SHEET_WIDTH);
  const cutWidth = Math.round((width - ((numSheets - 1) * SHEET_WIDTH)) * 1000) / 1000;
  const numUnions = Math.max(0, numSheets - 1);

  // --- Optimizar compra de LÁMINAS ---
  const sheetCombos = generateGroupCombinations(numSheets);

  let bestSheetPlan: {
    g3: number;
    g2: number;
    singles: number;
    distribution: Record<number, number>; // length -> count
    laminaCost: number;
    screwsTotal: number;
    washersTotal: number;
    fixingsCost: number;
  } | null = null;

  for (const combo of sheetCombos) {
    const { g3, g2, singles } = combo;

    // validar restricciones físicas: 2*height and 3*height cannot exceed MAX_LENGTH
    if (g3 > 0 && 3 * height > MAX_LENGTH) continue;
    if (g2 > 0 && 2 * height > MAX_LENGTH) continue;

    // determine commercial lengths for each group type
    const len3 = g3 > 0 ? selectNextCommercialLength(3 * height) : null;
    const len2 = g2 > 0 ? selectNextCommercialLength(2 * height) : null;
    const len1 = singles > 0 ? selectNextCommercialLength(height) : null;

    // build distribution map length -> count
    const distribution: Record<number, number> = {};
    if (len3) distribution[len3] = (distribution[len3] || 0) + g3;
    if (len2) distribution[len2] = (distribution[len2] || 0) + g2;
    if (len1) distribution[len1] = (distribution[len1] || 0) + singles;

    // compute lamina cost (by brand)
    let laminaCost = 0;
    for (const [lenStr, cnt] of Object.entries(distribution)) {
      const len = Number(lenStr);
      const unit = safeNumber(PRICE_TABLES[brand][len]);
      laminaCost += cnt * unit;
    }

    // compute fixings (screws/arandelas) based on purchased distribution
    let screwsTotal = 0;
    let washersTotal = 0;
    for (const [lenStr, cnt] of Object.entries(distribution)) {
      const len = Number(lenStr);
      const fix = getFixings(len, cnt);
      screwsTotal += fix.screws;
      washersTotal += fix.washers;
    }
    const fixingsCost = screwsTotal * PRICE_TORNILLO + washersTotal * PRICE_ARANDELA;

    // total cost for sheet plan (we only consider lamina+fixings here, other items constant)
    const planCost = laminaCost + fixingsCost;

    if (!bestSheetPlan || planCost < (bestSheetPlan.laminaCost + bestSheetPlan.fixingsCost)) {
      bestSheetPlan = {
        g3,
        g2,
        singles,
        distribution,
        laminaCost,
        screwsTotal,
        washersTotal,
        fixingsCost
      };
    }
  }

  // Fallback: if no valid plan (shouldn't happen) use simple selection (all singles)
  if (!bestSheetPlan) {
    const baseLen = selectNextCommercialLength(height);
    const distribution: Record<number, number> = {};
    distribution[baseLen] = numSheets;
    const laminaCost = numSheets * safeNumber(PRICE_TABLES[brand][baseLen]);
    const fix = getFixings(baseLen, numSheets);
    const screwsTotal = fix.screws;
    const washersTotal = fix.washers;
    const fixingsCost = screwsTotal * PRICE_TORNILLO + washersTotal * PRICE_ARANDELA;
    bestSheetPlan = {
      g3: 0,
      g2: 0,
      singles: numSheets,
      distribution,
      laminaCost,
      screwsTotal,
      washersTotal,
      fixingsCost
    };
  }

  // --- Optimizar compra de UNIONES (misma lógica: tratar grupos 3/2 y singles) ---
  const unionCombos = generateGroupCombinations(numUnions);
  let bestUnionPlan: {
    g3: number;
    g2: number;
    singles: number;
    distribution: Record<number, number>;
    unionCost: number;
  } | null = null;

  for (const combo of unionCombos) {
    const { g3, g2, singles } = combo;

    // validate physical constraint for unions: group lengths must fit MAX_LENGTH
    if (g3 > 0 && 3 * height > MAX_LENGTH) continue;
    if (g2 > 0 && 2 * height > MAX_LENGTH) continue;

    const len3 = g3 > 0 ? selectNextCommercialLength(3 * height) : null;
    const len2 = g2 > 0 ? selectNextCommercialLength(2 * height) : null;
    const len1 = singles > 0 ? selectNextCommercialLength(height) : null;

    const distribution: Record<number, number> = {};
    if (len3) distribution[len3] = (distribution[len3] || 0) + g3;
    if (len2) distribution[len2] = (distribution[len2] || 0) + g2;
    if (len1) distribution[len1] = (distribution[len1] || 0) + singles;

    let unionCost = 0;
    for (const [lenStr, cnt] of Object.entries(distribution)) {
      const len = Number(lenStr);
      const unit = safeNumber(UNION_PRICE_TABLE[len]);
      unionCost += cnt * unit;
    }

    if (!bestUnionPlan || unionCost < bestUnionPlan.unionCost) {
      bestUnionPlan = {
        g3,
        g2,
        singles,
        distribution,
        unionCost
      };
    }
  }

  // Fallback for unions if none valid (e.g., numUnions = 0)
  if (!bestUnionPlan) {
    const distribution: Record<number, number> = {};
    if (numUnions > 0) {
      const baseUnionLen = selectNextCommercialLength(height);
      distribution[baseUnionLen] = numUnions;
    }
    let unionCost = 0;
    for (const [lenStr, cnt] of Object.entries(distribution)) {
      const len = Number(lenStr);
      const unit = safeNumber(UNION_PRICE_TABLE[len]);
      unionCost += cnt * unit;
    }
    bestUnionPlan = { g3: 0, g2: 0, singles: numUnions, distribution, unionCost };
  }

  // --- Construir items basados en los planes seleccionados ---
  const items: ItemRow[] = [];
  let idx = 1;

  // LÁMINAS: una línea por cada length comprado
  for (const lenKey of Object.keys(bestSheetPlan.distribution).map(k => Number(k)).sort((a, b) => a - b)) {
    const cnt = bestSheetPlan.distribution[lenKey];
    const unit = safeNumber(PRICE_TABLES[brand][lenKey]);
    items.push({
      item: idx++,
      id: `laminas_${lenKey}`,
      descripcion: `Lámina Policarbonato ${brand} ${SHEET_WIDTH} x ${lenKey} m`,
      description: `Polycarbonate sheet ${brand} ${SHEET_WIDTH} x ${lenKey} m`,
      cantidad: cnt,
      quantity: cnt,
      precio_unitario: unit,
      unitPrice: unit,
      total: round(cnt * unit)
    });
  }

  // UNIONES: una línea por cada length comprado (según plan de uniones)
  for (const lenKey of Object.keys(bestUnionPlan.distribution).map(k => Number(k)).sort((a, b) => a - b)) {
    const cnt = bestUnionPlan.distribution[lenKey];
    const unit = safeNumber(UNION_PRICE_TABLE[lenKey]);
    items.push({
      item: idx++,
      id: `uniones_${lenKey}`,
      descripcion: `Unión Perfil H ${lenKey} m`,
      description: `H-Profile union ${lenKey} m`,
      cantidad: cnt,
      quantity: cnt,
      precio_unitario: unit,
      unitPrice: unit,
      total: round(cnt * unit)
    });
  }

  // PERFILES U (instalación depende de numSheets, no de compra)
  let perfilesQty = numSheets * 2;
  if (cutWidth <= 1.05) perfilesQty = Math.max(0, perfilesQty - 1);
  items.push({
    item: idx++,
    id: 'perfiles',
    descripcion: `Perfil U (cierre)`,
    description: `U-Profile (closure)`,
    cantidad: perfilesQty,
    quantity: perfilesQty,
    precio_unitario: PRICE_PERFIL_U,
    unitPrice: PRICE_PERFIL_U,
    total: round(perfilesQty * PRICE_PERFIL_U)
  });

  // CINTA ventilada
  const cintaMetros = Math.round((width + 0.5) * 1000) / 1000;
  items.push({
    item: idx++,
    id: 'cintaVentilada',
    descripcion: `Cinta microperforada (inferior)`,
    description: `Perforated tape (bottom)`,
    cantidad: cintaMetros,
    quantity: cintaMetros,
    precio_unitario: PRICE_CINTA_VENTILADA,
    unitPrice: PRICE_CINTA_VENTILADA,
    total: round(cintaMetros * PRICE_CINTA_VENTILADA)
  });

  // CINTA aluminio
  items.push({
    item: idx++,
    id: 'cintaAluminio',
    descripcion: `Cinta aluminio (superior)`,
    description: `Aluminum tape (top)`,
    cantidad: cintaMetros,
    quantity: cintaMetros,
    precio_unitario: PRICE_CINTA_ALUMINIO,
    unitPrice: PRICE_CINTA_ALUMINIO,
    total: round(cintaMetros * PRICE_CINTA_ALUMINIO)
  });

  // -----------------------------
  // TORNILLOS y ARANDELAS (sumando por distribution de láminas compradas)
  // -----------------------------
  let totalScrews = 0;
  let totalWashers = 0;
  for (const lenStr of Object.keys(bestSheetPlan.distribution)) {
    const len = Number(lenStr);
    const cnt = bestSheetPlan.distribution[len];
    const fixing = getFixings(len, cnt);
    totalScrews += fixing.screws;
    totalWashers += fixing.washers;
  }

  items.push({
    item: idx++,
    id: 'tornillos',
    descripcion: `Tornillo con arandela neopreno`,
    description: `Screw with neoprene washer`,
    cantidad: totalScrews,
    quantity: totalScrews,
    precio_unitario: PRICE_TORNILLO,
    unitPrice: PRICE_TORNILLO,
    total: round(totalScrews * PRICE_TORNILLO)
  });

  items.push({
    item: idx++,
    id: 'arandelas',
    descripcion: `Arandela neopreno`,
    description: `Neoprene washer`,
    cantidad: totalWashers,
    quantity: totalWashers,
    precio_unitario: PRICE_ARANDELA,
    unitPrice: PRICE_ARANDELA,
    total: round(totalWashers * PRICE_ARANDELA)
  });

  // SILICÓN (instalación: por area)
  const area = width * height;
  const siliconQty = Math.ceil(area / 20);
  items.push({
    item: idx++,
    id: 'silicon',
    descripcion: `Silicón sellador (tubos)`,
    description: `Silicone sealant (tubes)`,
    cantidad: siliconQty,
    quantity: siliconQty,
    precio_unitario: PRICE_SILICON,
    unitPrice: PRICE_SILICON,
    total: round(siliconQty * PRICE_SILICON)
  });

  // Totales (sin redondeo aplicado al final)
  const subtotal = round(items.reduce((s, it) => s + (safeNumber(it.total)), 0));
  const tax = round(subtotal * TAX_RATE);
  const totalBeforeRounding = subtotal + tax;

  const total = totalBeforeRounding;
  const roundingValue = 0;

  // largo_comercial mantiene la compatibilidad: longitud comercial base para la altura solicitada
  const result: CalcResult = {
    width,
    height,
    marca: brand,
    largo_comercial: selectCommercialLength(height),
    items,
    materials: [...items],
    subtotal,
    tax,
    totalBeforeRounding,
    total,
    roundingValue,
    sheetWidth: SHEET_WIDTH,
    numSheets,
    cutWidth
  };

  return result;
}

// compat
export default calculateQuote;
export { calculateQuote as calculateQuoteNamed };