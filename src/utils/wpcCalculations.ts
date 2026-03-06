import { getCatalogPrice } from '../data/catalog';
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
  interior: { width: 0.16, unitPrice: getCatalogPrice('wpc-interior', 3990), label: 'Panel WPC interior 16cm x 2.90m' },
  exterior: { width: 0.22, unitPrice: getCatalogPrice('wpc-exterior', 9990), label: 'Panel WPC exterior 22cm x 2.90m' },
  coextruido: { width: 0.22, unitPrice: getCatalogPrice('wpc-coextruido', 14000), label: 'Panel WPC coextruido 22cm x 2.90m' }
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

  const cutRest = PANEL_HEIGHT_M - (height % PANEL_HEIGHT_M || PANEL_HEIGHT_M);
  if (options.useRecuts && cutRest > 0 && cutRest < (options.minRecutCm / 100)) {
    adjustedPieces += Math.ceil(rows * 0.15);
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
      iva: 0.13
    },
    {
      id: 'wpc-base',
      name: 'Base matemática de piezas',
      description: 'Sin ajustes técnicos de instalación',
      formula: `ceil(${wallArea.toFixed(2)} / ${pieceCoverage.toFixed(3)})`,
      quantity: basePieces,
      unitPrice: 0,
      total: 0,
      iva: 0.13
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
