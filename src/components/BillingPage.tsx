import { useMemo, useState } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';
import ProformaPreview, { ProformaData } from './ProformaPreview';
import { catalogProducts } from '../data/catalog';
import { Material } from '../types/calculator';
import { StoredQuote } from '../services/quoteStoreService';

interface BillingPageProps {
  logoUrl: string;
  initialQuote?: {
    category: BillingProduct;
    width: number;
    height: number;
    materials: Material[];
    quoteNumber?: string;
  } | null;
  onSaveQuote?: (quote: {
    category: BillingProduct;
    width: number;
    height: number;
    materials: Material[];
    clientName: string;
    phone: string;
  }) => void;
  availableDrafts?: StoredQuote[];
}

type BillingProduct = 'policarbonato' | 'pvc' | 'wpc' | 'zacate';

interface ClientFormState {
  clientName: string;
  clientId: string;
  phone: string;
  clientAddress: string;
}

const buildProforma = (
  product: BillingProduct,
  clientData: ClientFormState,
  initialQuote?: BillingPageProps['initialQuote'],
  loadedDrafts: StoredQuote[] = []
): ProformaData => {
  const mainItem = catalogProducts.find((item) => item.categoria === product) ?? catalogProducts[0];

  if (loadedDrafts.length) {
    return {
      quoteNumber: initialQuote?.quoteNumber ?? 'Cliente N/A',
      date: new Date().toLocaleDateString('es-CR'),
      clientName: clientData.clientName,
      clientId: clientData.clientId,
      clientAddress: clientData.clientAddress,
      phone: clientData.phone,
      deliveryNote: `Combinación de ${loadedDrafts.length} borradores`,
      lines: loadedDrafts.flatMap((draft) =>
        draft.materials.map((line, index) => ({
          id: `${draft.id}-${index}`,
          description: line.name,
          details: `${draft.number} · ${line.description ?? ''}`,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPct: 0
        }))
      ),
      bankAccounts: [
        { label: 'Banco', value: 'Cuenta N/A' },
        { label: 'SINPE', value: 'N/A' }
      ],
      warranty: 'Garantía sujeta al producto y condiciones comerciales vigentes.'
    };
  }

  if (initialQuote && initialQuote.materials.length) {
    return {
      quoteNumber: initialQuote.quoteNumber ?? 'Cliente N/A',
      date: new Date().toLocaleDateString('es-CR'),
      clientName: clientData.clientName,
      clientId: clientData.clientId,
      clientAddress: clientData.clientAddress,
      phone: clientData.phone,
      deliveryNote: `${product.toUpperCase()} · ${initialQuote.width.toFixed(2)}m x ${initialQuote.height.toFixed(2)}m`,
      lines: initialQuote.materials.map((line, index) => ({
        id: line.id || `line-${index}`,
        description: line.name,
        details: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPct: 0
      })),
      bankAccounts: [
        { label: 'Banco', value: 'Cuenta N/A' },
        { label: 'SINPE', value: 'N/A' }
      ],
      warranty: 'Garantía sujeta al producto y condiciones comerciales vigentes.'
    };
  }

  return {
    quoteNumber: 'Cliente N/A',
    date: new Date().toLocaleDateString('es-CR'),
    clientName: clientData.clientName,
    clientId: clientData.clientId,
    clientAddress: clientData.clientAddress,
    phone: clientData.phone,
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
    bankAccounts: [
      { label: 'Banco', value: 'Cuenta N/A' },
      { label: 'SINPE', value: 'N/A' }
    ],
    warranty: mainItem.garantia
  };
};

export default function BillingPage({ logoUrl, initialQuote, onSaveQuote, availableDrafts = [] }: BillingPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct>(initialQuote?.category ?? 'policarbonato');
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [clientData, setClientData] = useState<ClientFormState>({
    clientName: initialQuote ? 'Cliente' : 'Cliente',
    clientId: 'Cliente N/A',
    phone: 'Cliente N/A',
    clientAddress: 'Cliente N/A'
  });

  const loadedDrafts = useMemo(
    () => availableDrafts.filter((draft) => selectedDraftIds.includes(draft.id)),
    [availableDrafts, selectedDraftIds]
  );

  const selectedProforma = useMemo(
    () => buildProforma(selectedProduct, clientData, initialQuote, loadedDrafts),
    [selectedProduct, clientData, initialQuote, loadedDrafts]
  );

  return (
    <div className="space-y-4 px-6 py-6">
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase text-[#00011a]">Facturación</h2>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#00011a] px-4 py-2 text-sm font-bold text-white hover:bg-[#11143a]">
              <Plus className="h-4 w-4" />
              Agregar línea
            </button>
            <button
              onClick={() => {
                if (!initialQuote || !onSaveQuote) return;
                onSaveQuote({
                  ...initialQuote,
                  clientName: clientData.clientName,
                  phone: clientData.phone
                });
              }}
              className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-bold text-cyan-700"
            >
              Guardar cotización
            </button>
            <button
              onClick={() => setShowDraftSelector((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
            >
              Cargar borradores
              <ChevronDown className={`h-4 w-4 transition-transform ${showDraftSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showDraftSelector && availableDrafts.length > 0 && (
          <div className="mb-4 rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-slate-600">Borradores disponibles</p>
            <div className="grid gap-2 md:grid-cols-2">
              {availableDrafts.map((draft) => (
                <label key={draft.id} className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDraftIds.includes(draft.id)}
                    onChange={(e) => {
                      setSelectedDraftIds((prev) =>
                        e.target.checked ? [...prev, draft.id] : prev.filter((id) => id !== draft.id)
                      );
                      if (e.target.checked) {
                        setClientData((prev) => ({
                          ...prev,
                          clientName: draft.clientName ?? prev.clientName,
                          phone: draft.phone ?? prev.phone
                        }));
                      }
                    }}
                  />
                  <span>{draft.number} · {draft.module} · ₡{draft.total.toLocaleString('es-CR')}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Nombre cliente"
            value={clientData.clientName}
            onChange={(e) => setClientData((prev) => ({ ...prev, clientName: e.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Identificación"
            value={clientData.clientId}
            onChange={(e) => setClientData((prev) => ({ ...prev, clientId: e.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Teléfono"
            value={clientData.phone}
            onChange={(e) => setClientData((prev) => ({ ...prev, phone: e.target.value }))}
          />
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
