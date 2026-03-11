import { CalculationResult, Material } from '../types/calculator';
import { generateGlobalNumber, saveStoredQuote } from './quoteStoreService';

interface RegisterQuoteInput {
  result: CalculationResult;
  materials: Material[];
  sheetType: string;
  sheetThickness: string;
  sheetColor: string;
}

export async function generateAndStoreQuoteNumber(input: RegisterQuoteInput): Promise<string> {
  const quoteNumber = generateGlobalNumber('quote');

  saveStoredQuote({
    number: quoteNumber,
    kind: 'quote',
    module: input.sheetType,
    width: input.result.width,
    height: input.result.height,
    total: input.result.total,
    materials: input.materials
  });

  return quoteNumber;
}
