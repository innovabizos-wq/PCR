import { RealtimeChannel } from '@supabase/supabase-js';
import { CatalogProduct } from '../data/catalog';
import { supabase } from '../lib/supabase';
import { CompanyId } from '../types/company';
import { trackEvent } from './telemetryService';
import { validateInventoryProduct } from '../domain/inventory/validation';

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
  company_id: CompanyId;
  updated_at?: string;
  version?: number;
}

export interface SaveInventoryInput {
  products: CatalogProduct[];
  companyId: CompanyId;
  expectedUpdatedAt: string;
  idempotencyKey?: string;
}

export interface SaveInventoryResult {
  status: 'ok' | 'conflict';
  conflicts?: Array<{ id: string; db_updated_at: string; db_version: number }>;
  idempotencyKey: string;
}

const toRow = (item: CatalogProduct, companyId: CompanyId): InventoryRow => ({
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
  catalog_version_id: null,
  company_id: companyId
});

const fromRow = (row: InventoryRow): CatalogProduct => ({
  id: row.id,
  sku: row.sku,
  nombre: row.nombre,
  categoria: row.categoria as CatalogProduct['categoria'],
  descripcion: row.descripcion,
  precio: row.precio,
  impuesto: row.impuesto,
  tamano: row.tamano,
  estiloFoto: row.estilo_foto,
  stock: row.stock,
  garantia: row.garantia,
  cuentaCobro: row.cuenta_cobro,
  cuentasPago: row.cuentas_pago
});

const generateIdempotencyKey = () => `inv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export async function getInventoryProducts(companyId: CompanyId): Promise<{ products: CatalogProduct[]; snapshotUpdatedAt: string }> {
  if (!supabase) {
    throw new Error('Inventario no disponible: conexión a base de datos no configurada.');
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return { products: [], snapshotUpdatedAt: new Date().toISOString() };
  }

  const snapshotUpdatedAt = (data[0] as InventoryRow).updated_at ?? new Date().toISOString();
  return { products: (data as InventoryRow[]).map(fromRow), snapshotUpdatedAt };
}

export async function saveInventoryProducts(input: SaveInventoryInput): Promise<SaveInventoryResult> {
  const idempotencyKey = input.idempotencyKey ?? generateIdempotencyKey();
  input.products.forEach(validateInventoryProduct);

  if (!supabase) {
    throw new Error('Inventario no disponible: conexión a base de datos no configurada.');
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sin conexión: no se guardaron cambios fuera de línea.');
  }

  const payload = input.products.map((item) => toRow(item, input.companyId));
  const { data, error } = await supabase.rpc('inventory_bulk_upsert', {
    p_company_id: input.companyId,
    p_items: payload,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_idempotency_key: idempotencyKey
  });

  if (error) throw error;

  const result = data as { status: 'ok' | 'conflict'; conflicts?: Array<{ id: string; db_updated_at: string; db_version: number }> };

  if (result.status === 'conflict') {
    await trackEvent('inventory_save_conflict', {
      module: 'inventory',
      metadata: { companyId: input.companyId, conflicts: result.conflicts?.length ?? 0 }
    });
    return { status: 'conflict', idempotencyKey, conflicts: result.conflicts };
  }

  await trackEvent('inventory_save_success', {
    module: 'inventory',
    metadata: { companyId: input.companyId, updatedCount: input.products.length }
  });

  return { status: 'ok', idempotencyKey };
}


export function subscribeInventory(companyId: CompanyId, onInvalidate: () => void): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase
    .channel(`inventory-${companyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLE_NAME,
        filter: `company_id=eq.${companyId}`
      },
      () => onInvalidate()
    )
    .subscribe();

  return channel;
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
