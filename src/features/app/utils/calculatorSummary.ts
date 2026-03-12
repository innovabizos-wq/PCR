import { Material } from '../../../types/calculator';
import { MaterialModule } from '../types';

interface PanelBreakdown {
  aLabel: string;
  aValue: number;
  bLabel: string;
  bValue: number;
}

const materialLineTotal = (material: Material): number => {
  const qty = material.quantity ?? 0;
  const unit = material.unitPrice ?? 0;
  const iva = material.iva ?? 0;
  const discountPct = Math.min(100, Math.max(0, material.discount ?? 0));
  return Math.max(0, qty * unit * (1 + iva) * (1 - discountPct / 100));
};

export const getMaterialLineTotal = materialLineTotal;

export const getPanelBreakdown = (activeModule: MaterialModule, displayMaterials: Material[]): PanelBreakdown => {
  if (!displayMaterials.length) {
    return { aLabel: 'Material principal', aValue: 0, bLabel: 'Complementos', bValue: 0 };
  }

  if (activeModule === 'pvc') {
    return {
      aLabel: 'Piso PVC',
      aValue: displayMaterials.filter((m) => m.id.startsWith('pvc-floor')).reduce((sum, m) => sum + materialLineTotal(m), 0),
      bLabel: 'Bordes y Esquineros',
      bValue: displayMaterials
        .filter((m) => m.id === 'pvc-borders' || m.id === 'pvc-corners')
        .reduce((sum, m) => sum + materialLineTotal(m), 0)
    };
  }

  if (activeModule === 'zacate') {
    return {
      aLabel: 'Zacate sintético 35mm',
      aValue: materialLineTotal(displayMaterials.find((m) => m.id === 'zacate-35mm') ?? { id: '', name: '', quantity: 0, unitPrice: 0, total: 0 }),
      bLabel: 'Área facturada',
      bValue: 0
    };
  }

  if (activeModule === 'wpc') {
    return {
      aLabel: 'Paneles WPC',
      aValue: displayMaterials
        .filter((m) => m.id.startsWith('wpc-panel'))
        .reduce((sum, m) => sum + materialLineTotal(m), 0),
      bLabel: 'Perfilería',
      bValue: displayMaterials
        .filter((m) => !m.id.startsWith('wpc-panel'))
        .reduce((sum, m) => sum + materialLineTotal(m), 0)
    };
  }

  return {
    aLabel: 'Láminas',
    aValue: displayMaterials[0] ? materialLineTotal(displayMaterials[0]) : 0,
    bLabel: 'Accesorios',
    bValue: displayMaterials.slice(1).reduce((sum, m) => sum + materialLineTotal(m), 0)
  };
};
