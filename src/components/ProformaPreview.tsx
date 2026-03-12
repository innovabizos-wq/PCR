import { calculateProformaTotals } from '../domain/quotes/proformaTotals';
import { formatCurrency } from '../utils/calculations';

export interface ProformaLine {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  discountPct?: number;
}

export interface ProformaData {
  quoteNumber: string;
  date: string;
  clientName: string;
  clientId: string;
  clientAddress: string;
  phone: string;
  deliveryNote: string;
  lines: ProformaLine[];
  bankAccounts: { label: string; value: string }[];
  warranty: string;
}

interface ProformaPreviewProps {
  logoUrl: string;
  data: ProformaData;
}

export default function ProformaPreview({ logoUrl, data }: ProformaPreviewProps) {
  const { subtotal, discountTotal, netSubtotal, iva, total } = calculateProformaTotals(data.lines);

  return (
    <div className="w-full max-w-[780px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 text-[11px] text-slate-700 shadow-2xl">
      <div className="border-b border-slate-200 bg-gradient-to-r from-[#00011a] via-[#0a1347] to-[#12337a] px-8 py-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <img src={logoUrl} alt="Logo" className="mb-3 h-10 w-auto max-w-[220px] object-contain" />
            <p className="font-semibold">Sistemas de Construcción Unificados S.A.</p>
            <p className="text-slate-200">Parque Empresarial del Este, San José</p>
            <p className="text-slate-200">ventas@policarbonatocr.com · +506 2222-3333</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-black uppercase tracking-wide">Proforma</p>
            <p className="font-semibold">#{data.quoteNumber}</p>
            <p className="text-slate-200">Fecha: {data.date}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Presentado a</p>
            <p className="font-semibold text-[#00011a]">{data.clientName}</p>
            <p>ID: {data.clientId}</p>
            <p>{data.clientAddress}</p>
            <p>Tel: {data.phone}</p>
          </div>
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-cyan-900">Entrega y condiciones</p>
            <p className="text-cyan-900">{data.deliveryNote}</p>
            <p className="mt-3 text-[10px] text-cyan-700">Validez: 15 días · Pago contado</p>
          </div>
        </div>

        <table className="w-full border-collapse overflow-hidden rounded-xl">
          <thead>
            <tr className="bg-slate-100 text-[10px] uppercase text-slate-700">
              <th className="px-2 py-3 text-left">Descripción</th>
              <th className="px-2 py-3 text-center">Cant.</th>
              <th className="px-2 py-3 text-right">Precio U.</th>
              <th className="px-2 py-3 text-right">Dto.</th>
              <th className="px-2 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line) => {
              const lineSubtotal = line.quantity * line.unitPrice;
              const lineDiscount = lineSubtotal * ((line.discountPct ?? 0) / 100);
              const lineTotal = lineSubtotal - lineDiscount;

              return (
                <tr key={line.id} className="border-b border-slate-100 align-top odd:bg-white even:bg-slate-50/60">
                  <td className="px-2 py-2.5 pr-2">
                    <p className="font-semibold text-[#00011a]">{line.description}</p>
                    {line.details && <p className="text-[10px] text-slate-500">{line.details}</p>}
                  </td>
                  <td className="px-2 py-2.5 text-center">{line.quantity}</td>
                  <td className="px-2 py-2.5 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-2 py-2.5 text-right">{line.discountPct ? `${line.discountPct}%` : '-'}</td>
                  <td className="px-2 py-2.5 text-right font-semibold text-[#00011a]">{formatCurrency(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-[290px] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span>Descuento</span>
              <span className="text-rose-500">-{formatCurrency(discountTotal)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span>Subtotal Neto</span>
              <span>{formatCurrency(netSubtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span>IVA 13%</span>
              <span>{formatCurrency(iva)}</span>
            </div>
            <div className="mt-1 flex justify-between rounded-lg bg-[#00011a] px-3 py-2 text-base font-black text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-200 pt-3 text-[10px] text-slate-500 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Cuentas bancarias</p>
            {data.bankAccounts.map((account) => (
              <p key={account.label}>
                <span className="font-semibold text-[#00011a]">{account.label}:</span> {account.value}
              </p>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Garantía</p>
            <p>{data.warranty}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
