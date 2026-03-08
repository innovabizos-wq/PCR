import assert from 'node:assert/strict';
import { calculateQuote } from '../utils/calculations';
import { calculatePvcQuote } from '../utils/pvcCalculations';
import { calculateWpcQuote } from '../utils/wpcCalculations';
import { calculateZacateQuote } from '../utils/zacateCalculations';
import { calculateProformaTotals } from '../domain/quotes/proformaTotals';
import { getQuoteCounterScope, nextQuoteConsecutive } from '../domain/quotes/quoteNumbering';

const runCase = (name: string, callback: () => void): void => {
  try {
    callback();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
};

runCase('policarbonato calcula IVA y totales consistentes', () => {
  const result = calculateQuote(3.5, 2.4, 0, 'PCR');
  assert.equal(result.numSheets, 2);
  assert.equal(result.totalBeforeRounding, result.subtotal + result.tax);
  assert.equal(result.tax, Math.round(result.subtotal * 0.13));
  assert.ok(result.total > result.subtotal);
});

runCase('PVC calcula piezas y bordes según perímetro', () => {
  const quote = calculatePvcQuote(2, 2, true);
  assert.equal(quote.meta.pieces, 25);
  assert.equal(quote.meta.borders, 16);
  assert.equal(quote.meta.corners, 4);
  assert.equal(quote.result.total, quote.meta.total);
});

runCase('WPC respeta orientación y produce piezas ajustadas', () => {
  const quote = calculateWpcQuote(2.4, 2.9, {
    panelType: 'interior',
    useRecuts: true,
    minRecutCm: 15,
    slopedWall: false,
    topWidth: 0,
    installVertical: true,
    frontSpecific: false
  });

  assert.equal(quote.meta.orientation, 'vertical');
  assert.ok(quote.meta.adjustedPieces >= quote.meta.basePieces);
  assert.equal(quote.result.numSheets, quote.meta.adjustedPieces);
});

runCase('zacate factura en múltiplos del ancho de rollo', () => {
  const quote = calculateZacateQuote(3, 2.5);
  assert.equal(quote.meta.strips, 2);
  assert.equal(quote.meta.billedArea, 12);
  assert.equal(quote.result.total, quote.meta.total);
});

runCase('proforma aplica descuento e IVA con redondeo monetario', () => {
  const totals = calculateProformaTotals([
    { quantity: 3, unitPrice: 1000, discountPct: 10 },
    { quantity: 1, unitPrice: 499.99 }
  ]);

  assert.equal(totals.subtotal, 3499.99);
  assert.equal(totals.discountTotal, 300);
  assert.equal(totals.netSubtotal, 3199.99);
  assert.equal(totals.iva, 416);
  assert.equal(totals.total, 3615.99);
});

runCase('numeración separa consecutivos por empresa y categoría', () => {
  const scopeA = getQuoteCounterScope('policarbonato', 'oz');
  const scopeB = getQuoteCounterScope('wpc', 'oz');
  const scopeC = getQuoteCounterScope('policarbonato', 'pt');

  assert.notEqual(scopeA, scopeB);
  assert.notEqual(scopeA, scopeC);
  assert.equal(nextQuoteConsecutive(0, 'policarbonato'), 'P-0001');
  assert.equal(nextQuoteConsecutive(9, 'wpc'), 'W-0010');
  assert.equal(nextQuoteConsecutive(99, 'zacate'), 'Z-0100');
});

console.log('Business core tests passed.');
