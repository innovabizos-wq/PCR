import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
}

interface Props {
  items: ToastItem[];
  onDismiss: (id: string) => void;
}

const toneStyles: Record<ToastTone, { wrap: string; Icon: typeof CheckCircle2 }> = {
  success: { wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  error: { wrap: 'border-red-200 bg-red-50 text-red-800', Icon: AlertCircle },
  info: { wrap: 'border-cyan-200 bg-cyan-50 text-cyan-800', Icon: Info }
};

export default function ToastStack({ items, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,420px)] flex-col gap-2">
      {items.map((item) => {
        const { wrap, Icon } = toneStyles[item.tone];
        return (
          <div key={item.id} className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow ${wrap}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1">{item.message}</p>
            <button className="text-xs font-bold uppercase opacity-70 hover:opacity-100" onClick={() => onDismiss(item.id)}>
              Cerrar
            </button>
          </div>
        );
      })}
    </div>
  );
}
