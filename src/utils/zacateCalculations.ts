import { CalculationResult, Material } from '../types/calculator';

export interface ZacateCalculationMeta {
  area: number;
  strips: number;
  linearMeters: number;
  billedArea: number;
  total: number;
}

const ROLL_WIDTH_M = 2;
const PRICE_PER_M2 = 6500;

export function calculateZacateQuote(lengthInput: number, widthInput: number): { result: CalculationResult; meta: ZacateCalculationMeta } {
  const length = Number(lengthInput);
  const width = Number(widthInput);

  if (!Number.isFinite(length) || !Number.isFinite(width) || length <= 0 || width <= 0) {
    throw new Error('Medidas inválidas para zacate');
  }

  const area = length * width;
  const strips = Math.ceil(width / ROLL_WIDTH_M);
  const linearMeters = strips * length;
  const billedArea = linearMeters * ROLL_WIDTH_M;
  const total = billedArea * PRICE_PER_M2;

  const materials: Material[] = [
    {
      id: 'zacate-35mm',
      name: 'Zacate Sintético 35mm (rollo 2m ancho)',
      description: `Área real: ${area.toFixed(2)} m² · Área facturada: ${billedArea.toFixed(2)} m²`,
      formula: 'ceil(ancho/2) × largo × 2 × ₡6.500',
      quantity: Number(billedArea.toFixed(2)),
      unitPrice: PRICE_PER_M2,
      total,
      iva: 0.13
    }
  ];

  return {
    result: {
      width,
      height: length,
      sheetWidth: ROLL_WIDTH_M,
      numSheets: strips,
      cutWidth: 0,
      materials,
      subtotal: total,
      tax: 0,
      total,
      roundingValue: 0
    },
    meta: {
      area,
      strips,
      linearMeters,
      billedArea,
      total
    }
  };
}
