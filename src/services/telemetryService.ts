import { supabase } from '../lib/supabase';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface TelemetryEvent {
  event: string;
  module?: string;
  page?: string;
  metadata?: Record<string, JsonValue>;
  timestamp: string;
}

const TELEMETRY_CACHE_KEY = 'pcr.telemetry.queue.v1';
const MAX_QUEUE = 30;

const readQueue = (): TelemetryEvent[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(TELEMETRY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TelemetryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveQueue = (events: TelemetryEvent[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TELEMETRY_CACHE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
  } catch {
    // Sin impacto funcional si falla almacenamiento de telemetría.
  }
};

export const trackEvent = async (
  event: string,
  payload: Omit<TelemetryEvent, 'event' | 'timestamp'> = {}
): Promise<void> => {
  const entry: TelemetryEvent = {
    event,
    module: payload.module,
    page: payload.page,
    metadata: payload.metadata,
    timestamp: new Date().toISOString()
  };

  const nextQueue = [...readQueue(), entry];
  saveQueue(nextQueue);

  if (!supabase) return;

  try {
    await supabase.from('telemetry_events').insert({
      event_name: entry.event,
      page: entry.page ?? null,
      module: entry.module ?? null,
      metadata: entry.metadata ?? {},
      happened_at: entry.timestamp
    });
  } catch {
    // Mantener cola local para no bloquear UX.
  }
};
