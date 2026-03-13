import { useMemo, useRef, useState } from 'react';
import { FileDown, FolderOpen, Plus, Printer, Save, Search, X } from 'lucide-react';
import ProformaPreview, { ProformaData, ProformaLine } from './ProformaPreview';
import { CatalogProduct, catalogProducts } from '../data/catalog';
import { Material } from '../types/calculator';
import { StoredQuote, generateGlobalNumber } from '../services/quoteStoreService';
import { ensureHtml2Canvas, ensureJsPdf } from '../features/app/services/exportService';

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
    quoteNumber?: string;
  }) => string;
  availableDrafts?: StoredQuote[];
}

type BillingProduct = 'policarbonato' | 'pvc' | 'wpc' | 'zacate';

interface ClientFormState {
  clientName: string;
  clientId: string;
  phone: string;
  clientAddress: string;
}

const MODULE_LABELS: Record<BillingProduct, string> = {
  policarbonato: 'Policarbonato',
  pvc: 'Piso PVC',
  wpc: 'Tablilla WPC',
  zacate: 'Zacate artificial'
};

const toProformaLine = (line: Material, index: number): ProformaLine => ({
  id: line.id || `line-${index}`,
  description: line.name,
  details: line.description,
  quantity: line.quantity,
  unitPrice: line.unitPrice,
  discountPct: 0
});

const buildProductOptions = (product: BillingProduct): CatalogProduct[] => {
  const byCategory = catalogProducts.filter((item) => item.categoria === product);

  const accessoryMatcher: Record<BillingProduct, (item: CatalogProduct) => boolean> = {
    policarbonato: (item) => item.id.startsWith('pc-'),
    pvc: (item) => item.id.startsWith('pvc-'),
    wpc: (item) => item.id.startsWith('wpc-'),
    zacate: (item) => item.id.startsWith('zacate-')
  };

  const accessories = catalogProducts.filter((item) => item.categoria === 'accesorio' && accessoryMatcher[product](item));
  return [...byCategory, ...accessories];
};

