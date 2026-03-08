import { catalogProducts, CatalogProduct } from '../data/catalog';
import { getCatalogProducts } from './catalogService';
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
  catalog_version_id: string | null;
}

const toRow = (item: CatalogProduct, catalogVersionId: string | null): InventoryRow => ({
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
  cuentas_pago: item.cuentasPago,
  catalog_version_id: catalogVersionId
});

const getActiveCatalogVersionId = async (): Promise<string | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('catalog_versions')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
};

export async function getInventoryProducts(): Promise<CatalogProduct[]> {
  const products = await getCatalogProducts();

  if (products.length > 0) return products;

  if (!supabase) return catalogProducts;
  await saveInventoryProducts(catalogProducts);
  return catalogProducts;
}

export async function saveInventoryProducts(products: CatalogProduct[]): Promise<void> {
  if (!supabase) return;

  const activeCatalogVersionId = await getActiveCatalogVersionId();
  const payload = products.map((item) => toRow(item, activeCatalogVersionId));
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
