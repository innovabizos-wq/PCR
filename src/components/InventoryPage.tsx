import { useMemo, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Download, MoreVertical, Plus, Search, TrendingUp, AlertTriangle } from 'lucide-react';

type InventoryStatus = 'optimo' | 'bajo' | 'agotado';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  stock: string;
  unit: string;
  trend: number[];
  trendTone: 'up' | 'down' | 'neutral';
  location: string;
  aisle: string;
  status: InventoryStatus;
  thumb: string;
}

const dashboardCards = [
  {
    label: 'Valor Total',
    value: '₡142.5M',
    note: '+2.5% vs mes anterior',
    tone: 'text-emerald-600'
  },
  {
    label: 'Stock Bajo',
    value: '12 ítems',
    note: 'Ver items críticos',
    tone: 'text-red-600'
  },
  {
    label: 'Entradas Mes',
    value: '3,450 unid.',
    note: '65% de la meta mensual',
    tone: 'text-indigo-600'
  },
  {
    label: 'Eficiencia',
    value: '94.2%',
    note: 'Capacidad almacén óptima',
    tone: 'text-emerald-600'
  }
];

const inventoryRows: InventoryItem[] = [
  {
    id: 'pc-6',
    productName: 'Lámina Policarbonato 6mm',
    sku: 'PC-CLR-006',
    category: 'Policarbonato',
    stock: '450',
    unit: 'unid.',
    trend: [40, 35, 50, 45, 60, 55, 50, 45],
    trendTone: 'up',
    location: 'Almacén A',
    aisle: 'Z-04 | E-B',
    status: 'optimo',
    thumb: 'textures/transparente.png'
  },
  {
    id: 'pvc-oak',
    productName: 'Piso PVC - Roble',
    sku: 'PVC-OAK-020',
    category: 'Piso PVC',
    stock: '120',
    unit: 'm²',
    trend: [80, 70, 60, 50, 40, 30, 20, 15],
    trendTone: 'down',
    location: 'Almacén B',
    aisle: 'Z-01 | E-A',
    status: 'bajo',
    thumb: 'textures/BRONCE.png'
  },
  {
    id: 'grass',
    productName: 'Zacate Artificial Pro',
    sku: 'GRASS-PRO-20',
    category: 'Zacate',
    stock: '1,200',
    unit: 'm²',
    trend: [20, 25, 40, 50, 60, 70, 65, 75],
    trendTone: 'up',
    location: 'Almacén A',
    aisle: 'Z-08 | E-D',
    status: 'optimo',
    thumb: 'textures/zacate-grass.svg'
  },
  {
    id: 'prof-al',
    productName: 'Perfil H Aluminio',
    sku: 'PC-HPROF-ALU',
    category: 'Accesorios',
    stock: '0',
    unit: 'unid.',
    trend: [2, 2, 2, 2, 2, 2, 2, 2],
    trendTone: 'neutral',
    location: 'Almacén C',
    aisle: 'Z-02 | E-A',
    status: 'agotado',
    thumb: 'textures/gris.png'
  },
  {
    id: 'pvc-stone',
    productName: 'Piso PVC - Piedra',
    sku: 'PVC-STN-010',
    category: 'Piso PVC',
    stock: '850',
    unit: 'm²',
    trend: [60, 40, 70, 50, 45, 80, 75, 70],
    trendTone: 'up',
    location: 'Almacén B',
    aisle: 'Z-03 | E-C',
    status: 'optimo',
    thumb: 'textures/azul.png'
  }
];

const statusStyles: Record<InventoryStatus, string> = {
  optimo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bajo: 'bg-red-50 text-red-700 border-red-200',
  agotado: 'bg-red-100 text-red-800 border-red-200'
};

const toneStyles: Record<InventoryItem['trendTone'], string> = {
  up: 'bg-emerald-500',
  down: 'bg-red-500',
  neutral: 'bg-slate-400'
};

const trendLabel: Record<InventoryItem['trendTone'], string> = {
  up: 'Tendencia positiva',
  down: 'Tendencia a la baja',
  neutral: 'Sin movimiento'
};

