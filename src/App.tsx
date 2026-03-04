import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Camera,
  CircleUserRound,
  Coffee,
  FileDown,
  FileText,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  PanelsTopLeft,
  Save,
  Share2,
  Users,
  Waves
} from 'lucide-react';
import MaterialsTable from './components/MaterialsTable';
import SaveQuoteModal from './components/SaveQuoteModal';
import BillingPage from './components/BillingPage';
import { CalculationResult, Material, SheetBrand, SheetColor, SheetThickness } from './types/calculator';
import { calculateQuote, formatCurrency } from './utils/calculations';
import { calculatePvcQuote, pvcPalette, PvcColor } from './utils/pvcCalculations';
import { calculateZacateQuote } from './utils/zacateCalculations';
import { calculateWpcQuote, WpcPanelType } from './utils/wpcCalculations';

type MaterialModule = 'pvc' | 'policarbonato' | 'zacate' | 'wpc';
type MainPage = 'calculator' | 'billing';
type WpcTone = 'teca' | 'nogal' | 'grafito';
type ZacateHeight = '35mm' | '50mm';
type EmployeeStatus = 'activo' | 'almuerzo' | 'cafe' | 'baño' | 'logout';

type Html2CanvasFn = (
  element: HTMLElement,
  options?: { useCORS?: boolean; allowTaint?: boolean; scale?: number }
) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
  }
}

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

const POLY_TEXTURES: Record<SheetColor, string> = {
  transparente: toAssetUrl('textures/transparente.png'),
  bronce: toAssetUrl('textures/BRONCE.png'),
  azul: toAssetUrl('textures/azul.png'),
  gris: toAssetUrl('textures/gris.png'),
  blanco: toAssetUrl('textures/blanco.png'),
  humo: toAssetUrl('textures/Humo.png')
};

const PVC_COLOR_LABELS: Record<PvcColor, string> = {
  rojo: 'Rojo',
  azul: 'Azul',
  negro: 'Negro',
  gris: 'Gris',
  amarillo: 'Amarillo'
};

interface MetricInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
}

