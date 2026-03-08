import { Material } from '../../types/calculator';

export type MaterialModule = 'pvc' | 'policarbonato' | 'zacate' | 'wpc';
export type MainPage = 'calculator' | 'billing' | 'inventory' | 'dispatch' | 'admin';
export type WpcTone = 'teca' | 'nogal' | 'grafito';
export type ZacateHeight = '35mm' | '50mm';
export type EmployeeStatus = 'activo' | 'almuerzo' | 'cafe' | 'baño' | 'logout';

export interface BillingDraft {
  category: 'policarbonato' | 'pvc' | 'wpc' | 'zacate';
  width: number;
  height: number;
  materials: Material[];
  quoteNumber?: string;
}
