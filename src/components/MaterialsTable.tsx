import { useEffect, useState } from 'react';
import { Material } from '../types/calculator';
import { formatCurrency } from '../utils/calculations';

interface MaterialsTableProps {
  materials: Material[]; // entrada inicial
  onRemove?: (id: string | number) => void;
  onChange?: (materials: Material[]) => void; // notifica cambios (qty / iva / add / remove)
  onAdd?: (added: Material[]) => void; // opcional: notifica productos agregados desde el panel maestro
}

/**
 * Tabla de materiales con:
 * - columna IVA editable por doble click (muestra %)
 * - columna TOTAL CON IVA alineada a la derecha
 * - ✕ superpuesto justo a la derecha del precio (sutil, aparece en hover)
 * - botones - / + para cantidad (con más espacio en la columna de cantidad)
 * - botón maestro + en el header para abrir panel de agregar productos
 */
export default function MaterialsTable({
  materials,
  onRemove,
  onChange,
  onAdd
}: MaterialsTableProps) {
  const [local, setLocal] = useState<Material[]>([]);
  const [editingIvaRow, setEditingIvaRow] = useState<number | null>(null);
  const [editingIvaValue, setEditingIvaValue] = useState<string>('13');
  const [editingDiscountRow, setEditingDiscountRow] = useState<number | null>(null);
  const [editingDiscountValue, setEditingDiscountValue] = useState<string>('0');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Record<number, number>>({}); // index -> qty in drawer

  // muestra algunos productos de ejemplo en el agregador maestro; en producción reemplaza por props o fetch
  const availableProducts: Material[] = [
    { id: 'h1', name: 'Perfil H 6m', description: 'Perfil H aluminio', formula: '', quantity: 1, unitPrice: 4500, total: 4500 },
    { id: 'u1', name: 'Perfil U 6m', description: 'Perfil U aluminio', formula: '', quantity: 1, unitPrice: 3200, total: 3200 },
    { id: 'torn', name: 'Tornillos (caja 100)', description: 'Tornillería galvanizada', formula: '', quantity: 1, unitPrice: 7800, total: 7800 },
    { id: 'sel', name: 'Sellador (cartucho)', description: 'Sellador poliuretano', formula: '', quantity: 1, unitPrice: 4200, total: 4200 },
  ];

  useEffect(() => {
    setLocal(
      materials.map(m => ({
        ...m,
        quantity: m.quantity ?? 0,
        unitPrice: m.unitPrice ?? 0,
        iva: m.iva ?? 0.13,
        discount: m.discount ?? null,
      }))
    );
    // reset drawer selection when materials change
    setSelectedToAdd({});
  }, [materials]);

  // notify parent on changes
  useEffect(() => {
    if (onChange) onChange(local.map(l => ({ ...l })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const updateRow = (idx: number, patch: Partial<Material>) => {
    setLocal(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const increment = (idx: number) => {
    setLocal(prev =>
      prev.map((row, i) =>
        i === idx ? { ...row, quantity: (row.quantity ?? 0) + 1 } : row
      )
    );
  };
  const decrement = (idx: number) => {
    setLocal(prev =>
      prev.map((row, i) =>
        i === idx ? { ...row, quantity: Math.max(0, (row.quantity ?? 0) - 1) } : row
      )
    );
  };

  const handleRemove = (idx: number) => {
    const item = local[idx];
    if (!item) return;
    setLocal(prev => prev.filter((_, i) => i !== idx));
    if (onRemove && item.id !== undefined) onRemove(item.id);
  };

  const startEditIva = (idx: number) => {
    setEditingIvaRow(idx);
    const val = ((local[idx]?.iva ?? 0.13) * 100).toFixed(2).replace(/\.00$/, '');
    setEditingIvaValue(val);
  };
  const commitEditIva = (idx: number) => {
    const parsed = parseFloat(editingIvaValue.replace(',', '.'));
    const pct = isNaN(parsed) ? 13 : parsed;
    const decimal = Math.max(0, pct) / 100;
    updateRow(idx, { iva: decimal });
    setEditingIvaRow(null);
    setEditingIvaValue('13');
  };
  const cancelEditIva = () => {
    setEditingIvaRow(null);
    setEditingIvaValue('13');
  };


  const startEditDiscount = (idx: number) => {
    setEditingDiscountRow(idx);
    const val = (local[idx]?.discount ?? 0).toFixed(2).replace(/\.00$/, '');
    setEditingDiscountValue(val);
  };
  const commitEditDiscount = (idx: number) => {
    const parsed = parseFloat(editingDiscountValue.replace(',', '.'));
    const amount = isNaN(parsed) ? 0 : Math.max(0, parsed);
    updateRow(idx, { discount: amount === 0 ? null : amount });
    setEditingDiscountRow(null);
    setEditingDiscountValue('0');
  };
  const cancelEditDiscount = () => {
    setEditingDiscountRow(null);
    setEditingDiscountValue('0');
  };

  // drawer (agregar productos)
  const toggleSelectProduct = (i: number) => {
    setSelectedToAdd(prev => {
      const copy = { ...prev };
      if (copy[i]) delete copy[i];
      else copy[i] = 1;
      return copy;
    });
  };
  const setSelectedQty = (i: number, q: number) => {
    setSelectedToAdd(prev => ({ ...prev, [i]: Math.max(0, q) }));
  };
  const confirmAddSelected = () => {
    const toAdd: Material[] = Object.entries(selectedToAdd).map(([idxStr, qty]) => {
      const idx = Number(idxStr);
      const prod = availableProducts[idx];
      return {
        ...prod,
        quantity: qty,
        total: (prod.unitPrice ?? 0) * qty,
        id: `${prod.id}-${Date.now()}-${Math.round(Math.random()*1000)}`
      } as Material;
    });
    if (toAdd.length === 0) {
      setDrawerOpen(false);
      return;
    }
    setLocal(prev => {
      const merged = [...prev, ...toAdd];
      if (onAdd) onAdd(toAdd);
      return merged;
    });
    setSelectedToAdd({});
    setDrawerOpen(false);
  };

  if (!local.length) {
    return (
      <div className="text-sm text-gray-500 p-6">
        No hay materiales para mostrar.
        {/* header + button should still be visible even with empty list */}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header with master + at far right */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
          <span className="w-6 h-6 bg-[#00011a] text-white rounded-full flex items-center justify-center text-xs font-bold">
            3
          </span>
          Accesorios Sugeridos
        </h2>

        <div>
          <button
            onClick={() => setDrawerOpen(true)}
            title="Agregar productos"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition"
          >
            <span className="text-lg leading-none">+</span>
            Agregar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: '40%' }} /> {/* material */}
            <col style={{ width: '16%' }} /> {/* cantidad */}
            <col style={{ width: '14%' }} /> {/* unitario */}
            <col style={{ width: '10%' }} /> {/* iva */}
            <col style={{ width: '10%' }} /> {/* descuento */}
            <col style={{ width: '10%' }} /> {/* total con iva */}
          </colgroup>

          <thead className="bg-white border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Material</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Unitario (sin IVA)</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">IVA</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Descuento</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total con IVA</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {local.map((material, idx) => {
              const qty = material.quantity ?? 0;
              const unit = material.unitPrice ?? 0;
              const ivaDecimal = material.iva ?? 0.13;
              const totalSinIVA = unit * qty;
              const totalConIVA = totalSinIVA * (1 + ivaDecimal);
              const discount = Math.max(0, material.discount ?? 0);
              const totalFinal = Math.max(0, totalConIVA - discount);

              return (
                <tr key={material.id ?? idx} className="group hover:bg-gray-50 transition-colors relative">
                  {/* Material */}
                  <td className="px-6 py-4 align-top">
                    <div className="font-bold text-gray-700">{material.name}</div>
                    {material.description && <div className="text-xs text-gray-500 mt-0.5">{material.description}</div>}
                  </td>

                  {/* Cantidad (más espacio, bold, color similar a descripción pero en negrita) */}
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => decrement(idx)}
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition transform active:scale-95 flex items-center justify-center"
                        aria-label={`Disminuir cantidad ${material.name}`}
                        title="Disminuir"
                      >
                        −
                      </button>

                      <div className="min-w-[72px] text-center">
                        <div className="font-bold text-gray-500">{qty} Unid.</div>
                      </div>

                      <button
                        onClick={() => increment(idx)}
                        className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:border-cyan-500 hover:text-cyan-600 transition transform active:scale-95 flex items-center justify-center"
                        aria-label={`Aumentar cantidad ${material.name}`}
                        title="Aumentar"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Unitario (sin IVA) */}
                  <td className="px-6 py-4 text-right align-top text-gray-600">
                    {formatCurrency(unit)}
                  </td>

                  {/* IVA editable */}
                  <td
                    className="px-6 py-4 text-right align-top"
                    onDoubleClick={() => startEditIva(idx)}
                    title="Doble click para editar IVA"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') startEditIva(idx); }}
                  >
                    {editingIvaRow === idx ? (
                      <input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        className="w-20 text-right border px-2 py-1 rounded text-sm"
                        value={editingIvaValue}
                        onChange={(e) => setEditingIvaValue(e.target.value)}
                        onBlur={() => commitEditIva(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditIva(idx);
                          if (e.key === 'Escape') cancelEditIva();
                        }}
                      />
                    ) : (
                      <div className="font-semibold text-gray-800">
                        {(ivaDecimal * 100).toFixed(2).replace(/\.00$/, '')}%
                      </div>
                    )}
                  </td>

                  {/* Descuento editable */}
                  <td
                    className="px-6 py-4 text-right align-top"
                    onDoubleClick={() => startEditDiscount(idx)}
                    title="Doble click para editar descuento"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') startEditDiscount(idx); }}
                  >
                    {editingDiscountRow === idx ? (
                      <input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        className="w-20 text-right border px-2 py-1 rounded text-sm"
                        value={editingDiscountValue}
                        onChange={(e) => setEditingDiscountValue(e.target.value)}
                        onBlur={() => commitEditDiscount(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditDiscount(idx);
                          if (e.key === 'Escape') cancelEditDiscount();
                        }}
                      />
                    ) : (
                      <div className="font-semibold text-gray-800">{material.discount ? formatCurrency(material.discount) : 'Vacío'}</div>
                    )}
                  </td>

                  {/* Total con IVA - alineada a la derecha */}
                  <td className="px-6 py-4 text-right align-top font-semibold text-cyan-600 pr-12"> 
                    {/* pr-12 leaves breathing room for the ✕ */}
                    {formatCurrency(totalFinal)}
                  </td>

                  {/* X superpuesta: positioned slightly to the right of the price, vertically centered */}
                  <button
                    onClick={() => handleRemove(idx)}
                    title="Eliminar"
                    aria-label={`Eliminar ${material.name}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    style={{
                      position: 'absolute',
                      right: 20,           // a bit to the right of the price column (keeps breathing room)
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: '2px 6px'
                    }}
                  >
                    ✕
                  </button>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer / panel maestro para agregar productos (simple) */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex"
        >
          {/* overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/30"
          />

          {/* panel */}
          <div className="relative ml-auto w-[420px] max-w-full bg-white h-full shadow-2xl p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Agregar productos</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-800">Cerrar</button>
            </div>

            <div className="space-y-4">
              {availableProducts.map((p, i) => {
                const selQty = selectedToAdd[i] ?? 0;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 border rounded">
                    <div>
                      <div className="font-medium text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.description}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={selQty}
                        onChange={(e) => setSelectedQty(i, Number(e.target.value || 0))}
                        className="w-20 text-right border px-2 py-1 rounded text-sm"
                        aria-label={`Cantidad ${p.name}`}
                      />
                      <button
                        onClick={() => toggleSelectProduct(i)}
                        className={`px-3 py-1 rounded text-sm ${selectedToAdd[i] ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {selectedToAdd[i] ? 'Seleccionado' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setSelectedToAdd({}); setDrawerOpen(false); }}
                className="px-4 py-2 rounded border text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddSelected}
                className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 text-sm"
              >
                Agregar seleccionados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}