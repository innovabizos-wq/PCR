import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Minus, MoreVertical, Plus, Save, Search, Upload } from 'lucide-react';
import { catalogProducts, CatalogCategory, CatalogProduct } from '../data/catalog';
import { getInventoryProducts, saveInventoryProducts, subscribeInventory, uploadTextureFile } from '../services/inventoryService';
import { toUserMessage } from '../utils/appError';

type InventoryStatus = 'optimo' | 'bajo' | 'agotado';

interface InventoryItem extends CatalogProduct {
  status: InventoryStatus;
  location: string;
  aisle: string;
}

const columns: Array<{ key: keyof CatalogProduct; label: string }> = [
  { key: 'sku', label: 'SKU' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria', label: 'Tipo/Categoría' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'precio', label: 'Precio' },
  { key: 'impuesto', label: 'Impuesto' },
  { key: 'tamano', label: 'Tamaño' },
  { key: 'estiloFoto', label: 'Textura/Foto' },
  { key: 'stock', label: 'Cantidad total' },
  { key: 'garantia', label: 'Garantía' },
  { key: 'cuentaCobro', label: 'Cuenta cobro' }
];

const statusStyles: Record<InventoryStatus, string> = {
  optimo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bajo: 'bg-red-50 text-red-700 border-red-200',
  agotado: 'bg-red-100 text-red-800 border-red-200'
};

const stockStatus = (stock: number): InventoryStatus => {
  if (stock <= 0) return 'agotado';
  if (stock < 20) return 'bajo';
  return 'optimo';
};

const buildDraftRow = (): CatalogProduct => {
  const stamp = Date.now();
  return {
    id: `custom-${stamp}`,
    sku: `SKU-${stamp}`,
    nombre: `Producto ${new Date(stamp).toLocaleTimeString('es-CR', { hour12: false })}`,
    categoria: 'accesorio',
    descripcion: '',
    precio: 0,
    impuesto: 0.13,
    tamano: '',
    estiloFoto: '',
    stock: 50,
    garantia: '',
    cuentaCobro: '',
    cuentasPago: []
  };
};

interface InventoryPageProps {
  companyId: 'oz' | 'pt' | 'ds';
}

function InventoryPage({ companyId }: InventoryPageProps) {
  const [products, setProducts] = useState<CatalogProduct[]>(catalogProducts);
  const [draftProducts, setDraftProducts] = useState<CatalogProduct[]>(catalogProducts);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [warehouse, setWarehouse] = useState('Todos');
  const [status, setStatus] = useState('Todos');
  const [showSheet, setShowSheet] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; key: keyof CatalogProduct } | null>(null);
  const [savingSheet, setSavingSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState(new Date(0).toISOString());
  const [syncState, setSyncState] = useState<'confirmado' | 'sincronizando' | 'conflicto'>('confirmado');
  const [conflictRows, setConflictRows] = useState<Array<{ id: string; db_updated_at: string; db_version: number }>>([]);

  const loadInventory = useCallback(async () => {
    const response = await getInventoryProducts(companyId);
    setProducts(response.products);
    setDraftProducts(response.products);
    setSnapshotUpdatedAt(response.snapshotUpdatedAt);
  }, [companyId]);

  useEffect(() => {
    const load = async () => {
      try {
        await loadInventory();
      } catch (error) {
        setMessage(toUserMessage(error, 'No se pudo cargar el inventario.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, loadInventory]);

  useEffect(() => {
    const channel = subscribeInventory(companyId, () => {
      void loadInventory();
      setMessage('Inventario actualizado en tiempo real desde otro usuario/dispositivo.');
      setSyncState('confirmado');
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [companyId, loadInventory]);

  const inventoryRows = useMemo<InventoryItem[]>(() => {
    return products.map((product, index) => ({
      ...product,
      status: stockStatus(product.stock),
      location: `Almacén ${['A', 'B', 'C'][index % 3]}`,
      aisle: `Z-0${(index % 8) + 1} | E-${String.fromCharCode(65 + (index % 4))}`
    }));
  }, [products]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventoryRows.filter((item) => {
      const matchesSearch = !q || `${item.nombre} ${item.sku} ${item.categoria}`.toLowerCase().includes(q);
      const matchesCategory = category === 'Todas' || item.categoria === category;
      const matchesWarehouse = warehouse === 'Todos' || item.location.includes(warehouse);
      const matchesStatus =
        status === 'Todos' ||
        (status === 'Crítico' && item.status !== 'optimo') ||
        (status === 'Normal' && item.status === 'optimo');

      return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
    });
  }, [inventoryRows, search, category, warehouse, status]);

  const dashboardCards = useMemo(() => {
    const valorTotal = products.reduce((acc, item) => acc + item.precio * item.stock, 0);
    const criticos = inventoryRows.filter((item) => item.status !== 'optimo').length;
    const entradas = products.reduce((acc, item) => acc + item.stock, 0);
    const eficiencia = inventoryRows.length === 0 ? 0 : Math.round((inventoryRows.filter((i) => i.status === 'optimo').length / inventoryRows.length) * 1000) / 10;

    return [
      { label: 'Valor Total', value: `₡${Math.round(valorTotal).toLocaleString('es-CR')}`, note: 'Fuente: base de datos', tone: 'text-emerald-600' },
      { label: 'Stock Bajo', value: `${criticos} ítems`, note: 'Ver items críticos', tone: 'text-red-600' },
      { label: 'Entradas Mes', value: `${entradas.toLocaleString('es-CR')} unid.`, note: 'Stock consolidado', tone: 'text-indigo-600' },
      { label: 'Eficiencia', value: `${eficiencia}%`, note: 'Catálogo sincronizado', tone: 'text-emerald-600' }
    ];
  }, [products, inventoryRows]);

  const setCellValue = (id: string, key: keyof CatalogProduct, value: string) => {
    setDraftProducts((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (key === 'precio' || key === 'impuesto' || key === 'stock') {
          return { ...row, [key]: Number(value) || 0 };
        }
        if (key === 'categoria') {
          return { ...row, categoria: (value as CatalogCategory) || 'accesorio' };
        }
        return { ...row, [key]: value };
      })
    );
  };

  const setTextureUrl = (id: string, url: string) => {
    setDraftProducts((prev) => prev.map((row) => (row.id === id ? { ...row, estiloFoto: url, categoria: row.categoria === 'textura' ? 'textura' : row.categoria } : row)));
  };

  const addRow = () => {
    setDraftProducts((prev) => [...prev, buildDraftRow()]);
    setMessage('Fila nueva creada con valores mínimos válidos. Puedes editar SKU y nombre antes de guardar.');
  };

  const handleSaveSheet = async () => {
    const approved = window.confirm('¿Estás seguro que deseas realizar cambios en este módulo principal?');
    if (!approved) return;

    setSavingSheet(true);
    setSyncState('sincronizando');
    setMessage('');
    try {
      const result = await saveInventoryProducts({
        products: draftProducts,
        companyId,
        expectedUpdatedAt: snapshotUpdatedAt
      });

      if (result.status === 'conflict') {
        setSyncState('conflicto');
        setConflictRows(result.conflicts ?? []);
        setMessage('Conflicto detectado: el registro fue actualizado por otro usuario. Recargamos datos para mostrar diff vigente.');
        await loadInventory();
        return;
      }


      await loadInventory();
      setConflictRows([]);
      setSyncState('confirmado');
      setMessage('Cambios confirmados por servidor y propagados globalmente.');
      setShowSheet(false);
    } catch (error) {
      setSyncState('conflicto');
      setMessage(toUserMessage(error, 'Error guardando cambios.'));
    } finally {
      setSavingSheet(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl bg-slate-50 p-5">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0A1128]">Gestión de Inventario</h2>
          <p className="mt-1 text-sm text-slate-500">Módulo conectado a base de datos (Supabase) para trabajo multiusuario.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowSheet(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            <Download className="h-4 w-4" />
            Hoja de cálculo
          </button>
        </div>
      </section>

      {message && <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-700">{message}</div>}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">Estado de sincronización: <span className="font-semibold uppercase">{syncState}</span></div>
      {conflictRows.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">Registros con conflicto</p>
          <ul className="mt-2 list-disc pl-5">
            {conflictRows.map((conflict) => (
              <li key={conflict.id}>
                {conflict.id} · versión DB {conflict.db_version} · actualizado {new Date(conflict.db_updated_at).toLocaleString('es-CR')}
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setConflictRows([]);
              void loadInventory();
            }}
            className="mt-3 rounded border border-amber-500 bg-white px-2 py-1 font-semibold"
          >
            Reintentar con datos vigentes
          </button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        {dashboardCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-black ${card.tone}`}>{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm" placeholder="Buscar por nombre, SKU, categoría..." />
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option>Todas</option>
              <option value="policarbonato">Policarbonato</option>
              <option value="pvc">PVC</option>
              <option value="wpc">WPC</option>
              <option value="zacate">Zacate</option>
              <option value="accesorio">Accesorio</option>
              <option value="textura">Textura</option>
            </select>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Todos</option><option>A</option><option>B</option><option>C</option></select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Todos</option><option>Normal</option><option>Crítico</option></select>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">SKU</th><th className="px-3 py-3">Producto</th><th className="px-3 py-3">Categoría</th><th className="px-3 py-3">Precio</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Ubicación</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : filteredRows).map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{item.sku}</td>
                  <td className="px-3 py-2.5"><p className="font-semibold text-slate-800">{item.nombre}</p><p className="text-xs text-slate-400">{item.descripcion}</p></td>
                  <td className="px-3 py-2.5 text-xs uppercase text-slate-500">{item.categoria}</td>
                  <td className="px-3 py-2.5 font-semibold">₡{item.precio.toLocaleString('es-CR')}</td>
                  <td className="px-3 py-2.5"><div className={`text-sm font-bold tabular-nums ${item.status === 'optimo' ? 'text-slate-800' : 'text-red-600'}`}>{item.stock}</div></td>
                  <td className="px-3 py-2.5 text-xs text-slate-600"><p className="font-medium">{item.location}</p><p className="text-[10px] font-mono text-slate-400">{item.aisle}</p></td>
                  <td className="px-3 py-2.5 text-center"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[item.status]}`}>{item.status}</span></td>
                  <td className="px-3 py-2.5 text-right"><button className="text-slate-400 hover:text-slate-700"><MoreVertical className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <p>Mostrando <span className="font-medium text-slate-800">{loading ? 0 : filteredRows.length}</span> de <span className="font-medium text-slate-800">{products.length}</span> items</p>
          <div className="inline-flex items-center rounded-md border border-slate-300 bg-white"><button className="px-2 py-1.5 text-slate-400"><ChevronLeft className="h-4 w-4" /></button><button className="bg-[#0A1128] px-3 py-1.5 text-white">1</button><button className="px-2 py-1.5 text-slate-400"><ChevronRight className="h-4 w-4" /></button></div>
        </div>
      </section>

      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[85vh] w-[96vw] max-w-[1320px] flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black uppercase text-[#00011a]">Hoja de cálculo / panel de control</h3>
                <p className="text-xs text-slate-500">Doble clic para editar. Esta tabla es la fuente principal del sistema.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addRow} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold"><Plus className="h-3.5 w-3.5" /> Fila</button>
                <button onClick={handleSaveSheet} disabled={savingSheet} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><Save className="h-3.5 w-3.5" /> {savingSheet ? 'Guardando...' : 'Guardar'}</button>
                <button onClick={() => setShowSheet(false)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600"><Minus className="h-3.5 w-3.5" /> Cerrar</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full min-w-[1700px] border-collapse text-xs">
                <thead><tr className="bg-slate-100 text-left uppercase text-slate-600">{columns.map((column) => (<th key={column.key} className="border border-slate-200 px-2 py-2 font-bold">{column.label}</th>))}</tr></thead>
                <tbody>
                  {draftProducts.map((row) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                      {columns.map((column) => {
                        const isEditing = editingCell?.id === row.id && editingCell.key === column.key;
                        const cellValue = String(row[column.key] ?? '');
                        return (
                          <td key={`${row.id}-${column.key}`} className="border border-slate-200 px-2 py-1.5 align-top" onDoubleClick={() => setEditingCell({ id: row.id, key: column.key })}>
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
                              <div className="space-y-1">
                                <span>{cellValue || <span className="text-slate-300">(vacío)</span>}</span>
                                {column.key === 'estiloFoto' && (
                                  <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-cyan-300 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
                                    <Upload className="h-3 w-3" />
                                    Subir textura
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (event) => {
                                        const file = event.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const url = await uploadTextureFile(file);
                                          setTextureUrl(row.id, url);
                                        } catch (error) {
                                          setMessage(toUserMessage(error, 'No se pudo cargar textura.'));
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
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

export default InventoryPage;
