import { CalculationResult, Material, SheetColor } from '../types/calculator';

export interface PvcCalculationMeta {
  area: number;
  pieces: number;
  floorTotal: number;
  borders: number;
  corners: number;
  total: number;
}

const PVC_TILE_SIDE_M = 0.4;
const PVC_TILE_UNIT_PRICE = 2000;
const PVC_BORDER_PRICE = 800;
const PVC_CORNER_PRICE = 200;

export function calculatePvcQuote(widthInput: number, heightInput: number, includeBorders: boolean): { result: CalculationResult; meta: PvcCalculationMeta } {
  const width = Number(widthInput);
  const height = Number(heightInput);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Medidas inválidas para piso PVC');
  }

  const area = width * height;
  const pieces = Math.ceil(area * 6.25);

  const floorTotal = pieces * PVC_TILE_UNIT_PRICE;

  const widthPieces = Math.ceil(width / PVC_TILE_SIDE_M);
  const heightPieces = Math.ceil(height / PVC_TILE_SIDE_M);
  const borders = includeBorders ? Math.max(0, (2 * widthPieces) + (2 * heightPieces) - 4) : 0;
  const corners = includeBorders ? 4 : 0;

  const bordersTotal = borders * PVC_BORDER_PRICE;
  const cornersTotal = corners * PVC_CORNER_PRICE;
  const subtotal = floorTotal + bordersTotal + cornersTotal;

  const materials: Material[] = [
    {
      id: 'pvc-floor',
      name: 'Piso PVC 40x40',
      description: `${pieces} piezas para ${area.toFixed(2)} m²`,
      formula: 'piezas × precio unitario',
      quantity: pieces,
      unitPrice: PVC_TILE_UNIT_PRICE,
      total: floorTotal,
      iva: 0
    }
  ];

  if (includeBorders) {
    materials.push(
      {
        id: 'pvc-borders',
        name: 'Bordes PVC',
        description: 'Perímetro en piezas',
        formula: '(2 × largo/0.40) + (2 × ancho/0.40) − 4',
        quantity: borders,
        unitPrice: PVC_BORDER_PRICE,
        total: bordersTotal,
        iva: 0
      },
      {
        id: 'pvc-corners',
        name: 'Esquineros PVC',
        description: '4 unidades fijas cuando incluye bordes',
        formula: '4 unidades',
        quantity: corners,
        unitPrice: PVC_CORNER_PRICE,
        total: cornersTotal,
        iva: 0
      }
    );
  }

  return {
    result: {
      width,
      height,
      sheetWidth: PVC_TILE_SIDE_M,
      numSheets: pieces,
      cutWidth: 0,
      materials,
      subtotal,
      tax: 0,
      total: subtotal,
      roundingValue: 0
    },
    meta: {
      area,
      pieces,
      floorTotal,
      borders,
      corners,
      total: subtotal
    }
  };
}

export const pvcPalette: Record<'rojo' | 'azul' | 'negro' | 'gris' | 'amarillo', { bg: string; border: string }> = {
  rojo: { bg: '#dc2626', border: '#991b1b' },
  azul: { bg: '#2563eb', border: '#1e3a8a' },
  negro: { bg: '#111827', border: '#030712' },
  gris: { bg: '#9ca3af', border: '#4b5563' },
  amarillo: { bg: '#facc15', border: '#ca8a04' }
};

export type PvcColor = keyof typeof pvcPalette;

export const toVisualizerColor = (value: PvcColor): SheetColor => {
  if (value === 'azul') return 'azul';
  if (value === 'negro') return 'humo';
  return 'bronce';
};
