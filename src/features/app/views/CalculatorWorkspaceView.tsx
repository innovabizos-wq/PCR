import { Dispatch, MutableRefObject, ReactNode, RefObject, SetStateAction } from 'react';
import { Camera } from 'lucide-react';
import MaterialsTable from '../../../components/MaterialsTable';
import MetricInput from '../../../components/forms/MetricInput';
import ProformaPreview, { ProformaData } from '../../../components/ProformaPreview';
import { CalculationResult, Material, SheetBrand, SheetColor, SheetThickness } from '../../../types/calculator';
import { pvcPalette, PvcColor } from '../../../utils/pvcCalculations';
import { WpcPanelType } from '../../../utils/wpcCalculations';
import { MaterialModule, ZacateHeight } from '../types';
import { WPC_PANEL_LENGTH_M, WPC_TEXTURES, WPC_TONES_BY_TYPE, WPC_TONE_LABELS, WpcTone } from '../wpcConfig';

interface CalculatorWorkspaceViewProps {
  moduleCards: { id: MaterialModule; label: string; icon: ReactNode }[];
  activeModule: MaterialModule;
  handleModuleChange: (module: MaterialModule) => void;
  widthInput: string;
  setWidthInput: Dispatch<SetStateAction<string>>;
  heightInput: string;
  setHeightInput: Dispatch<SetStateAction<string>>;
  parseMetric: (raw: string) => number;
  isPvc: boolean;
  isZacate: boolean;
  isWpc: boolean;
  isPoly: boolean;
  pvcColor: PvcColor;
  setPvcColor: Dispatch<SetStateAction<PvcColor>>;
  includeBorders: boolean;
  setIncludeBorders: Dispatch<SetStateAction<boolean>>;
  zacateHeight: ZacateHeight;
  setZacateHeight: Dispatch<SetStateAction<ZacateHeight>>;
  wpcType: WpcPanelType;
  setWpcType: Dispatch<SetStateAction<WpcPanelType>>;
  wpcTone: WpcTone;
  setWpcTone: Dispatch<SetStateAction<WpcTone>>;
  wpcUseRecuts: boolean;
  setWpcUseRecuts: Dispatch<SetStateAction<boolean>>;
  wpcVerticalInstall: boolean;
  setWpcVerticalInstall: Dispatch<SetStateAction<boolean>>;
  brand: SheetBrand;
  setBrand: Dispatch<SetStateAction<SheetBrand>>;
  polyColor: SheetColor;
  setPolyColor: Dispatch<SetStateAction<SheetColor>>;
  thickness: SheetThickness;
  setThickness: Dispatch<SetStateAction<SheetThickness>>;
  customVisualizerRef: MutableRefObject<HTMLElement | null>;
  logoUrl: string;
  captureCustomVisualizer: () => void;
  result: CalculationResult | null;
  width: number;
  height: number;
  previewHeight: number;
  visualizerFrame: { widthPx: number; heightPx: number };
  activeTexture: string;
  polyTextures: Record<SheetColor, string>;
  polySeamPositions: number[];
  wpcHorizontal: boolean;
  wpcPanelWidthM: number;
  error: string;
  setEditedMaterials: Dispatch<SetStateAction<Material[] | null>>;
  proformaExportRef: RefObject<HTMLDivElement>;
  proformaData: ProformaData;
}

