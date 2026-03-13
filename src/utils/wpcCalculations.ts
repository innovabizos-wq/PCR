import { CalculationResult, Material } from '../types/calculator';

export type WpcPanelType = 'interior' | 'exterior' | 'coextruido';

export interface WpcCalculationOptions {
  panelType: WpcPanelType;
  useRecuts: boolean;
  minRecutCm: number;
  slopedWall: boolean;
  topWidth: number;
  installVertical: boolean;
  frontSpecific: boolean;
}

export interface WpcCalculationMeta {
  wallArea: number;
  effectiveWidth: number;
  rows: number;
  piecesPerRow: number;
  basePieces: number;
  adjustedPieces: number;
  total: number;
  orientation: 'vertical' | 'horizontal';
}

const PANEL_HEIGHT_M = 2.9;

const WPC_PANEL_CONFIG: Record<WpcPanelType, { width: number; unitPrice: number; label: string }> = {
  interior: { width: 0.16, unitPrice: 3990, label: 'Panel WPC interior 16cm x 2.90m' },
  exterior: { width: 0.22, unitPrice: 9990, label: 'Panel WPC exterior 22cm x 2.90m' },
  coextruido: { width: 0.22, unitPrice: 14000, label: 'Panel WPC coextruido 22cm x 2.90m' }
};

export function calculateWpcQuote(widthInput: number, heightInput: number, options: WpcCalculationOptions): { result: CalculationResult; meta: WpcCalculationMeta } {
  const width = Number(widthInput);
  const height = Number(heightInput);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Medidas inválidas para WPC');
  }

  const config = WPC_PANEL_CONFIG[options.panelType];
  const topWidth = options.slopedWall ? Math.max(0.01, Number(options.topWidth) || 0.01) : width;
  const effectiveWidth = options.slopedWall ? (width + topWidth) / 2 : width;
  const wallArea = effectiveWidth * height;

  const pieceCoverage = PANEL_HEIGHT_M * config.width;
  const basePieces = Math.ceil(wallArea / pieceCoverage);

  const installVertical = options.installVertical;
  const rows = installVertical
    ? Math.ceil(effectiveWidth / config.width)
    : Math.ceil(height / config.width);
  const piecesPerRow = installVertical
    ? Math.max(1, Math.ceil(height / PANEL_HEIGHT_M))
    : Math.max(1, Math.ceil(effectiveWidth / PANEL_HEIGHT_M));
  const minimumPiecesByRows = rows * piecesPerRow;
  let adjustedPieces = Math.max(basePieces, minimumPiecesByRows);

  if (installVertical && height < PANEL_HEIGHT_M) {
    adjustedPieces = Math.max(adjustedPieces, rows);
  }

  if (options.useRecuts) {
    const runLength = installVertical ? height : effectiveWidth;
    const leftoverPerRow = Math.max(0, piecesPerRow * PANEL_HEIGHT_M - runLength);
    const recutThreshold = options.minRecutCm / 100;
    if (leftoverPerRow >= recutThreshold) {
      const recoveredPieces = Math.floor((leftoverPerRow * rows) / PANEL_HEIGHT_M);
      adjustedPieces = Math.max(basePieces, minimumPiecesByRows - recoveredPieces);
    }
  }

  if (options.frontSpecific) {
    adjustedPieces += Math.ceil(adjustedPieces * 0.08);
  }

  if (options.slopedWall) {
    adjustedPieces += Math.ceil(rows * 0.1);
  }

  const total = adjustedPieces * config.unitPrice;

  const materials: Material[] = [
    {
      id: 'wpc-panels',
      name: config.label,
      description: `Área muro ${wallArea.toFixed(2)} m² · cobertura por pieza ${(pieceCoverage).toFixed(3)} m² · instalación ${installVertical ? 'vertical' : 'horizontal'}`,
      formula: 'área/cobertura por pieza + ajustes técnicos',
      quantity: adjustedPieces,
      unitPrice: config.unitPrice,
      total,
      iva: 0
    }
  ];

  return {
    result: {
      width,
      height,
      sheetWidth: config.width,
      numSheets: adjustedPieces,
      cutWidth: 0,
      materials,
      subtotal: total,
      tax: 0,
      total,
      roundingValue: 0
    },
    meta: {
      wallArea,
      effectiveWidth,
      rows,
      piecesPerRow,
      basePieces,
      adjustedPieces,
      total,
      orientation: installVertical ? 'vertical' : 'horizontal'
    }
  };
}
