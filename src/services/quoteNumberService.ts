import { supabase } from '../lib/supabase';
import { CalculationResult, Material } from '../types/calculator';
import { CompanyId } from '../types/company';
import { getQuoteCounterScope, mapCategoryFromSheetType, nextQuoteConsecutive, QuoteCategory } from '../domain/quotes/quoteNumbering';

const FALLBACK_COUNTER_KEY = 'pcr_quote_counter';

const readLocalCounterMap = (): Record<string, number> => {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(FALLBACK_COUNTER_KEY);
  return raw ? (JSON.parse(raw) as Record<string, number>) : {};
};

const writeLocalCounterMap = (counterMap: Record<string, number>): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FALLBACK_COUNTER_KEY, JSON.stringify(counterMap));
};

const getFallbackConsecutive = (category: QuoteCategory, companyId: CompanyId): string => {
  const data = readLocalCounterMap();
  const key = getQuoteCounterScope(category, companyId);
  const current = data[key] ?? 0;
  data[key] = current + 1;
  writeLocalCounterMap(data);
  return nextQuoteConsecutive(current, category);
};

interface RegisterQuoteInput {
  result: CalculationResult;
  materials: Material[];
  sheetType: string;
  sheetThickness: string;
  sheetColor: string;
  companyId: CompanyId;
}

export async function generateAndStoreQuoteNumber(input: RegisterQuoteInput): Promise<string> {
  const category = mapCategoryFromSheetType(input.sheetType);

  if (!supabase) {
    return `${input.companyId}-${getFallbackConsecutive(category, input.companyId)}`;
  }

  const { data, error } = await supabase.rpc('next_quote_number', {
    p_category: category,
    p_company_id: input.companyId
  });

  if (error || !data || typeof data !== 'string') {
    console.warn('No se pudo usar RPC next_quote_number, usando fallback local.', error);
    return `${input.companyId}-${getFallbackConsecutive(category, input.companyId)}`;
  }

  const quoteNumber = `${input.companyId}-${data}`;

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
    status: 'issued',
    notes: `Cotización PDF descargada - categoría ${category}`,
    company_id: input.companyId
  });

  if (insertError) {
    console.error('Error guardando cotización con consecutivo:', insertError);
  }

  return quoteNumber;
}
