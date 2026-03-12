import { Material } from '../types/calculator';

const COUNTER_KEY = 'pcr.quote.counters.v2';
const STORE_KEY = 'pcr.quote.store.v2';

interface CounterState {
  quote: number;
  draft: number;
}

export interface StoredQuote {
  id: string;
  number: string;
  kind: 'quote' | 'draft';
  module: string;
  clientName?: string;
  phone?: string;
  width: number;
  height: number;
  total: number;
  materials: Material[];
  createdAt: string;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

const readCounters = (): CounterState => {
  if (!isBrowser()) return { quote: 0, draft: 0 };
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (!raw) return { quote: 0, draft: 0 };
    const parsed = JSON.parse(raw) as CounterState;
    return {
      quote: parsed.quote ?? 0,
      draft: parsed.draft ?? 0
    };
  } catch {
    return { quote: 0, draft: 0 };
  }
};

const writeCounters = (state: CounterState): void => {
  if (!isBrowser()) return;
  localStorage.setItem(COUNTER_KEY, JSON.stringify(state));
};

const readStore = (): StoredQuote[] => {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredQuote[];
  } catch {
    return [];
  }
};

const writeStore = (items: StoredQuote[]): void => {
  if (!isBrowser()) return;
  localStorage.setItem(STORE_KEY, JSON.stringify(items));
};

const nextNumber = (kind: 'quote' | 'draft'): string => {
  const counters = readCounters();
  if (kind === 'quote') {
    counters.quote += 1;
    writeCounters(counters);
    return `C-${String(counters.quote).padStart(4, '0')}`;
  }

  counters.draft += 1;
  writeCounters(counters);
  return `B-${String(counters.draft).padStart(4, '0')}`;
};

export const generateGlobalNumber = (kind: 'quote' | 'draft'): string => nextNumber(kind);

export const saveStoredQuote = (payload: Omit<StoredQuote, 'id' | 'createdAt'>): StoredQuote => {
  const entry: StoredQuote = {
    ...payload,
    id: `${payload.number}-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  const current = readStore();
  writeStore([entry, ...current]);
  return entry;
};

export const listStoredQuotes = (): StoredQuote[] => readStore();

export const listStoredByKind = (kind: 'quote' | 'draft'): StoredQuote[] => readStore().filter((item) => item.kind === kind);