export default function BillingPage({ logoUrl, initialQuote, onSaveQuote, availableDrafts = [] }: BillingPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct>(initialQuote?.category ?? 'policarbonato');
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [showDraftDrawer, setShowDraftDrawer] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [clientData, setClientData] = useState<ClientFormState>({
    clientName: 'Cliente',
    clientId: 'Cliente N/A',
    phone: 'Cliente N/A',
    clientAddress: 'Cliente N/A'
  });
  const [quoteNumber, setQuoteNumber] = useState(initialQuote?.quoteNumber ?? 'N/A');
  const [manualLines, setManualLines] = useState<ProformaLine[]>(
    initialQuote?.materials?.length ? initialQuote.materials.map(toProformaLine) : []
  );
  const proformaRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => buildProductOptions(selectedProduct), [selectedProduct]);
  const loadedDrafts = useMemo(
    () => availableDrafts.filter((draft) => selectedDraftIds.includes(draft.id)),
    [availableDrafts, selectedDraftIds]
  );

  const lines = useMemo(() => {
    if (loadedDrafts.length) {
      return loadedDrafts.flatMap((draft) =>
        draft.materials.map((line, index) => ({
          id: `${draft.id}-${index}`,
          description: line.name,
          details: `${draft.number} · ${line.description ?? ''}`,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPct: 0
        }))
      );
    }

    return manualLines;
  }, [loadedDrafts, manualLines]);

  const selectedProforma = useMemo<ProformaData>(
    () => ({
      quoteNumber,
      date: new Date().toLocaleDateString('es-CR'),
      clientName: clientData.clientName,
      clientId: clientData.clientId,
      clientAddress: clientData.clientAddress,
      phone: clientData.phone,
      deliveryNote: loadedDrafts.length
        ? `Combinación de ${loadedDrafts.length} borradores`
        : `${MODULE_LABELS[selectedProduct]} · medidas ${(initialQuote?.width ?? 0).toFixed(2)}m x ${(initialQuote?.height ?? 0).toFixed(2)}m`,
      lines,
      bankAccounts: [
        { label: 'Banco', value: 'Cuenta N/A' },
        { label: 'SINPE', value: 'N/A' }
      ],
      warranty: 'Garantía sujeta al producto y condiciones comerciales vigentes.'
    }),
    [clientData, initialQuote?.height, initialQuote?.width, lines, loadedDrafts.length, quoteNumber, selectedProduct]
  );

  const resolveQuoteNumber = (): string => {
    if (quoteNumber !== 'N/A') return quoteNumber;
    const next = generateGlobalNumber('quote');
    setQuoteNumber(next);
    return next;
  };

  const handleSaveQuote = () => {
    if (!onSaveQuote) return;
    const nextNumber = resolveQuoteNumber();
    onSaveQuote({
      category: selectedProduct,
      width: initialQuote?.width ?? 0,
      height: initialQuote?.height ?? 0,
      materials: lines.map((line) => ({
        id: line.id,
        name: line.description,
        description: line.details,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.quantity * line.unitPrice,
        iva: 0,
        discount: line.discountPct ?? 0
      })),
      clientName: clientData.clientName,
      phone: clientData.phone,
      quoteNumber: nextNumber
    });
  };

  const handleDownloadPdf = async () => {
    if (!proformaRef.current) return;
    const nextNumber = resolveQuoteNumber();
    const html2canvas = await ensureHtml2Canvas();
    const jsPDF = await ensureJsPdf();
    const canvas = await html2canvas(proformaRef.current, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: '#ffffff'
    });
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imageWidth = canvas.width * ratio;
    const imageHeight = canvas.height * ratio;
    const marginX = (pageWidth - imageWidth) / 2;
    pdf.addImage(imageData, 'PNG', marginX, 8, imageWidth, imageHeight, undefined, 'FAST');
    pdf.save(`${nextNumber}.pdf`);
  };

  return (
    <div className="space-y-4 px-6 py-6">
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase text-[#00011a]">Facturación</h2>
          <div className="flex gap-2">
            <button title="Agregar línea" onClick={() => setShowProductPicker(true)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
              <Plus className="h-5 w-5" />
            </button>
            <button title="Guardar cotización" onClick={handleSaveQuote} className="rounded-lg border border-cyan-500 p-2 text-cyan-700 hover:bg-cyan-50">
              <Save className="h-5 w-5" />
            </button>
            <button title="Descargar PDF" onClick={handleDownloadPdf} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
              <FileDown className="h-5 w-5" />
            </button>
            <button title="Imprimir" onClick={() => window.print()} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
              <Printer className="h-5 w-5" />
            </button>
            <button title="Cargar borradores" onClick={() => setShowDraftDrawer(true)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
              <FolderOpen className="h-5 w-5" />
            </button>
          </div>
        </div>

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

        <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-200 p-4" ref={proformaRef}>
          <ProformaPreview logoUrl={logoUrl} data={selectedProforma} />
        </div>
      </section>

      {showProductPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowProductPicker(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Productos disponibles · {MODULE_LABELS[selectedProduct]}</h3>
              <button className="rounded-lg border border-slate-200 p-1" onClick={() => setShowProductPicker(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setManualLines((prev) => ([
                      ...prev,
                      {
                        id: `${product.id}-${Date.now()}`,
                        description: product.nombre,
                        details: `${product.descripcion} · ${product.tamano}`,
                        quantity: 1,
                        unitPrice: product.precio,
                        discountPct: 0
                      }
                    ]));
                    setShowProductPicker(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold text-slate-800">{product.nombre}</span>
                  <span className="text-sm text-slate-600">₡{product.precio.toLocaleString('es-CR')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDraftDrawer && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowDraftDrawer(false)}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-slate-700">Borradores guardados</h3>
              <button onClick={() => setShowDraftDrawer(false)} className="rounded-lg border border-slate-200 p-1"><X className="h-4 w-4" /></button>
            </div>
            {availableDrafts.length === 0 ? (
              <p className="text-sm text-slate-500">No hay borradores guardados.</p>
            ) : (
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
                      }}
                    />
                    <span>{draft.number} · {draft.module} · ₡{draft.total.toLocaleString('es-CR')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