function MetricInput({ label, value, onChange, step = 0.1 }: MetricInputProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => {
          if (document.activeElement !== e.currentTarget) return;
          e.preventDefault();
          const current = parseMetric(value);
          const delta = e.deltaY < 0 ? step : -step;
          const next = Math.max(0, Number((current + delta).toFixed(2)));
          onChange(String(next));
        }}
        className="h-10 w-32 rounded-lg border border-gray-300 px-3 text-sm font-bold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
        placeholder="0.00"
      />
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState<MainPage>('calculator');
  const [activeModule, setActiveModule] = useState<MaterialModule>('pvc');
  const [widthInput, setWidthInput] = useState('0');
  const [heightInput, setHeightInput] = useState('0');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [editedMaterials, setEditedMaterials] = useState<Material[] | null>(null);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [polyColor, setPolyColor] = useState<SheetColor>('blanco');
  const [brand, setBrand] = useState<SheetBrand>('KLAR');
  const [thickness, setThickness] = useState<SheetThickness>('8mm');

  const [pvcColor, setPvcColor] = useState<PvcColor>('rojo');
  const [includeBorders, setIncludeBorders] = useState(false);
  const [pvcTileColors, setPvcTileColors] = useState<PvcColor[]>([]);
  const [pvcTilePicker, setPvcTilePicker] = useState<{ index: number; x: number; y: number } | null>(null);

  const [wpcType, setWpcType] = useState<WpcPanelType>('interior');
  const [wpcUseRecuts, setWpcUseRecuts] = useState(true);
  const [wpcVerticalInstall, setWpcVerticalInstall] = useState(true);
  const [wpcTone, setWpcTone] = useState<WpcTone>('teca');

  const [zacateHeight, setZacateHeight] = useState<ZacateHeight>('35mm');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('activo');

  const centerInnerRef = useRef<HTMLDivElement | null>(null);
  const customVisualizerRef = useRef<HTMLDivElement | null>(null);
  const [centerInnerWidth, setCenterInnerWidth] = useState(1100);

  const width = parseMetric(widthInput);
  const height = parseMetric(heightInput);

  const isPoly = activeModule === 'policarbonato';
  const isPvc = activeModule === 'pvc';
  const isZacate = activeModule === 'zacate';
  const isWpc = activeModule === 'wpc';
  const isBillingPage = activePage === 'billing';

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
      setError(err instanceof Error ? err.message : 'Error en el cálculo');
      setResult(null);
    }
  };

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

  useEffect(() => {
    if (!isPvc || width <= 0 || height <= 0) {
      setPvcTileColors([]);
      setPvcTilePicker(null);
      return;
    }

    const neededTiles = Math.max(1, Math.ceil(width / 0.4) * Math.ceil(height / 0.4));
    setPvcTileColors((prev) => Array.from({ length: neededTiles }, (_, i) => prev[i] ?? pvcColor));
  }, [isPvc, pvcColor, width, height]);

  useEffect(() => {
    if (!pvcTilePicker) return;
    const closePicker = () => setPvcTilePicker(null);
    window.addEventListener('click', closePicker);
    return () => window.removeEventListener('click', closePicker);
  }, [pvcTilePicker]);

  const pvcDesignedMaterials = useMemo(() => {
    if (!isPvc || !result) return null;
    const floorRow = result.materials.find((m) => m.id === 'pvc-floor');
    if (!floorRow) return null;

    const qtyByColor = pvcTileColors.reduce<Record<PvcColor, number>>(
      (acc, color) => {
        acc[color] += 1;
        return acc;
      },
      { rojo: 0, azul: 0, negro: 0, gris: 0, amarillo: 0 }
    );

    const floorRows: Material[] = (Object.keys(qtyByColor) as PvcColor[])
      .filter((color) => qtyByColor[color] > 0)
      .map((color) => ({
        ...floorRow,
        id: `pvc-floor-${color}`,
        name: `Piso PVC 40x40 · ${PVC_COLOR_LABELS[color]}`,
        description: `${qtyByColor[color]} piezas`,
        quantity: qtyByColor[color],
        total: qtyByColor[color] * floorRow.unitPrice
      }));

    const accessoryRows = result.materials.filter((m) => m.id !== 'pvc-floor');
    return [...floorRows, ...accessoryRows];
  }, [isPvc, pvcTileColors, result]);

  const displayMaterials = useMemo(() => {
    if (isPvc) return pvcDesignedMaterials ?? editedMaterials ?? result?.materials ?? [];
    return editedMaterials ?? result?.materials ?? [];
  }, [editedMaterials, isPvc, pvcDesignedMaterials, result]);
  const materialLineTotal = (material: Material): number => {
    const qty = material.quantity ?? 0;
    const unit = material.unitPrice ?? 0;
    const iva = material.iva ?? 0;
    const discount = Math.max(0, material.discount ?? 0);
    return Math.max(0, qty * unit * (1 + iva) - discount);
  };

  const resolvedSheetType = isPvc ? 'pvc' : isZacate ? 'zacate' : isWpc ? 'wpc' : 'alveolar';
  const resolvedSheetThickness = isPoly ? thickness : 'n/a';
  const resolvedSheetColor = isPoly ? polyColor : isPvc ? pvcColor : isWpc ? wpcTone : zacateHeight;
  const logoUrl = toAssetUrl('logo.png');

  const editedTotal = useMemo(() => {
    if (!displayMaterials.length) return result?.total ?? 0;
    return displayMaterials.reduce((sum, material) => sum + materialLineTotal(material), 0);
  }, [displayMaterials, result]);
  const roundedEditedTotal = Number.isInteger(editedTotal) ? editedTotal : Math.ceil(editedTotal);

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
  const pvcCols = Math.max(1, Math.ceil(width / 0.4));
  const pvcRows = Math.max(1, Math.ceil(height / 0.4));

  const LEFT_WIDTH = 260;
  const RIGHT_PANEL_MAX = 340;

  const panelBreakdown = useMemo(() => {
    const currentMaterials = displayMaterials;
    if (!currentMaterials.length) {
      return { aLabel: 'Material principal', aValue: 0, bLabel: 'Complementos', bValue: 0 };
    }
    if (activeModule === 'pvc') {
      return {
        aLabel: 'Piso PVC',
        aValue: currentMaterials
          .filter((m) => m.id.startsWith('pvc-floor'))
          .reduce((sum, m) => sum + materialLineTotal(m), 0),
        bLabel: 'Bordes y Esquineros',
        bValue: currentMaterials
          .filter((m) => m.id === 'pvc-borders' || m.id === 'pvc-corners')
          .reduce((sum, m) => sum + materialLineTotal(m), 0)
      };
    }
    if (activeModule === 'zacate') {
      return {
        aLabel: 'Zacate sintético 35mm',
        aValue: materialLineTotal(
          currentMaterials.find((m) => m.id === 'zacate-35mm') ?? { id: '', name: '', quantity: 0, unitPrice: 0, total: 0 }
        ),
        bLabel: 'Área facturada',
        bValue: 0
      };
    }
    if (activeModule === 'wpc') {
      return {
        aLabel: 'Paneles WPC',
        aValue: materialLineTotal(
          currentMaterials.find((m) => m.id === 'wpc-panels') ?? { id: '', name: '', quantity: 0, unitPrice: 0, total: 0 }
        ),
        bLabel: 'Base matemática',
        bValue: 0
      };
    }
    return {
      aLabel: 'Láminas',
      aValue: currentMaterials[0] ? materialLineTotal(currentMaterials[0]) : 0,
      bLabel: 'Accesorios',
      bValue: currentMaterials.slice(1).reduce((sum, m) => sum + materialLineTotal(m), 0)
    };
  }, [activeModule, displayMaterials]);

  const exportPDF = () => alert('Función de exportar PDF en desarrollo');

  const shareWhatsApp = () => {
    const title = isPvc ? 'Piso PVC' : isZacate ? 'Zacate' : isWpc ? 'Tablilla WPC' : 'Policarbonato';
    const message = `Cotización ${title}\n\nDimensiones: ${height}m x ${width}m\nTotal: ${formatCurrency(editedTotal)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleModuleChange = (module: MaterialModule) => {
    setActiveModule(module);
    setWidthInput('0');
    setHeightInput('0');
    setResult(null);
    setEditedMaterials(null);
    setError('');
    if (module === 'pvc') setIncludeBorders(false);
  };

  const captureCustomVisualizer = async () => {
    const el = customVisualizerRef.current;
    if (!el) return;
    if (typeof window.html2canvas === 'undefined') {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
        document.head.appendChild(script);
      });
    }
    const html2canvas = window.html2canvas;
    if (!html2canvas) return;
    const canvas = await html2canvas(el, { useCORS: true, allowTaint: true, scale: 2 });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visualizador_material_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, 'image/png', 1);
  };

  const moduleCards = [
    {
      id: 'pvc' as MaterialModule,
      label: 'Piso PVC',
      icon: (
        <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
          <rect x="5" y="5" width="38" height="38" rx="7" stroke="currentColor" strokeWidth="2" />
          <path d="M5 24h38M24 5v38M13 13h8v8h-8zM27 27h8v8h-8z" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    },
    { id: 'zacate' as MaterialModule, label: 'Zacate Artificial', icon: <Leaf className="h-7 w-7" /> },
    { id: 'wpc' as MaterialModule, label: 'Tablilla WPC', icon: <PanelsTopLeft className="h-7 w-7" /> },
    { id: 'policarbonato' as MaterialModule, label: 'Policarbonato', icon: <Waves className="h-7 w-7" /> }
  ];

  const surfaceTexture =
    'radial-gradient(circle at 1px 1px, rgba(56,189,248,.20) 1.2px, transparent 1.2px), linear-gradient(155deg, #030712, #020617 55%, #000814)';

  const activeTexture = isPvc
    ? `repeating-linear-gradient(45deg, rgba(255,255,255,.10) 0 6px, rgba(255,255,255,.03) 6px 12px), linear-gradient(135deg, ${pvcPalette[pvcColor].bg}, ${pvcPalette[pvcColor].border})`
    : isZacate
      ? `
        radial-gradient(circle at 20% 30%, rgba(124,180,72,0.26), transparent 34%),
        radial-gradient(circle at 75% 55%, rgba(92,142,56,0.24), transparent 38%),
        linear-gradient(155deg, rgba(16,56,22,0.58), rgba(56,110,42,0.36)),
        url('/textures/zacate-grass.svg')`
      : isWpc
        ? `linear-gradient(160deg, ${wpcTone === 'nogal' ? '#6b4423' : wpcTone === 'grafito' ? '#4b5563' : '#b67946'}, #2f2418)`
        : `url(${POLY_TEXTURES[polyColor]})`;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isBillingPage ? `${LEFT_WIDTH}px minmax(0, 1fr)` : `${LEFT_WIDTH}px minmax(0, 1fr) ${RIGHT_PANEL_MAX}px`,
        height: '100vh',
        overflow: 'hidden',
        background: '#f8fafc'
      }}
    >
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
            onClick={() => setActivePage('calculator')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              !isBillingPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calculator className="h-5 w-5" />
            <span className="text-sm font-bold">Calculadora</span>
          </button>
          <button
            onClick={() => setActivePage('billing')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
              isBillingPage ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-sm font-bold">Facturación</span>
          </button>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">Inventario</span>
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Cotizaciones</span>
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Clientes</span>
          </a>
        </nav>
        <div className="m-4 rounded-xl border border-gray-200 p-3">
          <div className="mb-3 flex items-center gap-2">
            <CircleUserRound className="h-8 w-8 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Laura Gómez</p>
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
          <div className="mt-2 flex items-center justify-end gap-2 text-xs text-gray-500">
            <Coffee className="h-4 w-4" />
            <LogOut className="h-4 w-4" />
          </div>
        </div>
      </aside>

      <main
        className="center-scroll"
        style={{
          height: '100vh',
          overflowY: 'auto',
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
                  <h1 className="text-xl font-black uppercase text-[#00011a]">Calculadora Pro v3.2.2</h1>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-4 px-6 py-6">
            {isBillingPage ? (
              <BillingPage logoUrl={logoUrl} />
            ) : (
              <>
            <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">
                  1
                </span>
                Seleccionar material
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {moduleCards.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleModuleChange(item.id)}
                    className={`h-20 rounded-xl border px-2 transition-all ${
                      activeModule === item.id
                        ? 'border-[#00011a] bg-slate-50 text-[#00011a] shadow-sm'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {item.icon}
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section ref={customVisualizerRef} className="rounded-xl border border-gray-200 bg-white px-6 py-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">
                  2
                </span>
                Parámetros del módulo
              </h2>

              <div className="flex flex-wrap items-end gap-4">
                <MetricInput label="Ancho (m)" value={widthInput} onChange={setWidthInput} />
                <MetricInput label="Alto (m)" value={heightInput} onChange={setHeightInput} />

                {isPvc && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Color</label>
                      <select
                        value={pvcColor}
                        onChange={(e) => setPvcColor(e.target.value as PvcColor)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        {Object.keys(pvcPalette).map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                      <input type="checkbox" checked={includeBorders} onChange={(e) => setIncludeBorders(e.target.checked)} />
                      Incluir bordes (manual)
                    </label>
                  </>
                )}

                {isZacate && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Altura de zacate</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setZacateHeight('35mm')}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                          zacateHeight === '35mm'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        35 mm
                      </button>
                      <button
                        disabled
                        className="cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-400"
                      >
                        50 mm · Uso deportivo (agotado)
                      </button>
                    </div>
                  </div>
                )}

                {isWpc && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Tipo panel</label>
                      <select
                        value={wpcType}
                        onChange={(e) => setWpcType(e.target.value as WpcPanelType)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        <option value="interior">Interior</option>
                        <option value="exterior">Exterior</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Acabado</label>
                      <select
                        value={wpcTone}
                        onChange={(e) => setWpcTone(e.target.value as WpcTone)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        <option value="teca">Teca</option>
                        <option value="nogal">Nogal</option>
                        <option value="grafito">Grafito</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                      <input type="checkbox" checked={wpcUseRecuts} onChange={(e) => setWpcUseRecuts(e.target.checked)} />
                      Optimizar con recortes
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={wpcVerticalInstall}
                        onChange={(e) => setWpcVerticalInstall(e.target.checked)}
                      />
                      Instalar vertical (desactivar = horizontal lateral)
                    </label>
                  </>
                )}

                {isPoly && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Marca</label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value as SheetBrand)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        <option value="KLAR">KLAR</option>
                        <option value="PCR">PCR</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Color lámina</label>
                      <select
                        value={polyColor}
                        onChange={(e) => setPolyColor(e.target.value as SheetColor)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        <option value="transparente">Transparente</option>
                        <option value="bronce">Bronce</option>
                        <option value="azul">Azul</option>
                        <option value="gris">Gris</option>
                        <option value="blanco">Blanco</option>
                        <option value="humo">Humo</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Espesor</label>
                      <select
                        value={thickness}
                        onChange={(e) => setThickness(e.target.value as SheetThickness)}
                        className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold"
                      >
                        <option value="8mm">8 mm</option>
                        <option value="10mm">10 mm</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">
                    3
                  </span>
                  Vista previa y captura
                </h2>
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Policarbonato CR" className="h-8" />
                  <button
                    onClick={captureCustomVisualizer}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                    title="Capturar visualizador"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl border border-slate-800/80 p-4 shadow-[0_20px_50px_rgba(2,6,23,0.35)]"
                style={{ backgroundImage: surfaceTexture }}
              >
                {result && (
                  <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-cyan-900/40 bg-slate-900/35 p-2 text-[11px] text-cyan-100 md:grid-cols-4">
                    <div className="rounded-lg bg-slate-950/30 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-cyan-300/80">Ancho real</p>
                      <p className="text-sm font-bold text-white">{width.toFixed(2)} m</p>
                    </div>
                    <div className="rounded-lg bg-slate-950/30 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-cyan-300/80">Alto real</p>
                      <p className="text-sm font-bold text-white">{height.toFixed(2)} m</p>
                    </div>
                    <div className="rounded-lg bg-slate-950/30 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-cyan-300/80">Área</p>
                      <p className="text-sm font-bold text-white">{(width * height).toFixed(2)} m²</p>
                    </div>
                    <div className="rounded-lg bg-slate-950/30 px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-cyan-300/80">Piezas</p>
                      <p className="text-sm font-bold text-white">{result.numSheets}</p>
                    </div>
                  </div>
                )}

                <div
                  className="relative mx-auto w-full max-w-[920px] overflow-hidden rounded-xl border border-cyan-900/50"
                  style={{ height: previewHeight }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(186,230,253,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(186,230,253,0.08) 1px, transparent 1px)',
                      backgroundSize: '32px 32px'
                    }}
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-[56px] right-[56px] top-[44px] border-t border-cyan-100/80"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-[34px] left-[56px] right-[56px] border-t border-dashed border-cyan-100/40"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-[34px] left-[56px] top-[44px] border-l border-cyan-100/80"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-[34px] right-[56px] top-[44px] border-l border-dashed border-cyan-100/40"
                  />

                  <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                    Ancho · {width.toFixed(2)} m
                  </div>
                  <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-cyan-200/90">
                    Escala adaptada al render real ({visualizerFrame.widthPx}px × {visualizerFrame.heightPx}px)
                  </div>
                  <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 rounded-full bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                    Alto · {height.toFixed(2)} m
                  </div>

                  <div
                    aria-hidden
                    className="pointer-events-none absolute left-[56px] top-[44px] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-[56px] top-[44px] h-2 w-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-[34px] left-[56px] h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-100"
                  />

                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: visualizerFrame.widthPx,
                      height: visualizerFrame.heightPx,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {result ? (
                      <div
                        className="relative h-full w-full rounded-lg border border-white/20 shadow-2xl"
                        style={{
                          backgroundImage: activeTexture,
                          backgroundSize: isPoly || isZacate ? 'cover' : 'auto',
                          backgroundPosition: 'center'
                        }}
                      >
                        {isZacate && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(95deg, rgba(14,40,18,0.12) 0 2px, rgba(0,0,0,0) 2px 7px), repeating-linear-gradient(25deg, rgba(190,234,120,0.08) 0 1px, rgba(0,0,0,0) 1px 9px)',
                              mixBlendMode: 'overlay'
                            }}
                          />
                        )}

                        {isPvc && (
                          <div
                            className="grid h-full w-full"
                            style={{
                              gridTemplateColumns: `repeat(${pvcCols}, minmax(0,1fr))`,
                              gridTemplateRows: `repeat(${pvcRows}, minmax(0,1fr))`
                            }}
                          >
                            {Array.from({ length: pvcCols * pvcRows }).map((_, i) => {
                              const tileColor = pvcTileColors[i] ?? pvcColor;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setPvcTilePicker({ index: i, x: e.clientX, y: e.clientY });
                                  }}
                                  className="border border-white/20"
                                  style={{ background: `linear-gradient(135deg, ${pvcPalette[tileColor].bg}, ${pvcPalette[tileColor].border})` }}
                                />
                              );
                            })}
                          </div>
                        )}

                        {isPvc && pvcTilePicker && (
                          <div
                            className="absolute z-20 rounded-lg border border-slate-600 bg-slate-900/95 p-2 shadow-xl"
                            style={{
                              left: Math.max(8, Math.min(pvcTilePicker.x - 120, visualizerFrame.widthPx - 150)),
                              top: Math.max(8, Math.min(pvcTilePicker.y - 240, visualizerFrame.heightPx - 44))
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid grid-cols-5 gap-1">
                              {(Object.keys(pvcPalette) as PvcColor[]).map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  title={PVC_COLOR_LABELS[color] ?? color}
                                  className="h-6 w-6 rounded border border-white/30"
                                  style={{ background: pvcPalette[color].bg }}
                                  onClick={() => {
                                    setPvcTileColors((prev) => {
                                      const next = [...prev];
                                      next[pvcTilePicker.index] = color;
                                      return next;
                                    });
                                    setPvcTilePicker(null);
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {isPoly && (
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url(${POLY_TEXTURES[polyColor]})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              opacity: 0.96
                            }}
                          />
                        )}

                        {isPoly &&
                          polySeamPositions.map((leftPct) => (
                            <div
                              key={leftPct}
                              className="absolute top-0 h-full w-[6px] border-x-2 border-white/90 bg-white/45 shadow-[0_0_10px_rgba(255,255,255,0.65)]"
                              style={{ left: `${leftPct}%` }}
                            />
                          ))}

                        {isWpc && (
                          <div className={`absolute inset-0 ${wpcHorizontal ? 'flex flex-col' : 'flex flex-row'}`}>
                            {Array.from({
                              length: wpcHorizontal
                                ? Math.max(1, Math.ceil(height / wpcPanelWidthM))
                                : Math.max(1, Math.ceil(width / wpcPanelWidthM))
                            }).map((_, i) => (
                              <div
                                key={`wpc-panel-${i}`}
                                className={`relative border border-black/20 ${wpcHorizontal ? 'w-full' : 'h-full'}`}
                                style={{
                                  flex: '1 1 0%',
                                  background:
                                    wpcTone === 'nogal'
                                      ? 'linear-gradient(90deg, #5d371d, #784723, #5f391e)'
                                      : wpcTone === 'grafito'
                                        ? 'linear-gradient(90deg, #4f5560, #646c78, #4f5560)'
                                        : 'linear-gradient(90deg, #b57945, #cc8b53, #b47843)'
                                }}
                              >
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: wpcHorizontal
                                      ? 'repeating-linear-gradient(0deg, rgba(34,20,10,0.24) 0 2px, rgba(255,255,255,0.05) 2px 4px, rgba(0,0,0,0) 4px 11px)'
                                      : 'repeating-linear-gradient(90deg, rgba(34,20,10,0.24) 0 2px, rgba(255,255,255,0.05) 2px 4px, rgba(0,0,0,0) 4px 11px)',
                                    opacity: 0.5
                                  }}
                                />

                                {Array.from({ length: 4 }).map((_, channel) => (
                                  <div
                                    key={`wpc-channel-${i}-${channel}`}
                                    className="absolute"
                                    style={
                                      wpcHorizontal
                                        ? {
                                            left: 0,
                                            right: 0,
                                            top: `${((channel + 0.5) / 4) * 100}%`,
                                            height: '10%',
                                            transform: 'translateY(-50%)',
                                            background:
                                              'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.4))',
                                            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.25), inset 0 -2px 5px rgba(0,0,0,0.25)'
                                          }
                                        : {
                                            top: 0,
                                            bottom: 0,
                                            left: `${((channel + 0.5) / 4) * 100}%`,
                                            width: '12%',
                                            transform: 'translateX(-50%)',
                                            background:
                                              'linear-gradient(to right, rgba(0,0,0,0.35), rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.4))',
                                            boxShadow: 'inset 2px 0 5px rgba(0,0,0,0.25), inset -2px 0 5px rgba(0,0,0,0.25)'
                                          }
                                    }
                                  />
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {result ? (
                    isPoly && (
                      <div className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center rounded-lg bg-slate-950/70 px-2 py-1 text-cyan-100">
                        <span className="text-[11px] font-bold">Caída de agua</span>
                        <span className="text-lg leading-none">↓</span>
                      </div>
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-center text-cyan-100/80">
                      <div>
                        <p className="text-sm font-semibold">Visualizador listo</p>
                        <p className="text-xs">Ingresa medidas para renderizar el material.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-600">
                {result
                  ? `Área: ${(width * height).toFixed(2)} m² · Piezas/Paneles: ${result.numSheets} · Módulo: ${activeModule.toUpperCase()}`
                  : 'Sin cálculo: vista previa vacía para preparar captura.'}
              </p>
            </section>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              {result ? (
                <MaterialsTable materials={result.materials} onChange={setEditedMaterials} />
              ) : (
                <p className="text-sm text-gray-500">Ingresa dimensiones para generar materiales.</p>
              )}
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
              </>
            )}
          </div>
        </div>
      </main>

      {!isBillingPage && <aside className="h-screen p-4">
        <div className="flex h-full flex-col rounded-2xl border border-slate-700/70 bg-[#020817] text-white shadow-[0_16px_45px_rgba(2,6,23,0.35)]">
          <div className="border-b border-slate-700/80 p-5 pb-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black uppercase">Resumen financiero</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{panelBreakdown.aLabel}</span>
                <span className="font-bold text-cyan-300">{formatCurrency(panelBreakdown.aValue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{panelBreakdown.bLabel}</span>
                <span className="font-bold text-cyan-300">
                  {panelBreakdown.bValue
                    ? formatCurrency(panelBreakdown.bValue)
                    : isZacate
                      ? `${(width * height).toFixed(2)}m² → ${(displayMaterials[0]?.quantity || 0).toFixed(2)}m²`
                      : isWpc
                        ? `${displayMaterials.find((m) => m.id === 'wpc-base')?.quantity || 0} base`
                        : '₡0'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5 pt-4">
            <div className="mt-auto space-y-3 pb-2">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 p-6 text-center shadow-2xl">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-100">Total estimado</p>
                <p className="text-4xl font-black tracking-tight">₡{roundedEditedTotal.toLocaleString('es-CR')}</p>
              </div>

              <button
                onClick={() => setShowSaveModal(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-cyan-600"
              >
                <Save className="h-5 w-5" />
                Generar cotización
              </button>

              <button
                onClick={exportPDF}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/20"
              >
                <FileDown className="h-5 w-5" />
                Descargar PDF
              </button>

              <button
                onClick={shareWhatsApp}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-green-600"
              >
                <Share2 className="h-5 w-5" />
                Compartir cálculo
              </button>
            </div>
          </div>
        </div>
      </aside>}

      {showSaveModal && result && (
        <SaveQuoteModal
          result={result}
          sheetType={resolvedSheetType}
          sheetThickness={resolvedSheetThickness}
          sheetColor={resolvedSheetColor}
          onClose={() => setShowSaveModal(false)}
          onSave={() => {
            setShowSaveModal(false);
            alert('Cotización guardada exitosamente');
          }}
        />
      )}
    </div>
  );
}

export default App;
