import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ProformaPreview, { ProformaData } from './ProformaPreview';
import { catalogProducts } from '../data/catalog';

interface BillingPageProps {
  logoUrl: string;
}

type BillingProduct = 'policarbonato' | 'pvc' | 'wpc' | 'zacate';

const buildProforma = (product: BillingProduct): ProformaData => {
  const mainItem = catalogProducts.find((item) => item.categoria === product) ?? catalogProducts[0];

  return {
    quoteNumber: `PF-2026-${product.slice(0, 3).toUpperCase()}01`,
    date: '09/02/2026',
    clientName: 'Cliente genérico',
    clientId: '1-1234-5678',
    clientAddress: 'San José, Costa Rica',
    phone: '+506 8888-8888',
    deliveryNote: 'Entrega sujeta a coordinación con bodega',
    lines: [
      {
        id: 'l1',
        description: mainItem.nombre,
        details: `${mainItem.descripcion} · ${mainItem.tamano} · ${mainItem.garantia}`,
        quantity: 1,
        unitPrice: mainItem.precio,
        discountPct: 0
      }
    ],
    bankAccounts: mainItem.cuentasPago.map((account) => {
      const [label, ...rest] = account.split(' ');
      return { label, value: rest.join(' ') };
    }),
    warranty: mainItem.garantia
  };
};

export default function BillingPage({ logoUrl }: BillingPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct>('policarbonato');
  const selectedProforma = useMemo(() => buildProforma(selectedProduct), [selectedProduct]);

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
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value as BillingProduct)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-slate-700">
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
