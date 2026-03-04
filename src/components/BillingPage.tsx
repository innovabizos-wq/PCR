import { Plus, Search } from 'lucide-react';
import ProformaPreview, { ProformaData } from './ProformaPreview';

interface BillingPageProps {
  logoUrl: string;
}

const sampleProforma: ProformaData = {
  quoteNumber: 'PF-2026-0001',
  date: '09/02/2026',
  clientName: 'Cliente Genérico - Mostrador',
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
    },
    {
      id: 'l2',
      description: 'Perfil base y tapa 5.8m bronce',
      details: 'Incluye accesorios de fijación',
      quantity: 1,
      unitPrice: 11048,
      discountPct: 0
    }
  ]
};

export default function BillingPage({ logoUrl }: BillingPageProps) {
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

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Nombre cliente" defaultValue={sampleProforma.clientName} />
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Identificación" defaultValue={sampleProforma.clientId} />
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Teléfono" defaultValue={sampleProforma.phone} />
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
          <ProformaPreview logoUrl={logoUrl} data={sampleProforma} />
        </div>
      </section>
    </div>
  );
}
