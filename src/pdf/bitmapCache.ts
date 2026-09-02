export interface BitmapLike { width: number; height: number; close(): void }

const DEFAULT_MAX_ENTRIES = 24;
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

/**
 * LRU de bitmaps já renderizados. Um Map preserva ordem de inserção, então
 * re-inserir uma chave ao ler a move para o fim (mais recente).
 */
export class BitmapCache<T extends BitmapLike = ImageBitmap> {
  private readonly map = new Map<string, T>();
  private bytes = 0;
  private readonly maxEntries: number;
  private readonly maxBytes: number;

  constructor(opts: { maxEntries?: number; maxBytes?: number } = {}) {
    this.maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  }

  key(page: number, scale: number): string {
    return `${page}@${scale.toFixed(3)}`;
  }

  get size(): number { return this.map.size; }

  get(page: number, scale: number): T | undefined {
    const k = this.key(page, scale);
    const v = this.map.get(k);
    if (v === undefined) return undefined;
    this.map.delete(k);
    this.map.set(k, v);
    return v;
  }

  set(page: number, scale: number, bitmap: T): void {
    const k = this.key(page, scale);
    const old = this.map.get(k);
    if (old) { this.map.delete(k); this.bytes -= sizeOf(old); old.close(); }
    this.map.set(k, bitmap);
    this.bytes += sizeOf(bitmap);
    this.evict();
  }

  clear(): void {
    for (const v of this.map.values()) v.close();
    this.map.clear();
    this.bytes = 0;
  }

  private evict(): void {
    while (this.map.size > this.maxEntries || this.bytes > this.maxBytes) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      const v = this.map.get(oldest.value)!;
      this.map.delete(oldest.value);
      this.bytes -= sizeOf(v);
      v.close();
    }
  }
}

function sizeOf(b: BitmapLike): number {
  return b.width * b.height * 4;
}
