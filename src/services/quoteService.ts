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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateQuoteInput(input: SaveQuoteInput): void {
  const name = input.clientName.trim();
  if (!name) {
    throw new Error('El nombre del cliente es requerido');
  }

  const email = (input.clientEmail ?? '').trim();
  if (email && !EMAIL_REGEX.test(email)) {
    throw new Error('El correo electrónico no tiene un formato válido');
  }
}

export async function saveQuote(input: SaveQuoteInput): Promise<void> {
  validateQuoteInput(input);

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
    client_name: input.clientName.trim(),
    client_email: (input.clientEmail ?? '').trim(),
    width: input.result.width,
    height: input.result.height,
    sheet_type: input.sheetType,
    sheet_thickness: input.sheetThickness,
    sheet_color: input.sheetColor,
    num_sheets: input.result.numSheets,
    materials: input.result.materials,
    subtotal: input.result.subtotal,
    tax: input.result.tax,
    total: input.result.total,
    rounding_amount: input.result.roundingValue,
    status: 'draft',
    notes: (input.notes ?? '').trim(),
    created_by: authData.user.id,
    company_id: input.companyId ?? DEFAULT_COMPANY_ID
  });

  if (insertError) throw insertError;
}
