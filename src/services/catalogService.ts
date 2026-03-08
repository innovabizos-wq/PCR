import { catalogProducts, CatalogProduct, setRuntimeCatalogProducts } from '../data/catalog';
import { supabase } from '../lib/supabase';

const CATALOG_CACHE_KEY = 'pcr.catalog.cache';
const CATALOG_TTL_MS = 1000 * 60 * 10;

interface CatalogVersionRow {
  id: string;
  version_tag: string;
  is_active: boolean;
  created_at: string;
}

interface InventoryRow {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  impuesto: number;
  tamano: string;
  estilo_foto: string;
  stock: number;
  garantia: string;
  cuenta_cobro: string;
  cuentas_pago: string[];
  catalog_version_id: string | null;
}

interface CachedCatalog {
  cachedAt: number;
  versionTag: string;
  products: CatalogProduct[];
}

const normalizeCategory = (value: string): CatalogProduct['categoria'] => {
  if (value === 'policarbonato' || value === 'pvc' || value === 'wpc' || value === 'zacate' || value === 'accesorio' || value === 'textura') {
    return value;
  }
  return 'accesorio';
};

const toCatalogProduct = (item: Partial<InventoryRow>): CatalogProduct => ({
  id: item.id || `custom-${crypto.randomUUID()}`,
  sku: item.sku || '',
  nombre: item.nombre || '',
  categoria: normalizeCategory(item.categoria || 'accesorio'),
  descripcion: item.descripcion || '',
  precio: Number(item.precio) || 0,
  impuesto: Number(item.impuesto) || 0.13,
  tamano: item.tamano || '',
  estiloFoto: item.estilo_foto || '',
  stock: Number(item.stock) || 0,
  garantia: item.garantia || '',
  cuentaCobro: item.cuenta_cobro || '',
  cuentasPago: Array.isArray(item.cuentas_pago) ? item.cuentas_pago : []
});

const readCache = (): CachedCatalog | null => {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCatalog;
    if (!parsed?.cachedAt || !Array.isArray(parsed.products)) return null;
    if (Date.now() - parsed.cachedAt > CATALOG_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveCache = (products: CatalogProduct[], versionTag: string): void => {
  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), versionTag, products } satisfies CachedCatalog)
    );
  } catch {
    // Ignorar errores de cache del navegador.
  }
};

const fetchActiveCatalogVersion = async (): Promise<CatalogVersionRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('catalog_versions')
    .select('id, version_tag, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CatalogVersionRow | null) ?? null;
};

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const cached = typeof window !== 'undefined' ? readCache() : null;
  if (!supabase) {
    const fallback = cached?.products ?? catalogProducts;
    setRuntimeCatalogProducts(fallback);
    return fallback;
  }

  try {
    const activeVersion = await fetchActiveCatalogVersion();

    const query = supabase.from('inventory_products').select('*').order('created_at', { ascending: true });
    const scopedQuery = activeVersion ? query.eq('catalog_version_id', activeVersion.id) : query;

    const { data, error } = await scopedQuery;
    if (error) throw error;

    if (!data || data.length === 0) {
      const fallback = cached?.products ?? catalogProducts;
      setRuntimeCatalogProducts(fallback);
      return fallback;
    }

    const products = data.map((row) => toCatalogProduct(row as Partial<InventoryRow>));
    saveCache(products, activeVersion?.version_tag ?? 'legacy');
    setRuntimeCatalogProducts(products);
    return products;
  } catch (error) {
    console.warn('No se pudo cargar catálogo versionado, usando fallback local/cache.', error);
    const fallback = cached?.products ?? catalogProducts;
    setRuntimeCatalogProducts(fallback);
    return fallback;
  }
}
