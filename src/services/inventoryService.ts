import { catalogProducts, CatalogCategory, CatalogProduct } from '../data/catalog';
import { supabase } from '../lib/supabase';

const TABLE_NAME = 'inventory_products';

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
}

const normalizeCategory = (value: string): CatalogCategory => {
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

const toRow = (item: CatalogProduct): InventoryRow => ({
  id: item.id,
  sku: item.sku,
  nombre: item.nombre,
  categoria: item.categoria,
  descripcion: item.descripcion,
  precio: Number(item.precio) || 0,
  impuesto: Number(item.impuesto) || 0.13,
  tamano: item.tamano,
  estilo_foto: item.estiloFoto,
  stock: Number(item.stock) || 0,
  garantia: item.garantia,
  cuenta_cobro: item.cuentaCobro,
  cuentas_pago: item.cuentasPago
});

export async function getInventoryProducts(): Promise<CatalogProduct[]> {
  if (!supabase) return catalogProducts;

  const { data, error } = await supabase.from(TABLE_NAME).select('*').order('created_at', { ascending: true });

  if (error) {
    console.warn('Error consultando inventario en Supabase, usando catálogo local.', error);
    return catalogProducts;
  }

  if (!data || data.length === 0) {
    await saveInventoryProducts(catalogProducts);
    return catalogProducts;
  }

  return data.map((row) => toCatalogProduct(row as Partial<InventoryRow>));
}

export async function saveInventoryProducts(products: CatalogProduct[]): Promise<void> {
  if (!supabase) return;

  const payload = products.map((item) => toRow(item));
  const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function uploadTextureFile(file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado para cargar texturas.');

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `texture-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `textures/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('textures').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('textures').getPublicUrl(path);
  return data.publicUrl;
}
