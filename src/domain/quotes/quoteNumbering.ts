import { CompanyId } from '../../types/company';

export type QuoteCategory = 'policarbonato' | 'wpc' | 'zacate';

const QUOTE_PREFIX: Record<QuoteCategory, string> = {
  policarbonato: 'P',
  wpc: 'W',
  zacate: 'Z'
};

export const getQuoteCounterScope = (category: QuoteCategory, companyId: CompanyId): string => `${companyId}:${category}`;

export const nextQuoteConsecutive = (counter: number, category: QuoteCategory): string =>
  `${QUOTE_PREFIX[category]}-${String(counter + 1).padStart(4, '0')}`;

export const mapCategoryFromSheetType = (sheetType: string): QuoteCategory => {
  if (sheetType === 'wpc') return 'wpc';
  if (sheetType === 'zacate') return 'zacate';
  return 'policarbonato';
};