function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [warehouse, setWarehouse] = useState('Todos');
  const [status, setStatus] = useState('Todos');

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryRows.filter((item) => {
      const matchesSearch = !q || `${item.productName} ${item.sku} ${item.category}`.toLowerCase().includes(q);
      const matchesCategory = category === 'Todas' || item.category === category;
      const matchesWarehouse = warehouse === 'Todos' || item.location.includes(warehouse);
      const matchesStatus =
        status === 'Todos' ||
        (status === 'Crítico' && item.status !== 'optimo') ||
        (status === 'Normal' && item.status === 'optimo');

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
    });
  }, [search, category, warehouse, status]);

  return (
    <div className="space-y-6 rounded-xl bg-slate-50 p-5">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A1128]">Gestión de Inventario</h2>
          <p className="mt-1 text-sm text-slate-500">Vista unificada de stock, movimientos y valorización.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-[#0A1128] px-4 py-2 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> Ingresar Stock
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</p>
            <p className="mt-3 text-xs text-slate-500">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm"
                  placeholder="Buscar SKU, producto..."
                />
              </div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium">
                <option>Todas</option>
                <option>Policarbonato</option>
                <option>Piso PVC</option>
                <option>Zacate</option>
                <option>Accesorios</option>
              </select>
              <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium">
                <option>Todos</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium">
                <option>Todos</option>
                <option>Crítico</option>
                <option>Normal</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Producto / SKU</th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Cat.</th>
                    <th className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Stock</th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Tendencia</th>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Ubicación</th>
                    <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((item) => (
                    <tr key={item.id} className="group transition-colors hover:bg-blue-50/50">
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <img src={item.thumb} alt={item.productName} className="h-8 w-8 rounded border border-slate-200 object-cover" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-[10px] font-mono text-slate-500">{item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-medium text-slate-700">{item.category}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className={`text-sm font-bold tabular-nums ${item.status === 'optimo' ? 'text-slate-800' : 'text-red-600'}`}>{item.stock}</div>
                        <div className="text-[10px] text-slate-400">{item.unit}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex h-5 w-[72px] items-end gap-[2px]" title={trendLabel[item.trendTone]}>
                          {item.trend.map((value, idx) => (
                            <div key={`${item.id}-${idx}`} style={{ height: `${value}%` }} className={`flex-1 rounded-sm bg-slate-200 ${item.trendTone === 'neutral' || idx > item.trend.length - 4 ? toneStyles[item.trendTone] : ''}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        <p className="font-medium">{item.location}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.aisle}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button className="text-slate-400 hover:text-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <p>
                Mostrando <span className="font-medium text-slate-800">1</span> a <span className="font-medium text-slate-800">{filteredRows.length}</span> de{' '}
                <span className="font-medium text-slate-800">128</span> items
              </p>
              <div className="inline-flex items-center rounded-md border border-slate-300 bg-white">
                <button className="px-2 py-1.5 text-slate-400">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="bg-[#0A1128] px-3 py-1.5 text-white">1</button>
                <button className="px-3 py-1.5 text-slate-700">2</button>
                <button className="px-2 py-1.5 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-sm font-bold text-[#0A1128]">Tendencia de Stock</h3>
            <div className="flex h-[220px] items-end justify-between gap-3 px-1">
              {[60, 80, 45].map((height, index) => (
                <div key={height} className="flex w-full flex-col items-center gap-2">
                  <div className="flex h-[180px] w-full flex-col justify-end rounded-t bg-indigo-50 p-[2px]">
                    <div
                      style={{ height: `${height}%` }}
                      className={`w-full rounded-t ${index === 0 ? 'bg-[#0A1128]' : index === 1 ? 'bg-cyan-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{index === 0 ? 'Policarbonato' : index === 1 ? 'PVC' : 'Zacate'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-sm font-bold text-[#0A1128]">Composición de Inventario</h3>
            <div className="space-y-4 text-xs">
              {[
                ['Policarbonato', 45, 'bg-[#0A1128]'],
                ['Piso PVC', 30, 'bg-cyan-500'],
                ['Zacate', 15, 'bg-emerald-500'],
                ['Otros', 10, 'bg-slate-400']
              ].map(([label, pct, color]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-bold text-[#0A1128]">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" /> 12 productos en estado crítico
            </div>
            <button className="inline-flex items-center gap-1 font-semibold hover:underline">
              Ver items críticos <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
            <div className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" /> Eficiencia operativa en +4.2% esta semana
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default InventoryPage;
