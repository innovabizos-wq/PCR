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

type InventoryFailureKind = 'validation' | 'auth' | 'rls' | 'conflict' | 'network' | 'consistency' | 'unknown';

class InventoryPersistenceError extends Error {
  kind: InventoryFailureKind;

  constructor(kind: InventoryFailureKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'InventoryPersistenceError';
  }
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

const ensureSessionCompanyAccess = async (client: NonNullable<typeof supabase>, companyId: CompanyId): Promise<void> => {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    throw new InventoryPersistenceError('auth', `AUTH: sesión inválida o expirada. Debes iniciar sesión de nuevo para guardar en ${companyId}.`);
  }

  const companyIds = data.session.user.app_metadata?.company_ids;
  const normalized = Array.isArray(companyIds) ? companyIds.filter((item): item is string => typeof item === 'string') : [];
  if (!normalized.includes(companyId)) {
    throw new InventoryPersistenceError(
      'auth',
      `AUTH_METADATA_MISMATCH: tu JWT no contiene acceso a ${companyId}. Contacta a soporte para sincronizar app_metadata.company_ids y user_company_access, luego vuelve a iniciar sesión.`
    );
  }
};

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

  try {
    input.products.forEach(validateInventoryProduct);
  } catch (error) {
    throw new InventoryPersistenceError('validation', `VALIDATION: ${(error as Error).message}`);
  }

  if (!supabase) {
    throw new Error('Inventario no disponible: conexión a base de datos no configurada.');
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new InventoryPersistenceError('network', 'NETWORK_OFFLINE: Sin conexión. No se guardaron cambios fuera de línea.');
  }

  await ensureSessionCompanyAccess(supabase, input.companyId);

  const payload = input.products.map((item) => toRow(item, input.companyId));
  const { data, error } = await supabase.rpc('inventory_bulk_upsert', {
    p_company_id: input.companyId,
    p_items: payload,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_idempotency_key: idempotencyKey
  });

  if (error) {
    const raw = `${error.code ?? 'UNKNOWN'} ${error.message ?? ''}`.toLowerCase();
    if (raw.includes('permission denied') || raw.includes('row-level security') || error.code === '42501') {
      throw new InventoryPersistenceError('rls', `RLS: Supabase bloqueó la operación (${error.code ?? 'sin código'}). ${error.message}`);
    }
    if (raw.includes('jwt') || raw.includes('auth') || error.code === 'PGRST301') {
      throw new InventoryPersistenceError('auth', `AUTH: Error de sesión al guardar (${error.code ?? 'sin código'}). ${error.message}`);
    }
    throw new InventoryPersistenceError('unknown', `DB: Error guardando inventario (${error.code ?? 'sin código'}). ${error.message}`);
  }

  const result = data as { status: 'ok' | 'conflict'; conflicts?: Array<{ id: string; db_updated_at: string; db_version: number }> };

  if (result.status === 'conflict') {
    await trackEvent('inventory_save_conflict', {
      module: 'inventory',
      metadata: { companyId: input.companyId, conflicts: result.conflicts?.length ?? 0 }
    });
    return { status: 'conflict', idempotencyKey, conflicts: result.conflicts };
  }

  const expectedIds = new Set(input.products.map((item) => item.id));
  const { data: verifyData, error: verifyError } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('company_id', input.companyId)
    .in('id', [...expectedIds]);

  if (verifyError) {
    throw new InventoryPersistenceError('consistency', `CONSISTENCY_READ_FAILED: se escribió pero no se pudo verificar lectura (${verifyError.code ?? 'sin código'}). ${verifyError.message}`);
  }

  if ((verifyData ?? []).length !== expectedIds.size) {
    throw new InventoryPersistenceError(
      'consistency',
      `CONSISTENCY_MISMATCH: write OK pero read devolvió ${(verifyData ?? []).length}/${expectedIds.size} filas. Posible RLS/sesión desalineada.`
    );
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
