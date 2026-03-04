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
  const subtotal = data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discountTotal = data.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice * ((line.discountPct ?? 0) / 100),
    0
  );
  const netSubtotal = subtotal - discountTotal;
  const iva = netSubtotal * 0.13;
  const total = netSubtotal + iva;

  return (
    <div className="w-full max-w-[760px] rounded-xl border border-slate-200 bg-white p-8 text-[11px] text-slate-700 shadow-xl">
      <div className="mb-6 flex items-start justify-between border-b-2 border-[#00011a] pb-5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded" />
          </div>
          <p className="font-semibold text-[#00011a]">Sistemas de Construcción Unificados S.A.</p>
          <p>Parque Empresarial del Este, San José</p>
          <p>ventas@policarbonatocr.com · +506 2222-3333</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black uppercase text-[#00011a]">Proforma</p>
          <p className="font-semibold">#{data.quoteNumber}</p>
          <p className="text-slate-500">Fecha: {data.date}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Presentado a</p>
          <p className="font-semibold text-[#00011a]">{data.clientName}</p>
          <p>ID: {data.clientId}</p>
          <p>{data.clientAddress}</p>
          <p>Tel: {data.phone}</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Entrega</p>
          <p>{data.deliveryNote}</p>
          <p className="mt-3 text-[10px] text-slate-500">Validez: 15 días · Pago contado</p>
        </div>
      </div>

      <table className="mb-4 w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[#00011a] text-[10px] uppercase text-[#00011a]">
            <th className="py-2 text-left">Descripción</th>
            <th className="py-2 text-center">Cant.</th>
            <th className="py-2 text-right">Precio U.</th>
            <th className="py-2 text-right">Dto.</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((line) => {
            const lineSubtotal = line.quantity * line.unitPrice;
            const lineDiscount = lineSubtotal * ((line.discountPct ?? 0) / 100);
            const lineTotal = lineSubtotal - lineDiscount;

            return (
              <tr key={line.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2">
                  <p className="font-semibold text-[#00011a]">{line.description}</p>
                  {line.details && <p className="text-[10px] text-slate-500">{line.details}</p>}
                </td>
                <td className="py-2 text-center">{line.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(line.unitPrice)}</td>
                <td className="py-2 text-right">{line.discountPct ? `${line.discountPct}%` : '-'}</td>
                <td className="py-2 text-right font-semibold text-[#00011a]">{formatCurrency(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ml-auto w-[260px] space-y-1 text-sm">
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span>Descuento</span>
          <span className="text-red-500">-{formatCurrency(discountTotal)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span>Subtotal Neto</span>
          <span>{formatCurrency(netSubtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-1">
          <span>IVA 13%</span>
          <span>{formatCurrency(iva)}</span>
        </div>
        <div className="flex justify-between border-t-2 border-[#00011a] py-2 text-base font-black text-[#00011a]">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-t border-slate-200 pt-3 text-[10px] text-slate-500 md:grid-cols-2">
        <section className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Cuentas bancarias</p>
          {data.bankAccounts.map((account) => (
            <p key={account.label}>
              <span className="font-semibold text-[#00011a]">{account.label}:</span> {account.value}
            </p>
          ))}
        </section>

        <section className="rounded border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#00011a]">Garantía</p>
          <p>{data.warranty}</p>
        </section>
      </div>
    </div>
  );
}