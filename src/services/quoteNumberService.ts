import { supabase } from '../lib/supabase';
import { CalculationResult, Material } from '../types/calculator';

export type QuoteCategory = 'policarbonato' | 'wpc' | 'zacate';

const QUOTE_PREFIX: Record<QuoteCategory, string> = {
  policarbonato: 'P',
  wpc: 'W',
  zacate: 'Z'
};

const FALLBACK_COUNTER_KEY = 'pcr_quote_counter';

const mapCategoryFromSheetType = (sheetType: string): QuoteCategory => {
  if (sheetType === 'wpc') return 'wpc';
  if (sheetType === 'zacate') return 'zacate';
  return 'policarbonato';
};

const getFallbackConsecutive = (category: QuoteCategory): string => {
  const raw = localStorage.getItem(FALLBACK_COUNTER_KEY);
  const data = raw ? (JSON.parse(raw) as Record<QuoteCategory, number>) : { policarbonato: 0, wpc: 0, zacate: 0 };
  const next = (data[category] ?? 0) + 1;
  data[category] = next;
  localStorage.setItem(FALLBACK_COUNTER_KEY, JSON.stringify(data));
  return `${QUOTE_PREFIX[category]}-${String(next).padStart(4, '0')}`;
};

interface RegisterQuoteInput {
  result: CalculationResult;
  materials: Material[];
  sheetType: string;
  sheetThickness: string;
  sheetColor: string;
}

export async function generateAndStoreQuoteNumber(input: RegisterQuoteInput): Promise<string> {
  const category = mapCategoryFromSheetType(input.sheetType);

  if (!supabase) {
    return getFallbackConsecutive(category);
  }

  const { data, error } = await supabase.rpc('next_quote_number', {
    p_category: category
  });

  if (error || !data || typeof data !== 'string') {
    console.warn('No se pudo usar RPC next_quote_number, usando fallback local.', error);
    return getFallbackConsecutive(category);
  }

  const quoteNumber = data;

  const { error: insertError } = await supabase.from('quotes').insert({
    quote_number: quoteNumber,
    client_name: 'Cliente de mostrador',
    client_email: '',
    width: input.result.width,
    height: input.result.height,
    sheet_type: input.sheetType,
    sheet_thickness: input.sheetThickness,
    sheet_color: input.sheetColor,
    num_sheets: input.result.numSheets,
    materials: input.materials,
    subtotal: input.result.subtotal,
    tax: input.result.tax,
    total: input.result.total,
    rounding_amount: input.result.roundingValue,
    status: 'pdf_generado',
    notes: `Cotización PDF descargada - categoría ${category}`
  });

  if (insertError) {
    console.error('Error guardando cotización con consecutivo:', insertError);
  }

  return quoteNumber;
}
