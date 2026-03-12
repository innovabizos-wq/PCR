import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  CircleUserRound,
  Coffee,
  FileText,
  LayoutDashboard,
  Truck,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import ToastStack, { ToastItem } from '../../components/feedback/ToastStack';
import { ProformaData } from '../../components/ProformaPreview';
import { CalculationResult, Material, SheetBrand, SheetColor, SheetThickness } from '../../types/calculator';
import { calculateQuote, formatCurrency } from '../../utils/calculations';
import { calculatePvcQuote, pvcPalette, PvcColor } from '../../utils/pvcCalculations';
import { calculateZacateQuote } from '../../utils/zacateCalculations';
import { calculateWpcQuote, WpcPanelType } from '../../utils/wpcCalculations';
import { generateAndStoreQuoteNumber } from '../../services/quoteNumberService';
import { generateGlobalNumber, listStoredByKind, saveStoredQuote } from '../../services/quoteStoreService';
import { getInventoryProducts } from '../../services/inventoryService';
import { toUserMessage } from '../../utils/appError';
import { trackEvent } from '../../services/telemetryService';
import { useAuth } from '../auth/AuthProvider';
import { useCompany } from '../company/CompanyContext';
import BillingWorkspaceView from './views/BillingWorkspaceView';
import CalculatorWorkspaceView from './views/CalculatorWorkspaceView';
import CalculatorSummaryPanel from './views/CalculatorSummaryPanel';
import { calculatorModuleCards } from './views/calculatorModuleCards';
import { ensureHtml2Canvas, ensureJsPdf } from './services/exportService';
import { getMaterialLineTotal, getPanelBreakdown } from './utils/calculatorSummary';
import { BillingDraft, EmployeeStatus, MainPage, MaterialModule, ZacateHeight } from './types';
import { WPC_TEXTURES, WPC_TONES_BY_TYPE, WpcTone } from './wpcConfig';

const parseMetric = (raw: string): number => {
  const sanitized = raw.replace(',', '.').trim();
  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(1000, Math.max(0, parsed));
};

const STATUS_META: Record<EmployeeStatus, { label: string; tone: string }> = {
  activo: { label: 'Activo', tone: 'bg-emerald-100 text-emerald-700' },
  almuerzo: { label: 'Almuerzo', tone: 'bg-amber-100 text-amber-700' },
  cafe: { label: 'Café', tone: 'bg-orange-100 text-orange-700' },
  baño: { label: 'Baño', tone: 'bg-cyan-100 text-cyan-700' },
  logout: { label: 'Desconectado', tone: 'bg-gray-200 text-gray-700' }
};

const toAssetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

const DEFAULT_POLY_TEXTURES: Record<SheetColor, string> = {
  transparente: toAssetUrl('textures/transparente.png'),
  bronce: toAssetUrl('textures/BRONCE.png'),
  azul: toAssetUrl('textures/azul.png'),
  gris: toAssetUrl('textures/gris.png'),
  blanco: toAssetUrl('textures/blanco.png'),
  humo: toAssetUrl('textures/Humo.png')
};


