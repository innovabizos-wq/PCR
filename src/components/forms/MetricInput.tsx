interface MetricInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
  parse: (raw: string) => number;
}

export default function MetricInput({ label, value, onChange, step = 0.1, parse }: MetricInputProps) {
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
          const current = parse(value);
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