export default function CalculatorWorkspaceView(props: CalculatorWorkspaceViewProps) {
  const {
    moduleCards,
    activeModule,
    handleModuleChange,
    widthInput,
    setWidthInput,
    heightInput,
    setHeightInput,
    parseMetric,
    isPvc,
    isZacate,
    isWpc,
    isPoly,
    pvcColor,
    setPvcColor,
    includeBorders,
    setIncludeBorders,
    zacateHeight,
    setZacateHeight,
    wpcType,
    setWpcType,
    wpcTone,
    setWpcTone,
    wpcUseRecuts,
    setWpcUseRecuts,
    wpcVerticalInstall,
    setWpcVerticalInstall,
    brand,
    setBrand,
    polyColor,
    setPolyColor,
    thickness,
    setThickness,
    customVisualizerRef,
    logoUrl,
    captureCustomVisualizer,
    result,
    width,
    height,
    previewHeight,
    visualizerFrame,
    activeTexture,
    polyTextures,
    polySeamPositions,
    wpcHorizontal,
    wpcPanelWidthM,
    error,
    setEditedMaterials,
    proformaExportRef,
    proformaData
  } = props;

  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">1</span>
          Seleccionar material
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {moduleCards.map((item) => (
            <button
              key={item.id}
              onClick={() => handleModuleChange(item.id)}
              className={`h-20 rounded-xl border px-2 transition-all ${
                activeModule === item.id ? 'border-[#00011a] bg-slate-50 text-[#00011a] shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
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

      <section className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">2</span>
          Parámetros del módulo
        </h2>

        <div className="flex flex-wrap items-end gap-4">
          <MetricInput label="Ancho (m)" value={widthInput} onChange={setWidthInput} parse={parseMetric} />
          <MetricInput label="Alto (m)" value={heightInput} onChange={setHeightInput} parse={parseMetric} />

          {isPvc && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Color</label>
                <select value={pvcColor} onChange={(e) => setPvcColor(e.target.value as PvcColor)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${zacateHeight === '35mm' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-300 text-gray-700'}`}
                >
                  35 mm
                </button>
                <button disabled className="cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-400">
                  50 mm · Uso deportivo (agotado)
                </button>
              </div>
            </div>
          )}

          {isWpc && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Tipo panel</label>
                <select value={wpcType} onChange={(e) => setWpcType(e.target.value as WpcPanelType)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
                  <option value="interior">Interior</option>
                  <option value="exterior">Exterior</option>
                  <option value="coextruido">Coextruido</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Acabado</label>
                <select value={wpcTone} onChange={(e) => setWpcTone(e.target.value as WpcTone)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
                  {WPC_TONES_BY_TYPE[wpcType].map((tone) => (
                    <option key={tone} value={tone}>
                      {WPC_TONE_LABELS[tone]}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                <input type="checkbox" checked={wpcUseRecuts} onChange={(e) => setWpcUseRecuts(e.target.checked)} />
                Optimizar con recortes
              </label>
              <span className="text-xs text-gray-500">Aprovecha sobrantes de corte de al menos 15 cm para reducir piezas estimadas.</span>
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                <input type="checkbox" checked={wpcVerticalInstall} onChange={(e) => setWpcVerticalInstall(e.target.checked)} />
                Instalar vertical (desactivar = horizontal lateral)
              </label>
            </>
          )}

          {isPoly && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Marca</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value as SheetBrand)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
                  <option value="KLAR">KLAR</option>
                  <option value="PCR">PCR</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Color lámina</label>
                <select value={polyColor} onChange={(e) => setPolyColor(e.target.value as SheetColor)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
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
                <select value={thickness} onChange={(e) => setThickness(e.target.value as SheetThickness)} className="h-10 rounded-lg border border-gray-300 px-3 text-sm font-semibold">
                  <option value="8mm">8 mm</option>
                  <option value="10mm">10 mm</option>
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      <section ref={customVisualizerRef} className="rounded-xl border border-gray-200 bg-white px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-gray-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00011a] text-xs font-bold text-white">3</span>
            VIZUALIZADOR 2D POLICARBONATO
          </h2>
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Policarbonato CR" className="h-8" />
            <button onClick={captureCustomVisualizer} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50" title="Capturar visualizador">
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_16px_35px_rgba(15,23,42,0.10)]">
          {result && (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700 md:grid-cols-4">
              <div className="rounded-lg bg-white px-2 py-1.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Ancho real</p><p className="text-sm font-bold tabular-nums text-slate-900">{width.toFixed(2)} m</p></div>
              <div className="rounded-lg bg-white px-2 py-1.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Alto real</p><p className="text-sm font-bold tabular-nums text-slate-900">{height.toFixed(2)} m</p></div>
              <div className="rounded-lg bg-white px-2 py-1.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Área</p><p className="text-sm font-bold tabular-nums text-slate-900">{(width * height).toFixed(2)} m²</p></div>
              <div className="rounded-lg bg-white px-2 py-1.5"><p className="text-[10px] uppercase tracking-wide text-slate-500">Piezas</p><p className="text-sm font-bold text-slate-900">{result.numSheets}</p></div>
            </div>
          )}

          <div className="relative mx-auto w-full max-w-[920px] overflow-hidden rounded-xl border border-slate-300" style={{ height: previewHeight }}>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(100,116,139,0.32) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.32) 1px, transparent 1px), linear-gradient(180deg, rgba(244,246,248,0.98), rgba(233,237,241,0.98))',
                backgroundSize: '32px 32px'
              }}
            />

            <div aria-hidden className="pointer-events-none absolute left-[56px] right-[56px] top-[44px] border-t border-slate-300/80" />
            <div aria-hidden className="pointer-events-none absolute bottom-[34px] left-[56px] right-[56px] border-t border-dashed border-slate-300/60" />
            <div aria-hidden className="pointer-events-none absolute bottom-[34px] left-[56px] top-[44px] border-l border-slate-300/80" />
            <div aria-hidden className="pointer-events-none absolute bottom-[34px] right-[56px] top-[44px] border-l border-dashed border-slate-300/60" />

            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-semibold leading-none tabular-nums text-white">Ancho · {width.toFixed(2)} m</div>
            <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-semibold leading-none tabular-nums text-white">Alto · {height.toFixed(2)} m</div>

            <div className="absolute left-1/2 top-1/2" style={{ width: visualizerFrame.widthPx, height: visualizerFrame.heightPx, transform: 'translate(-50%, -50%)' }}>
              {result ? (
                <div className="relative h-full w-full rounded-lg border border-white/20 shadow-2xl" style={{ backgroundImage: activeTexture, backgroundSize: isPoly || isZacate ? 'cover' : 'auto', backgroundPosition: 'center' }}>
                  {isZacate && <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(95deg, rgba(14,40,18,0.12) 0 2px, rgba(0,0,0,0) 2px 7px), repeating-linear-gradient(25deg, rgba(190,234,120,0.08) 0 1px, rgba(0,0,0,0) 1px 9px)', mixBlendMode: 'overlay' }} />}

                  {isPoly && <div className="absolute inset-0" style={{ backgroundImage: `url(${polyTextures[polyColor]})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.96 }} />}

                  {isPvc && (
                    <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(width / 0.4))}, minmax(0,1fr))`, gridTemplateRows: `repeat(${Math.max(1, Math.ceil(height / 0.4))}, minmax(0,1fr))` }}>
                      {Array.from({ length: Math.max(1, Math.ceil(width / 0.4) * Math.ceil(height / 0.4)) }).map((_, i) => (
                        <div key={i} className="border border-white/20" />
                      ))}
                    </div>
                  )}

                  {isPoly && polySeamPositions.map((leftPct) => <div key={leftPct} className="absolute top-0 h-full w-[6px] border-x-2 border-white/90 bg-white/45 shadow-[0_0_10px_rgba(255,255,255,0.65)]" style={{ left: `${leftPct}%` }} />)}

                  {isWpc && (
                    <div className={`absolute inset-0 ${wpcHorizontal ? 'flex flex-col' : 'flex flex-row'}`}>
                      {Array.from({ length: wpcHorizontal ? Math.max(1, Math.ceil(height / wpcPanelWidthM)) : Math.max(1, Math.ceil(width / wpcPanelWidthM)) }).map((_, i) => (
                        <div
                          key={`wpc-panel-${i}`}
                          className={`relative border border-black/20 ${wpcHorizontal ? 'w-full' : 'h-full'}`}
                          style={{
                            flex: '1 1 0%',
                            backgroundImage: `url(${import.meta.env.BASE_URL}${WPC_TEXTURES[wpcTone]})`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: wpcHorizontal ? 'auto 100%' : '100% auto',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: wpcHorizontal
                                ? 'repeating-linear-gradient(0deg, rgba(20,20,20,0.28) 0 2px, rgba(255,255,255,0.07) 2px 4px, rgba(0,0,0,0) 4px 12px)'
                                : 'repeating-linear-gradient(90deg, rgba(20,20,20,0.28) 0 2px, rgba(255,255,255,0.07) 2px 4px, rgba(0,0,0,0) 4px 12px)',
                              opacity: 0.38
                            }}
                          />

                          {wpcUseRecuts && result.numSheets > 0 && (
                            <div
                              className="pointer-events-none absolute inset-0"
                              style={{
                                backgroundImage: wpcHorizontal
                                  ? `repeating-linear-gradient(90deg, rgba(220,38,38,0.50) 0 2px, rgba(0,0,0,0) 2px ${(WPC_PANEL_LENGTH_M / Math.max(1, result.numSheets)) * 100}%)`
                                  : `repeating-linear-gradient(180deg, rgba(220,38,38,0.50) 0 2px, rgba(0,0,0,0) 2px ${(WPC_PANEL_LENGTH_M / Math.max(1, result.numSheets)) * 100}%)`,
                                mixBlendMode: 'multiply',
                                opacity: 0.45
                              }}
                              title="Visualización de recortes optimizados"
                            />
                          )}

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
                                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.4))',
                                      boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.25), inset 0 -2px 5px rgba(0,0,0,0.25)'
                                    }
                                  : {
                                      top: 0,
                                      bottom: 0,
                                      left: `${((channel + 0.5) / 4) * 100}%`,
                                      width: '12%',
                                      transform: 'translateX(-50%)',
                                      background: 'linear-gradient(to right, rgba(0,0,0,0.35), rgba(255,255,255,0.2) 35%, rgba(0,0,0,0.4))',
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
                <div className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center rounded-lg bg-slate-900/70 px-2 py-1 text-white">
                  <span className="text-[11px] font-bold">Caída de agua</span>
                  <span className="text-lg leading-none">↓</span>
                </div>
              )
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-slate-700/80">
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
        {result ? <MaterialsTable materials={result.materials} onChange={setEditedMaterials} /> : <p className="text-sm text-gray-500">Ingresa dimensiones para generar materiales.</p>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="sr-only" aria-hidden>
        <div ref={proformaExportRef} className="mx-auto min-w-[760px] max-w-[760px]">
          <ProformaPreview logoUrl={logoUrl} data={proformaData} />
        </div>
      </div>
    </>
  );
}
