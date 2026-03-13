import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FolderOpen, Plus, Printer, Save, Search, X } from 'lucide-react';
import ProformaPreview, { ProformaData } from './ProformaPreview';
import { catalogProducts } from '../data/catalog';
import { Material } from '../types/calculator';
import { generateGlobalNumber, StoredQuote } from '../services/quoteStoreService';
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
  quoteNumber: string,
  billingLines: ProformaData['lines'],
  initialQuote?: BillingPageProps['initialQuote'],
  loadedDrafts: StoredQuote[] = []
): ProformaData => {
  if (loadedDrafts.length) {
    return {
      quoteNumber,
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

  return {
    quoteNumber,
    date: new Date().toLocaleDateString('es-CR'),
    clientName: clientData.clientName,
    clientId: clientData.clientId,
    clientAddress: clientData.clientAddress,
    phone: clientData.phone,
    deliveryNote: initialQuote
      ? `${product.toUpperCase()} · ${initialQuote.width.toFixed(2)}m x ${initialQuote.height.toFixed(2)}m`
      : 'Entrega sujeta a coordinación con bodega',
    lines: billingLines,
    bankAccounts: [
      { label: 'Banco', value: 'Cuenta N/A' },
      { label: 'SINPE', value: 'N/A' }
    ],
    warranty: 'Garantía sujeta al producto y condiciones comerciales vigentes.'
  };
};

export default function BillingPage({ logoUrl, initialQuote, onSaveQuote, availableDrafts = [] }: BillingPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<BillingProduct>(initialQuote?.category ?? 'policarbonato');
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteNumber, setQuoteNumber] = useState<string>(initialQuote?.quoteNumber ?? 'Cliente N/A');
  const [billingLines, setBillingLines] = useState<ProformaData['lines']>(() => {
    if (!initialQuote?.materials?.length) return [];
    return initialQuote.materials.map((line, index) => ({
      id: line.id || `initial-line-${index}`,
      description: line.name,
      details: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPct: 0
    }));
  });
  const previewRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!initialQuote) return;
    setSelectedProduct(initialQuote.category);
    setQuoteNumber(initialQuote.quoteNumber ?? 'Cliente N/A');
    setBillingLines(
      initialQuote.materials.map((line, index) => ({
        id: line.id || `initial-line-${index}`,
        description: line.name,
        details: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPct: 0
      }))
    );
  }, [initialQuote]);

  const moduleProducts = useMemo(() => catalogProducts.filter((item) => item.categoria === selectedProduct), [selectedProduct]);
  const filteredProducts = useMemo(
    () => moduleProducts.filter((item) => `${item.nombre} ${item.descripcion}`.toLowerCase().includes(searchTerm.toLowerCase().trim())),
    [moduleProducts, searchTerm]
  );

  const ensureQuoteNumber = (): string => {
    if (quoteNumber !== 'Cliente N/A') return quoteNumber;
    const generated = generateGlobalNumber('quote');
    setQuoteNumber(generated);
    return generated;
  };

  const selectedProforma = useMemo(
    () => buildProforma(selectedProduct, clientData, quoteNumber, billingLines, initialQuote, loadedDrafts),
    [selectedProduct, clientData, quoteNumber, billingLines, initialQuote, loadedDrafts]
  );

  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    const activeQuoteNumber = ensureQuoteNumber();
    const html2canvas = await ensureHtml2Canvas();
    const jsPDF = await ensureJsPdf();
    const canvas = await html2canvas(previewRef.current, {
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
    const renderedW = canvas.width * ratio;
    const renderedH = canvas.height * ratio;
    const x = (pageWidth - renderedW) / 2;
    const y = 6;
    pdf.addImage(imageData, 'PNG', x, y, renderedW, renderedH, undefined, 'FAST');
    pdf.save(`${activeQuoteNumber}.pdf`);
  };

  return (
    <div className="space-y-4 px-6 py-6">
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase text-[#00011a]">Facturación</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProductPicker(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#00011a] text-white hover:bg-[#11143a]"
              title="Agregar línea"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const activeQuoteNumber = ensureQuoteNumber();
                if (!onSaveQuote) return;
                onSaveQuote({
                  category: selectedProduct,
                  width: initialQuote?.width ?? 0,
                  height: initialQuote?.height ?? 0,
                  materials: selectedProforma.lines.map((line, index) => ({
                    id: line.id ?? `line-${index}`,
                    name: line.description,
                    description: line.details,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                    total: line.quantity * line.unitPrice,
                    iva: 0.13
                  })),
                  clientName: clientData.clientName,
                  phone: clientData.phone
                });
                setQuoteNumber(activeQuoteNumber);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500 text-cyan-700"
              title="Guardar cotización"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowDraftSelector((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700"
              title="Cargar borradores"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <button
              onClick={() => void handleExportPdf()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700"
              title="Descargar PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700"
              title="Imprimir"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showDraftSelector && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowDraftSelector(false)}>
            <div className="max-h-[70vh] w-full rounded-t-3xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold uppercase text-slate-700">Borradores guardados</p>
                <button onClick={() => setShowDraftSelector(false)} className="rounded-md border border-slate-200 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {availableDrafts.length === 0 ? <p className="text-sm text-slate-500">No hay borradores disponibles.</p> : (
                <div className="grid gap-2 pb-4 md:grid-cols-2">
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
              )}
            </div>
          </div>
        )}

        {showProductPicker && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowProductPicker(false)}>
            <div className="max-h-[70vh] w-full overflow-auto rounded-t-3xl bg-white p-4" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
              <p className="mb-3 text-sm font-bold uppercase text-slate-700">Productos de {selectedProduct.toUpperCase()}</p>
              <div className="grid gap-2 pb-4 md:grid-cols-2">
                {filteredProducts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setBillingLines((prev) => [
                        ...prev,
                        {
                          id: `${item.id}-${Date.now()}`,
                          description: item.nombre,
                          details: `${item.descripcion} · ${item.tamano}`,
                          quantity: 1,
                          unitPrice: item.precio,
                          discountPct: 0
                        }
                      ]);
                      setShowProductPicker(false);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-800">{item.nombre}</p>
                    <p className="text-xs text-slate-500">{item.descripcion} · {item.tamano}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selector anterior convertido en push-up */}

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
          <input
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            placeholder="Buscar producto para agregar línea..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-slate-100 px-6 py-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Vista previa de proforma (PDF)</h3>
          <span className="rounded-full bg-[#00011a] px-3 py-1 text-[10px] font-bold uppercase text-white">Vista previa</span>
        </div>

        <div ref={previewRef} className="overflow-auto rounded-lg border border-slate-200 bg-slate-200 p-4">
          <ProformaPreview logoUrl={logoUrl} data={selectedProforma} />
        </div>
      </section>
    </div>
  );
}
