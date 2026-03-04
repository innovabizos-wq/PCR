import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ProformaPreview, { ProformaData } from './ProformaPreview';

interface BillingPageProps {
  logoUrl: string;
}

type BillingProduct = 'policarbonato' | 'pvc' | 'wpc' | 'zacate';

const proformaByProduct: Record<BillingProduct, ProformaData> = {
  policarbonato: {
    quoteNumber: 'PF-2026-0001',
    date: '09/02/2026',
    clientName: 'Cliente genérico',
    clientId: '1-1234-5678',
    clientAddress: 'Escazú, San José',
    phone: '+506 8888-8888',
    deliveryNote: 'Retira en bodega principal',
    lines: [
      {
        id: 'l1',
        description: 'Lámina de policarbonato 2.10 x 5.80 bronce',
        details: 'Garantía decoloración 10 años',
        quantity: 1,
        unitPrice: 59200,
        discountPct: 0
      }
    ],
    bankAccounts: [
      { label: 'Banco Nacional', value: '100-01-123-456789' },
      { label: 'Banco de San José', value: '200-02-987-654321' },
      { label: 'SINPE Móvil', value: '+506 8888-8888' }
    ],
    warranty: 'Garantía de fábrica hasta 10 años por decoloración (aplican condiciones de instalación).'
  },
  pvc: {
    quoteNumber: 'PF-2026-0002',
    date: '09/02/2026',
    clientName: 'Cliente genérico',
    clientId: '3-101-778899',
    clientAddress: 'Heredia Centro',
    phone: '+506 8777-6666',
    deliveryNote: 'Entrega en sitio con previa coordinación',
    lines: [
      {
        id: 'l1',
        description: 'Piso PVC 40x40 color rojo',
        details: 'Incluye empaque estándar',
        quantity: 24,
        unitPrice: 2000,
        discountPct: 0
      }
    ],
    bankAccounts: [
      { label: 'BAC Credomatic', value: '911-000-456123' },
      { label: 'SINPE Comercial', value: '+506 8111-2233' }
    ],
    warranty: 'Garantía de 12 meses por defectos de fabricación (no cubre mala instalación o desgaste por uso).'
  },
  wpc: {
    quoteNumber: 'PF-2026-0003',
    date: '09/02/2026',
    clientName: 'Cliente genérico',
    clientId: '2-445-990011',
    clientAddress: 'Alajuela, Desamparados',
    phone: '+506 8999-1111',
    deliveryNote: 'Entrega en bodega secundaria',
    lines: [
      {
        id: 'l1',
        description: 'Tablilla WPC interior color teca',
        details: 'Instalación vertical recomendada',
        quantity: 30,
        unitPrice: 7500,
        discountPct: 0
      }
    ],
    bankAccounts: [
      { label: 'Scotiabank', value: '777-12-909090' },
      { label: 'SINPE Móvil', value: '+506 8000-0909' }
    ],
    warranty: 'Garantía de 2 años contra deformación por defecto de fábrica; requiere mantenimiento preventivo.'
  },
  zacate: {
    quoteNumber: 'PF-2026-0004',
    date: '09/02/2026',
    clientName: 'Cliente genérico',
    clientId: '1-1900-2200',
    clientAddress: 'Cartago, El Guarco',
    phone: '+506 8444-2222',
    deliveryNote: 'Instalación programada en horario laboral',
    lines: [
      {
        id: 'l1',
        description: 'Zacate sintético 35mm',
        details: 'Incluye unión y pegamento base',
        quantity: 18,
        unitPrice: 9500,
        discountPct: 0
      }
    ],
    bankAccounts: [
      { label: 'Banco Popular', value: '321-44-555777' },
      { label: 'SINPE Empresarial', value: '+506 8222-1212' }
    ],
    warranty: 'Garantía de 18 meses por desprendimiento prematuro en condiciones normales de uso.'
  }
};

export default function BillingPage({ logoUrl }: BillingPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct>('policarbonato');
  const selectedProforma = useMemo(() => proformaByProduct[selectedProduct], [selectedProduct]);

  return (
    <div className="space-y-4 px-6 py-6">
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase text-[#00011a]">Facturación</h2>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#00011a] px-4 py-2 text-sm font-bold text-white hover:bg-[#11143a]">
            <Plus className="h-4 w-4" />
            Agregar línea
          </button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Nombre cliente" defaultValue="Cliente genérico" />
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Identificación" defaultValue={selectedProforma.clientId} />
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Teléfono" defaultValue={selectedProforma.phone} />
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value as BillingProduct)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-slate-700"
          >
            <option value="policarbonato">Policarbonato</option>
            <option value="pvc">Piso PVC</option>
            <option value="wpc">Tablilla WPC</option>
            <option value="zacate">Zacate artificial</option>
          </select>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm" placeholder="Buscar producto para proforma..." />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-slate-100 px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Vista previa de proforma (PDF)</h3>
          <span className="rounded-full bg-[#00011a] px-3 py-1 text-[10px] font-bold uppercase text-white">Vista previa</span>
        </div>

        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-200 p-4">
          <ProformaPreview logoUrl={logoUrl} data={selectedProforma} />
        </div>
      </section>
    </div>
  );
}
