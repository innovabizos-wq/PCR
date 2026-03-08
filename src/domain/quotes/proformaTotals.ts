export interface ProformaLineInput {
  quantity: number;
  unitPrice: number;
  discountPct?: number;
}

export interface ProformaTotals {
  subtotal: number;
  discountTotal: number;
  netSubtotal: number;
  iva: number;
  total: number;
}

export const IVA_RATE = 0.13;

const roundToCurrency = (value: number): number => Math.round(value * 100) / 100;

export function calculateProformaTotals(lines: ProformaLineInput[]): ProformaTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discountTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice * ((line.discountPct ?? 0) / 100),
    0
  );
  const netSubtotal = subtotal - discountTotal;
  const iva = netSubtotal * IVA_RATE;
  const total = netSubtotal + iva;

  return {
    subtotal: roundToCurrency(subtotal),
    discountTotal: roundToCurrency(discountTotal),
    netSubtotal: roundToCurrency(netSubtotal),
    iva: roundToCurrency(iva),
    total: roundToCurrency(total)
  };
}