export default function AppWorkspace() {
  const [activePage, setActivePage] = useState<MainPage>('calculator');
  const [activeModule, setActiveModule] = useState<MaterialModule>('pvc');
  const [widthInput, setWidthInput] = useState('0');
  const [heightInput, setHeightInput] = useState('0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [editedMaterials, setEditedMaterials] = useState<Material[] | null>(null);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [billingDraft, setBillingDraft] = useState<BillingDraft | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { logout, can } = useAuth();
  const { activeCompanyId } = useCompany();

  const [polyColor, setPolyColor] = useState<SheetColor>('blanco');
  const [polyTextures, setPolyTextures] = useState<Record<SheetColor, string>>(DEFAULT_POLY_TEXTURES);
  const [brand, setBrand] = useState<SheetBrand>('KLAR');
  const [thickness, setThickness] = useState<SheetThickness>('8mm');

  const [pvcColor, setPvcColor] = useState<PvcColor>('rojo');
  const [includeBorders, setIncludeBorders] = useState(false);

  const [wpcType, setWpcType] = useState<WpcPanelType>('interior');
  const [wpcUseRecuts, setWpcUseRecuts] = useState(true);
  const [wpcVerticalInstall, setWpcVerticalInstall] = useState(true);
  const [wpcTone, setWpcTone] = useState<WpcTone>('negro');

  const [zacateHeight, setZacateHeight] = useState<ZacateHeight>('35mm');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('activo');

  const centerInnerRef = useRef<HTMLDivElement | null>(null);
  const customVisualizerRef = useRef<HTMLElement | null>(null);
  const proformaExportRef = useRef<HTMLDivElement | null>(null);
  const [centerInnerWidth, setCenterInnerWidth] = useState(1100);

  const width = parseMetric(widthInput);
  const height = parseMetric(heightInput);

  const isPoly = activeModule === 'policarbonato';
  const isPvc = activeModule === 'pvc';
  const isZacate = activeModule === 'zacate';
  const isWpc = activeModule === 'wpc';
  const isBillingPage = activePage === 'billing';
  const isInventoryPage = activePage === 'inventory';
  const isCalculatorPage = activePage === 'calculator';
  const isDispatchPage = activePage === 'dispatch';
  const isAdminPage = activePage === 'admin' && can('admin', 'ver');

  const pushToast = (tone: ToastItem['tone'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3500);
  };


  useEffect(() => {
    trackEvent('page.view', { page: activePage, module: activeModule });
  }, [activeModule, activePage]);

  useLayoutEffect(() => {
    if (!centerInnerRef.current) return;
    const el = centerInnerRef.current;
    setCenterInnerWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCenterInnerWidth(Math.round(entry.contentRect.width || el.clientWidth));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const calculatePolyResults = (): CalculationResult => {
    const calculation = calculateQuote(width, height, 0, brand);
    const materials: Material[] = calculation.materials.map((item) => ({
      id: item.id ?? `item-${item.item}`,
      name: item.descripcion,
      description: item.description,
      quantity: item.cantidad,
      unitPrice: item.precio_unitario,
      total: item.total,
      iva: 0.13
    }));

    return {
      width: calculation.width,
      height: calculation.height,
      sheetWidth: calculation.sheetWidth,
      numSheets: calculation.numSheets,
      cutWidth: calculation.cutWidth,
      materials,
      subtotal: calculation.subtotal,
      tax: calculation.tax,
      total: calculation.total,
      roundingValue: calculation.roundingValue
    };
  };

  const calculateResults = () => {
    try {
      setError('');
      if (width <= 0 || height <= 0) {
        setEditedMaterials(null);
        setResult(null);
        return;
      }
      if (activeModule === 'policarbonato') {
        setEditedMaterials(null);
        setResult(calculatePolyResults());
        return;
      }
      if (activeModule === 'pvc') {
        setEditedMaterials(null);
        setResult(calculatePvcQuote(width, height, includeBorders).result);
        return;
      }
      if (activeModule === 'zacate') {
        setEditedMaterials(null);
        setResult(calculateZacateQuote(height, width).result);
        return;
      }
      if (activeModule === 'wpc') {
        setEditedMaterials(null);
        setResult(
          calculateWpcQuote(width, height, {
            panelType: wpcType,
            useRecuts: wpcUseRecuts,
            minRecutCm: 15,
            slopedWall: false,
            topWidth: width,
            installVertical: wpcVerticalInstall,
            frontSpecific: false
          }).result
        );
      }
    } catch (err) {
      const msg = toUserMessage(err, 'Error en el cálculo');
      setError(msg);
      pushToast('error', msg);
      setResult(null);
    }
  };


  useEffect(() => {
    const loadTextures = async () => {
      try {
        const inventoryResponse = await getInventoryProducts(activeCompanyId as 'oz' | 'pt' | 'ds');
        const textureRows = inventoryResponse.products.filter((item) => item.categoria === 'textura');
        if (!textureRows.length) return;

        const nextTextures = { ...DEFAULT_POLY_TEXTURES };
        for (const row of textureRows) {
          const key = row.sku.toLowerCase();
          if ((key === 'transparente' || key === 'bronce' || key === 'azul' || key === 'gris' || key === 'blanco' || key === 'humo') && row.estiloFoto) {
            nextTextures[key as SheetColor] = row.estiloFoto;
          }
        }
        setPolyTextures(nextTextures);
      } catch {
        // fallback silencioso a texturas locales
      }
    };

    loadTextures();
  }, [activeCompanyId]);

  useEffect(() => {
    const allowedTones = WPC_TONES_BY_TYPE[wpcType];
    if (!allowedTones.includes(wpcTone)) {
      setWpcTone(allowedTones[0]);
    }
  }, [wpcType, wpcTone]);

  useEffect(() => {
    calculateResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeModule,
    widthInput,
    heightInput,
    brand,
    thickness,
    polyColor,
    pvcColor,
    includeBorders,
    wpcType,
    wpcUseRecuts,
    wpcVerticalInstall,
    wpcTone,
    zacateHeight
  ]);

  // ✅ versión corta (main)
  const displayMaterials = useMemo(() => editedMaterials ?? result?.materials ?? [], [editedMaterials, result]);

  const resolvedSheetType = isPvc ? 'pvc' : isZacate ? 'zacate' : isWpc ? 'wpc' : 'alveolar';
  const resolvedSheetThickness = isPoly ? thickness : 'n/a';
  const resolvedSheetColor = isPoly ? polyColor : isPvc ? pvcColor : isWpc ? wpcTone : zacateHeight;

  const logoUrl = toAssetUrl('logo.png');

  const editedTotal = useMemo(() => {
    if (!displayMaterials.length) return result?.total ?? 0;
    return displayMaterials.reduce((sum, material) => sum + getMaterialLineTotal(material), 0);
  }, [displayMaterials, result]);

  const panelBreakdown = useMemo(() => getPanelBreakdown(activeModule, displayMaterials), [activeModule, displayMaterials]);

  // ✅ BUG FIX: solo una vez
  const roundedEditedTotal = Number.isInteger(editedTotal) ? editedTotal : Math.ceil(editedTotal);


  const allowedPages: MainPage[] = ['calculator', 'billing', 'quotes'];
  const blockedMessage = 'No tienes acceso a esta función, contacta a soporte para acceder a mas funciones.';

  const handlePageNavigation = (page: MainPage) => {
    if (!allowedPages.includes(page)) {
      pushToast('error', blockedMessage);
      return;
    }
    setActivePage(page);
  };

  const shortWhatsAppText = `${activeModule === 'pvc' ? 'cotización de Piso PVC' : activeModule === 'zacate' ? 'cotización de Zacate artificial' : activeModule === 'wpc' ? 'cotización de Tablilla WPC' : 'cotización de Policarbonato'} · medidas ${width.toFixed(2)}m x ${height.toFixed(2)}m · precio ${formatCurrency(editedTotal)}`;

  const [quotesRefreshKey, setQuotesRefreshKey] = useState(0);

  const visualizerWidth = Math.max(320, Math.min(1000, centerInnerWidth - 40));
  const previewAspect = Math.max(0.45, Math.min(1.9, height / Math.max(width, 0.01)));
  const previewHeight = Math.round(Math.max(280, Math.min(560, visualizerWidth * previewAspect * 0.56 + 150)));
  const visualizerFrame = useMemo(() => {
    const maxW = visualizerWidth - 110;
    const maxH = previewHeight - 90;
    const safeW = Math.max(width, 1);
    const safeH = Math.max(height, 1);
    const scale = Math.min(maxW / safeW, maxH / safeH);
    return {
      widthPx: Math.max(60, Math.round(safeW * scale * 0.92)),
      heightPx: Math.max(60, Math.round(safeH * scale * 0.92))
    };
  }, [height, previewHeight, visualizerWidth, width]);

  // Uniones visibles cada 2.10m (escala real)
  const polySeamPositions = useMemo(() => {
    if (!isPoly || width <= 0) return [] as number[];
    const jointSpacing = 2.1; // 2.10m
    const positions: number[] = [];
    for (let mark = jointSpacing; mark < width; mark += jointSpacing) {
      positions.push((mark / width) * 100);
    }
    return positions;
  }, [isPoly, width]);

  const wpcPanelWidthM = wpcType === 'interior' ? 0.16 : 0.22;
  const wpcHorizontal = isWpc && !wpcVerticalInstall;

  const LEFT_WIDTH = 260;
  const RIGHT_PANEL_MAX = 340;

  const proformaData = useMemo<ProformaData>(() => {
    const moduleLabel = isPvc ? 'Piso PVC' : isZacate ? 'Zacate artificial' : isWpc ? 'Tablilla WPC' : 'Policarbonato';
    const rows = displayMaterials.map((material, index) => ({
      id: material.id ?? `line-${index}`,
      description: material.name,
      details: material.description,
      quantity: Number((material.quantity ?? 0).toFixed(2)),
      unitPrice: material.unitPrice ?? 0,
      discountPct: 0
    }));

    return {
      quoteNumber: `PREV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      date: new Date().toLocaleDateString('es-CR'),
      clientName: 'Cliente de mostrador',
      clientId: 'N/D',
      clientAddress: 'Pendiente',
      phone: 'Pendiente',
      deliveryNote: `${moduleLabel} · ${width.toFixed(2)}m x ${height.toFixed(2)}m`,
      lines: rows.length ? rows : [{ id: 'empty', description: 'Sin líneas (ingrese medidas)', quantity: 1, unitPrice: 0 }],
      bankAccounts: [
        { label: 'Banco Nacional', value: '100-01-123-456789' },
        { label: 'SINPE Móvil', value: '+506 8888-8888' }
      ],
      warranty: 'Garantía sujeta al producto, instalación recomendada y condiciones comerciales vigentes.'
    };
  }, [displayMaterials, height, isPvc, isWpc, isZacate, width]);

  const exportPDF = async () => {
    if (!result || !proformaExportRef.current) return;
    try {
      await trackEvent('quote.export_pdf.started', { module: activeModule, page: activePage });
      const quoteNumber = await generateAndStoreQuoteNumber({
        result,
        materials: displayMaterials,
        sheetType: resolvedSheetType,
        sheetThickness: resolvedSheetThickness,
        sheetColor: resolvedSheetColor
      });
      setBillingDraft({
        category: isPvc ? 'pvc' : isZacate ? 'zacate' : isWpc ? 'wpc' : 'policarbonato',
        width: result.width,
        height: result.height,
        materials: displayMaterials,
        quoteNumber
      });

      const html2canvas = await ensureHtml2Canvas();
      const jsPDF = await ensureJsPdf();

      const canvas = await html2canvas(proformaExportRef.current, {
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
      const marginY = 8;
      pdf.addImage(imageData, 'PNG', marginX, marginY, imageWidth, imageHeight, undefined, 'FAST');

      pdf.save(`cotizacion_${quoteNumber}.pdf`);
      await trackEvent('quote.export_pdf.completed', {
        module: activeModule,
        page: activePage,
        metadata: { quoteNumber }
      });
    } catch (err) {
      const msg = toUserMessage(err, 'No se pudo exportar el PDF');
      setError(msg);
      pushToast('error', msg);
      await trackEvent('quote.export_pdf.failed', {
        module: activeModule,
        page: activePage,
        metadata: { message: msg }
      });
    }
  };

  const createDraft = () => {
    if (!result) return;
    const draftNumber = generateGlobalNumber('draft');
    saveStoredQuote({
      number: draftNumber,
      kind: 'draft',
      module: activeModule,
      width: result.width,
      height: result.height,
      total: editedTotal,
      materials: displayMaterials
    });
    pushToast('success', `Borrador ${draftNumber} creado correctamente.`);
    setQuotesRefreshKey((prev) => prev + 1);
  };

  const handleModuleChange = (module: MaterialModule) => {
    setActiveModule(module);
    setWidthInput('0');
    setHeightInput('0');
    setResult(null);
    setEditedMaterials(null);
    setError('');
    if (module === 'pvc') setIncludeBorders(false);
    trackEvent('calculator.module_change', { module, page: activePage });
  };

  const captureCustomVisualizer = async () => {
    const el = customVisualizerRef.current;
    if (!el) return;
    try {
      const html2canvas = await ensureHtml2Canvas();
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: false,
        scale: Math.max(2, window.devicePixelRatio || 1),
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: -window.scrollY
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `visualizador_material_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const msg = toUserMessage(err, 'No se pudo capturar el visualizador');
      setError(msg);
      pushToast('error', msg);
    }
  };

  const activeTexture = isPvc
    ? `repeating-linear-gradient(45deg, rgba(255,255,255,.10) 0 6px, rgba(255,255,255,.03) 6px 12px), linear-gradient(135deg, ${pvcPalette[pvcColor].bg}, ${pvcPalette[pvcColor].border})`
    : isZacate
      ? `
        radial-gradient(circle at 20% 30%, rgba(124,180,72,0.26), transparent 34%),
        radial-gradient(circle at 75% 55%, rgba(92,142,56,0.24), transparent 38%),
        linear-gradient(155deg, rgba(16,56,22,0.58), rgba(56,110,42,0.36)),
        url('${toAssetUrl('textures/zacate-grass.svg')}')`
      : isWpc
        ? `url(${toAssetUrl(WPC_TEXTURES[wpcTone])})`
        : `url(${polyTextures[polyColor]})`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isBillingPage || isInventoryPage || isDispatchPage || isAdminPage
          ? `${LEFT_WIDTH}px minmax(0, 1fr)`
          : `${LEFT_WIDTH}px minmax(0, 1fr) ${RIGHT_PANEL_MAX}px`,
        height: '100vh',
        overflow: 'hidden',
        background: '#f8fafc'
      }}
    >
      <ToastStack items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((item) => item.id !== id))} />
      <aside className="flex h-screen flex-col overflow-hidden border-r border-black/10 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <img src={logoUrl} alt="Policarbonato CR" className="h-8 w-8" />
          <h2 className="text-base font-bold text-[#00011a]">Policarbonato CR</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </a>
          <button
            onClick={() => handlePageNavigation('calculator')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isCalculatorPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calculator className="h-5 w-5" />
            <span className="text-sm font-bold">Calculadora</span>
          </button>
          <button
            onClick={() => handlePageNavigation('billing')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isBillingPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-bold">Facturación</span>
          </button>
          <button
            onClick={() => handlePageNavigation('inventory')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isInventoryPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">Inventario</span>
          </button>
          <button
            onClick={() => handlePageNavigation('dispatch')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isDispatchPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Truck className="h-5 w-5" />
            <span className="text-sm font-medium">Despacho</span>
          </button>
          <button
            onClick={() => handlePageNavigation('admin')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isAdminPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-sm font-medium">Administración</span>
          </button>
          <button
            onClick={() => setActivePage('quotes')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              activePage === 'quotes' ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Cotizaciones</span>
          </button>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Clientes</span>
          </a>
        </nav>
        <div className="m-4 rounded-xl border border-gray-200 p-3">
          <div className="mb-3 flex items-center gap-2">
            <CircleUserRound className="h-8 w-8 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Administrador</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_META[employeeStatus].tone}`}>
                {STATUS_META[employeeStatus].label}
              </span>
            </div>
          </div>
          <select
            value={employeeStatus}
            onChange={(e) => setEmployeeStatus(e.target.value as EmployeeStatus)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700"
          >
            <option value="activo">Activo</option>
            <option value="almuerzo">Almuerzo</option>
            <option value="cafe">Café</option>
            <option value="baño">Baño</option>
            <option value="logout">Logout</option>
          </select>
          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
            <Coffee className="h-4 w-4" />
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      <main
        className="center-scroll"
        style={{
          height: '100vh',
          overflowY: isCalculatorPage || isDispatchPage ? 'auto' : 'hidden',
          overflowX: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          minWidth: 0
        }}
      >
        <div
          ref={centerInnerRef}
          style={{
            width: '100%',
            maxWidth: 1100,
            padding: '0 20px',
            boxSizing: 'border-box',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <header className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-black uppercase text-[#00011a]">
                    {isBillingPage ? 'Facturación y Proformas' : isInventoryPage ? 'Inventario Maestro' : isDispatchPage ? 'Despacho e Instalaciones' : isAdminPage ? 'Panel de Administración' : 'Calculadora Pro v3.2.2'}
                  </h1>
                </div>
              </div>
            </div>
          </header>

          <div className={isCalculatorPage || isDispatchPage ? 'space-y-4 px-6 py-6' : 'h-full overflow-y-auto space-y-4 px-6 py-6'}>
            {isBillingPage ? (
              <BillingWorkspaceView
                logoUrl={logoUrl}
                initialQuote={billingDraft}
                onSaveQuote={(quote) => {
                  const quoteNumber = generateGlobalNumber('quote');
                  saveStoredQuote({
                    number: quoteNumber,
                    kind: 'quote',
                    module: quote.category,
                    width: quote.width,
                    height: quote.height,
                    total: quote.materials.reduce((sum, item) => sum + (item.total ?? item.quantity * item.unitPrice), 0),
                    materials: quote.materials
                  });
                  pushToast('success', `Cotización ${quoteNumber} guardada.`);
                  setQuotesRefreshKey((prev) => prev + 1);
                }}
                availableDrafts={listStoredByKind('draft')}
              />
            ) : activePage === 'quotes' ? (
              <div key={quotesRefreshKey} className="space-y-6"> 
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="mb-3 text-base font-bold text-slate-800">Cotizaciones guardadas</h3>
                  {listStoredByKind('quote').length === 0 ? <p className="text-sm text-slate-500">No hay cotizaciones guardadas.</p> : (
                    <ul className="space-y-2">{listStoredByKind('quote').map((item) => (<li key={item.id} className="rounded border border-slate-200 p-3 text-sm"><strong>{item.number}</strong> · {item.module} · {item.width.toFixed(2)}m x {item.height.toFixed(2)}m · {formatCurrency(item.total)}</li>))}</ul>
                  )}
                </section>
                <section className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="mb-3 text-base font-bold text-slate-800">Borradores</h3>
                  {listStoredByKind('draft').length === 0 ? <p className="text-sm text-slate-500">No hay borradores guardados.</p> : (
                    <ul className="space-y-2">{listStoredByKind('draft').map((item) => (<li key={item.id} className="rounded border border-slate-200 p-3 text-sm"><strong>{item.number}</strong> · {item.module} · {item.width.toFixed(2)}m x {item.height.toFixed(2)}m · {formatCurrency(item.total)}</li>))}</ul>
                  )}
                </section>
              </div>
            ) : isInventoryPage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{blockedMessage}</div>
            ) : isDispatchPage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{blockedMessage}</div>
            ) : isAdminPage ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{blockedMessage}</div>
            ) : (
              <CalculatorWorkspaceView
                moduleCards={calculatorModuleCards}
                activeModule={activeModule}
                handleModuleChange={handleModuleChange}
                widthInput={widthInput}
                setWidthInput={setWidthInput}
                heightInput={heightInput}
                setHeightInput={setHeightInput}
                parseMetric={parseMetric}
                isPvc={isPvc}
                isZacate={isZacate}
                isWpc={isWpc}
                isPoly={isPoly}
                pvcColor={pvcColor}
                setPvcColor={setPvcColor}
                includeBorders={includeBorders}
                setIncludeBorders={setIncludeBorders}
                zacateHeight={zacateHeight}
                setZacateHeight={setZacateHeight}
                wpcType={wpcType}
                setWpcType={setWpcType}
                wpcTone={wpcTone}
                setWpcTone={setWpcTone}
                wpcUseRecuts={wpcUseRecuts}
                setWpcUseRecuts={setWpcUseRecuts}
                wpcVerticalInstall={wpcVerticalInstall}
                setWpcVerticalInstall={setWpcVerticalInstall}
                brand={brand}
                setBrand={setBrand}
                polyColor={polyColor}
                setPolyColor={setPolyColor}
                thickness={thickness}
                setThickness={setThickness}
                customVisualizerRef={customVisualizerRef}
                logoUrl={logoUrl}
                captureCustomVisualizer={captureCustomVisualizer}
                result={result}
                width={width}
                height={height}
                previewHeight={previewHeight}
                visualizerFrame={visualizerFrame}
                activeTexture={activeTexture}
                polyTextures={polyTextures}
                polySeamPositions={polySeamPositions}
                wpcHorizontal={wpcHorizontal}
                wpcPanelWidthM={wpcPanelWidthM}
                error={error}
                setEditedMaterials={setEditedMaterials}
                proformaExportRef={proformaExportRef}
                proformaData={proformaData}
              />
            )}
          </div>
        </div>
      </main>

      {isCalculatorPage && (
        <CalculatorSummaryPanel
          isZacate={isZacate}
          isWpc={isWpc}
          width={width}
          height={height}
          displayMaterials={displayMaterials}
          panelBreakdown={panelBreakdown}
          roundedEditedTotal={roundedEditedTotal}
          resultReady={Boolean(result)}
          onCreateQuote={() => {
            if (!result) return;
            setBillingDraft({
              category: isPvc ? 'pvc' : isZacate ? 'zacate' : isWpc ? 'wpc' : 'policarbonato',
              width: result.width,
              height: result.height,
              materials: displayMaterials,
              quoteNumber: undefined
            });
            handlePageNavigation('billing');
          }}
          onExportPdf={exportPDF}
          shortWhatsAppText={shortWhatsAppText}
          onCreateDraft={createDraft}
        />
      )}
    </div>
  );
}
