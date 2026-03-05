import { useMemo, useState } from 'react';
import { Minus, Plus, Search } from 'lucide-react';

type ProductType = 'policarbonato' | 'pvc' | 'wpc' | 'zacate' | 'accesorio';

interface ProductRow {
  id: string;
  sku: string;
  nombre: string;
  tipo: ProductType;
  descripcion: string;
  precio: number;
  cuentaCobro: string;
  garantia: string;
  color: string;
  tamano: string;
  foto: string;
}

const initialProducts: ProductRow[] = [
  {
    id: 'pc-8-bco',
    sku: 'PC-KLAR-8-BLANCO',
    nombre: 'Lámina Policarbonato 8mm Blanco',
    tipo: 'policarbonato',
    descripcion: 'Lámina alveolar para cubierta residencial',
    precio: 59200,
    cuentaCobro: 'Ventas Policarbonato',
    garantia: '10 años decoloración',
    color: 'Blanco',
    tamano: '2.10 x 5.80 m',
    foto: 'textures/blanco.png'
  },
  {
    id: 'pvc-rojo',
    sku: 'PVC-ROJO-40',
    nombre: 'Piso PVC 40x40 Rojo',
    tipo: 'pvc',
    descripcion: 'Piso modular de alto tránsito',
    precio: 2000,
    cuentaCobro: 'Ventas PVC',
    garantia: '12 meses',
    color: 'Rojo',
    tamano: '40 x 40 cm',
    foto: 'textures/azul.png'
  },
  {
    id: 'wpc-teca',
    sku: 'WPC-INT-TECA',
    nombre: 'Panel WPC Interior Teca',
    tipo: 'wpc',
    descripcion: 'Panel decorativo interior',
    precio: 7500,
    cuentaCobro: 'Ventas WPC',
    garantia: '24 meses',
    color: 'Teca',
    tamano: '2.90 m',
    foto: 'textures/BRONCE.png'
  },
  {
    id: 'zacate-35',
    sku: 'ZAC-35MM-PRO',
    nombre: 'Zacate Sintético 35mm',
    tipo: 'zacate',
    descripcion: 'Rollo de zacate de uso residencial',
    precio: 9500,
    cuentaCobro: 'Ventas Zacate',
    garantia: '18 meses',
    color: 'Verde',
    tamano: '2 x 25 m',
    foto: 'textures/zacate-grass.svg'
  }
];

const columns: Array<{ key: keyof ProductRow; label: string }> = [
  { key: 'sku', label: 'SKU' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'precio', label: 'Precio' },
  { key: 'cuentaCobro', label: 'Cuenta cobro' },
  { key: 'garantia', label: 'Garantía' },
  { key: 'color', label: 'Color' },
  { key: 'tamano', label: 'Tamaño' },
  { key: 'foto', label: 'Foto' }
];

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [showProductEditor, setShowProductEditor] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; key: keyof ProductRow } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => Object.values(p).join(' ').toLowerCase().includes(q));
  }, [products, search]);

  const setCellValue = (id: string, key: keyof ProductRow, value: string) => {
    setProducts((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (key === 'precio') return { ...row, precio: Number(value) || 0 };
        return { ...row, [key]: value };
      })
    );
  };

  const addRow = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        sku: '',
        nombre: '',
        tipo: 'accesorio',
        descripcion: '',
        precio: 0,
        cuentaCobro: '',
        garantia: '',
        color: '',
        tamano: '',
        foto: ''
      }
    ]);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black uppercase text-[#00011a]">Gestión de inventario analítico</h2>
            <p className="text-sm text-slate-500">Control de catálogo y datos que alimentan cotización.</p>
          </div>
          <button
            onClick={() => setShowProductEditor(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00011a] px-4 py-2 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            +/- Productos
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            placeholder="Buscar producto, SKU, tipo, color, garantía..."
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase text-slate-600">
                <th className="px-2 py-2">Producto</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Precio</th>
                <th className="px-2 py-2">Cuenta</th>
                <th className="px-2 py-2">Garantía</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-semibold text-slate-800">{row.nombre || '(sin nombre)'}</td>
                  <td className="px-2 py-2">{row.tipo}</td>
                  <td className="px-2 py-2 font-mono text-[11px] text-slate-500">{row.sku}</td>
                  <td className="px-2 py-2">₡{row.precio.toLocaleString('es-CR')}</td>
                  <td className="px-2 py-2">{row.cuentaCobro}</td>
                  <td className="px-2 py-2">{row.garantia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showProductEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[85vh] w-[96vw] max-w-[1320px] flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black uppercase text-[#00011a]">Editor +/- Productos</h3>
                <p className="text-xs text-slate-500">Doble clic para editar cada celda.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addRow} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold">
                  <Plus className="h-3.5 w-3.5" /> Fila
                </button>
                <button onClick={() => setShowProductEditor(false)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600">
                  <Minus className="h-3.5 w-3.5" /> Cerrar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full min-w-[1600px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left uppercase text-slate-600">
                    {columns.map((column) => (
                      <th key={column.key} className="border border-slate-200 px-2 py-2 font-bold">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((row) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                      {columns.map((column) => {
                        const isEditing = editingCell?.id === row.id && editingCell.key === column.key;
                        const cellValue = String(row[column.key] ?? '');
                        return (
                          <td
                            key={`${row.id}-${column.key}`}
                            className="border border-slate-200 px-2 py-1.5 align-top"
                            onDoubleClick={() => setEditingCell({ id: row.id, key: column.key })}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                value={cellValue}
                                onBlur={(e) => {
                                  setCellValue(row.id, column.key, e.target.value);
                                  setEditingCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setCellValue(row.id, column.key, (e.target as HTMLInputElement).value);
                                    setEditingCell(null);
                                  }
                                }}
                                onChange={(e) => setCellValue(row.id, column.key, e.target.value)}
                                className="w-full rounded border border-cyan-300 px-1.5 py-1 outline-none"
                              />
                            ) : (
                              <span>{cellValue || <span className="text-slate-300">(vacío)</span>}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
