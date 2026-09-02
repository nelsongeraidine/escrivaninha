const KEY = 'escrivaninha.reading';

export interface ReadingState {
  name: string;
  size: number;
  page: number;
  zoom: number;
  updatedAt: number;
}

export function loadReadingState(): ReadingState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isReadingState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveReadingState(state: Omit<ReadingState, 'updatedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // Cota cheia ou modo privado: a leitura continua, só não persiste.
  }
}

export function clearReadingState(): void {
  try { localStorage.removeItem(KEY); } catch { /* idem */ }
}

export function matchesFile(state: ReadingState | null, file: { name: string; size: number }): boolean {
  return !!state && state.name === file.name && state.size === file.size;
}

function isReadingState(v: unknown): v is ReadingState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.size === 'number'
    && typeof o.page === 'number' && typeof o.zoom === 'number' && typeof o.updatedAt === 'number';
}
