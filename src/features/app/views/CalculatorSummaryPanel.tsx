import { Calculator, FileDown, FileText, Share2 } from 'lucide-react';
import { Material } from '../../../types/calculator';
import { formatCurrency } from '../../../utils/calculations';

interface PanelBreakdown {
  aLabel: string;
  aValue: number;
  bLabel: string;
  bValue: number;
}

interface CalculatorSummaryPanelProps {
  isZacate: boolean;
  isWpc: boolean;
  width: number;
  height: number;
  displayMaterials: Material[];
  panelBreakdown: PanelBreakdown;
  roundedEditedTotal: number;
  resultReady: boolean;
  onCreateQuote: () => void;
  onExportPdf: () => void;
  onShareWhatsApp: () => void;
}

export default function CalculatorSummaryPanel({
  isZacate,
  isWpc,
  width,
  height,
  displayMaterials,
  panelBreakdown,
  roundedEditedTotal,
  resultReady,
  onCreateQuote,
  onExportPdf,
  onShareWhatsApp
}: CalculatorSummaryPanelProps) {
  return (
    <aside className="h-screen p-4 pt-7">
      <div className="flex h-full flex-col rounded-2xl border border-slate-700/70 bg-[#020817] text-white shadow-[0_16px_45px_rgba(2,6,23,0.35)]">
        <div className="border-b border-slate-700/80 p-6 pb-5 pt-7">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black uppercase">Resumen financiero</h3>
          </div>

          <div className="mt-6 space-y-4 text-sm">
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
              onClick={onCreateQuote}
              disabled={!resultReady}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-5 w-5" />
              Generar cotización
            </button>

            <button
              onClick={onExportPdf}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 text-sm font-bold uppercase tracking-wider text-white hover:bg-white/20"
            >
              <FileDown className="h-5 w-5" />
              Descargar PDF
            </button>

            <button
              onClick={onShareWhatsApp}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-bold uppercase tracking-wider text-white hover:bg-green-600"
            >
              <Share2 className="h-5 w-5" />
              Compartir cálculo
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
