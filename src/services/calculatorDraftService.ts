import { CalculationResult, Material } from '../types/calculator';

const DRAFT_KEY = 'pcr.calculator.draft.v1';

export interface CalculatorDraft {
  activeModule: 'pvc' | 'policarbonato' | 'zacate' | 'wpc';
  widthInput: string;
  heightInput: string;
  includeBorders: boolean;
  brand: string;
  thickness: string;
  polyColor: string;
  pvcColor: string;
  wpcType: string;
  wpcUseRecuts: boolean;
  wpcVerticalInstall: boolean;
  wpcTone: string;
  zacateHeight: string;
  result: CalculationResult | null;
  editedMaterials: Material[] | null;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

export const loadCalculatorDraft = (): CalculatorDraft | null => {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CalculatorDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveCalculatorDraft = (draft: CalculatorDraft): void => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignorar errores de persistencia local.
  }
};

export const clearCalculatorDraft = (): void => {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignorar errores de persistencia local.
  }
};
