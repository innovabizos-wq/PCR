import { RealtimeChannel } from '@supabase/supabase-js';
import { catalogProducts, CatalogProduct } from '../data/catalog';
import { getCatalogProducts } from './catalogService';
import { supabase } from '../lib/supabase';
import { CompanyId } from '../types/company';
import { trackEvent } from './telemetryService';
import { validateInventoryProduct } from '../domain/inventory/validation';

const TABLE_NAME = 'inventory_products';
const OFFLINE_QUEUE_KEY = 'pcr.inventory.commands.v1';

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

interface PendingInventoryCommand {
  idempotencyKey: string;
  expectedUpdatedAt: string;
  companyId: CompanyId;
  products: CatalogProduct[];
  attempts: number;
  createdAt: string;
}

export interface SaveInventoryInput {
  products: CatalogProduct[];
  companyId: CompanyId;
  expectedUpdatedAt: string;
  idempotencyKey?: string;
}

export interface SaveInventoryResult {
  status: 'ok' | 'conflict' | 'queued-offline';
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

const readOfflineQueue = (): PendingInventoryCommand[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PendingInventoryCommand[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistOfflineQueue = (queue: PendingInventoryCommand[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-25)));
};


export async function getInventoryProducts(companyId: CompanyId): Promise<{ products: CatalogProduct[]; snapshotUpdatedAt: string }> {
  const products = await getCatalogProducts();

  if (products.length > 0 && !supabase) {
    return { products, snapshotUpdatedAt: new Date().toISOString() };
  }

  if (!supabase) {
    return { products: catalogProducts, snapshotUpdatedAt: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('company_id', companyId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return { products: catalogProducts, snapshotUpdatedAt: new Date().toISOString() };
  }

  const snapshotUpdatedAt = (data[0] as InventoryRow).updated_at ?? new Date().toISOString();
  return { products: (data as InventoryRow[]).map(fromRow), snapshotUpdatedAt };
}

export async function saveInventoryProducts(input: SaveInventoryInput): Promise<SaveInventoryResult> {
  const idempotencyKey = input.idempotencyKey ?? generateIdempotencyKey();
  input.products.forEach(validateInventoryProduct);

  if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    const queued: PendingInventoryCommand = {
      idempotencyKey,
      companyId: input.companyId,
      expectedUpdatedAt: input.expectedUpdatedAt,
      products: input.products,
      attempts: 0,
      createdAt: new Date().toISOString()
    };
    persistOfflineQueue([...readOfflineQueue(), queued]);
    await trackEvent('inventory_command_queued_offline', {
      module: 'inventory',
      metadata: { companyId: input.companyId, idempotencyKey }
    });
    return { status: 'queued-offline', idempotencyKey };
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

export async function flushInventoryOfflineQueue(): Promise<void> {
  const queue = readOfflineQueue();
  if (!supabase || queue.length === 0) return;

  const keep: PendingInventoryCommand[] = [];

  for (const command of queue) {
    try {
      const waitMs = Math.min(1000 * 2 ** command.attempts, 15000);
      if (command.attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      const result = await saveInventoryProducts({
        companyId: command.companyId,
        products: command.products,
        expectedUpdatedAt: command.expectedUpdatedAt,
        idempotencyKey: command.idempotencyKey
      });

      if (result.status === 'conflict') {
        keep.push({ ...command, attempts: command.attempts + 1 });
      }
    } catch {
      keep.push({ ...command, attempts: command.attempts + 1 });
    }
  }

  persistOfflineQueue(keep);
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
