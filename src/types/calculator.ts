export type SheetBrand = 'KLAR' | 'PCR';
export type SheetThickness = '8mm' | '10mm';
export type SheetColor = 'transparente' | 'bronce' | 'azul' | 'gris' | 'blanco' | 'humo';

export interface Material {
  id: string;
  name: string;
  description?: string;
  formula?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  iva?: number;
  discount?: number | null;
}

export interface CalculationResult {
  width: number;
  height: number;
  sheetWidth: number;
  numSheets: number;
  cutWidth: number;
  materials: Material[];
  subtotal: number;
  tax: number;
  total: number;
  roundingValue: number;
}

export interface Quote {
  id?: string;
  quote_number: string;
  client_name: string;
  client_email: string;
  width: number;
  height: number;
  sheet_type: string;
  sheet_thickness: string;
  sheet_color: string;
  num_sheets: number;
  materials: Material[];
  subtotal: number;
  tax: number;
  total: number;
  rounding_amount: number;
  created_at?: string;
  updated_at?: string;
  status: string;
  notes: string;
}
