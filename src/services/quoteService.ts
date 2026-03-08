import { supabase } from '../lib/supabase';
import { CalculationResult } from '../types/calculator';
import { generateQuoteNumber } from '../utils/calculations';
import { CompanyId } from '../types/company';
import { DEFAULT_COMPANY_ID } from '../domain/company/company';

export interface SaveQuoteInput {
  result: CalculationResult;
  sheetType: string;
  sheetThickness: string;
  sheetColor: string;
  clientName: string;
  clientEmail?: string;
  notes?: string;
  companyId?: CompanyId;
}

interface NormalizedSaveQuoteInput extends SaveQuoteInput {
  clientName: string;
  clientEmail: string;
  notes: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeQuoteInput = (input: SaveQuoteInput): NormalizedSaveQuoteInput => ({
  ...input,
  clientName: input.clientName.trim(),
  clientEmail: (input.clientEmail ?? '').trim(),
  notes: (input.notes ?? '').trim()
});

export function validateQuoteInput(input: SaveQuoteInput): void {
  const normalized = normalizeQuoteInput(input);

  if (!normalized.clientName) {
    throw new Error('El nombre del cliente es requerido');
  }

  if (normalized.clientEmail && !EMAIL_REGEX.test(normalized.clientEmail)) {
    throw new Error('El correo electrónico no tiene un formato válido');
  }
}

export async function saveQuote(input: SaveQuoteInput): Promise<void> {
  validateQuoteInput(input);
  const normalized = normalizeQuoteInput(input);

  if (!supabase) {
    throw new Error('Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) {
    throw new Error('Debes iniciar sesión para guardar cotizaciones.');
  }

  const { error: insertError } = await supabase.from('quotes').insert({
    quote_number: generateQuoteNumber(),
    client_name: normalized.clientName,
    client_email: normalized.clientEmail || null,
    width: normalized.result.width,
    height: normalized.result.height,
    sheet_type: normalized.sheetType,
    sheet_thickness: normalized.sheetThickness,
    sheet_color: normalized.sheetColor,
    num_sheets: normalized.result.numSheets,
    materials: normalized.result.materials,
    subtotal: normalized.result.subtotal,
    tax: normalized.result.tax,
    total: normalized.result.total,
    rounding_amount: normalized.result.roundingValue,
    status: 'draft',
    notes: normalized.notes,
    created_by: authData.user.id,
    company_id: normalized.companyId ?? DEFAULT_COMPANY_ID
  });

  if (insertError) throw insertError;
}
