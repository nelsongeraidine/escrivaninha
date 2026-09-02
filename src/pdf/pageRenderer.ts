import type { LoadedDocument } from './pdfDocument';
import { BitmapCache } from './bitmapCache';

export type Priority = 'visible' | 'prefetch';

export interface RenderBackend {
  render(page: number, scale: number, signal: AbortSignal): Promise<ImageBitmap>;
}

interface Job {
  page: number;
  scale: number;
  priority: Priority;
  controller: AbortController;
  promise: Promise<ImageBitmap>;
  resolve: (b: ImageBitmap) => void;
  reject: (e: unknown) => void;
  started: boolean;
}

/**
 * Fila com concorrência limitada. Renderizar é caro e o usuário pula páginas:
 * a fila garante que o que está na tela ganha do prefetch e que o que saiu da
 * janela é cancelado em vez de ocupar o worker.
 */
export class PageRenderer {
  private readonly jobs = new Map<string, Job>();
  private running = 0;
  // erasableSyntaxOnly está ligado: sem parameter properties, os campos são
  // declarados e atribuídos à mão no corpo do construtor.
  private readonly backend: RenderBackend;
  private readonly cache: BitmapCache;
  private readonly concurrency: number;

  constructor(backend: RenderBackend, cache: BitmapCache, concurrency = 2) {
    this.backend = backend;
    this.cache = cache;
    this.concurrency = concurrency;
  }

  request(page: number, scale: number, priority: Priority): Promise<ImageBitmap> {
    const cached = this.cache.get(page, scale);
    if (cached) return Promise.resolve(cached);

    const key = this.cache.key(page, scale);
    const existing = this.jobs.get(key);
    if (existing) {
      if (priority === 'visible') existing.priority = 'visible';
      return existing.promise;
    }

    let resolve!: (b: ImageBitmap) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<ImageBitmap>((res, rej) => { resolve = res; reject = rej; });
    // Evita "unhandled rejection" quando ninguém mais espera um job cancelado.
    promise.catch(() => undefined);
    const job: Job = { page, scale, priority, controller: new AbortController(), promise, resolve, reject, started: false };
    this.jobs.set(key, job);
    this.pump();
    return promise;
  }

  retainOnly(keep: ReadonlySet<number>): void {
    for (const [key, job] of this.jobs) {
      if (!keep.has(job.page)) {
        job.controller.abort();
        job.reject(Object.assign(new Error('render cancelado'), { name: 'AbortError' }));
        this.jobs.delete(key);
        // Só devolve a vaga se o job realmente ocupava uma; o guard no `finally`
        // do pump impede um segundo decremento quando ele terminar.
        if (job.started) this.running--;
      }
    }
    this.pump();
  }

  dispose(): void {
    this.retainOnly(new Set());
    // Além de abortar a fila, fecha os bitmaps já renderizados: sem isso, trocar
    // de livro deixaria vazar até ~100 MB de ImageBitmaps que ninguém mais usa.
    this.cache.clear();
  }

  private pump(): void {
    while (this.running < this.concurrency) {
      const next = this.pickNext();
      if (!next) return;
      next.started = true;
      this.running++;
      const key = this.cache.key(next.page, next.scale);
      this.backend.render(next.page, next.scale, next.controller.signal)
        .then((bitmap) => {
          if (next.controller.signal.aborted) { bitmap.close(); return; }
          this.cache.set(next.page, next.scale, bitmap);
          next.resolve(bitmap);
        })
        .catch((e) => { if (!next.controller.signal.aborted) next.reject(e); })
        .finally(() => {
          // Só libera a vaga se o job ainda está registrado: retainOnly pode
          // tê-lo removido e já decrementado `running`.
          if (this.jobs.get(key) === next) {
            this.jobs.delete(key);
            this.running--;
          }
          this.pump();
        });
    }
  }

  private pickNext(): Job | undefined {
    let best: Job | undefined;
    for (const job of this.jobs.values()) {
      if (job.started) continue;
      if (!best || (job.priority === 'visible' && best.priority !== 'visible')) best = job;
    }
    return best;
  }
}

export function createPdfBackend(loaded: LoadedDocument): RenderBackend {
  return {
    async render(pageNumber, scale, signal) {
      const page = await loaded.doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const task = page.render({ canvas, viewport });
      const onAbort = () => task.cancel();
      signal.addEventListener('abort', onAbort, { once: true });
      try {
        await task.promise;
        // ImageBitmap é desenhado sem custo de layout e libera o canvas temporário.
        return await createImageBitmap(canvas);
      } finally {
        signal.removeEventListener('abort', onAbort);
        canvas.width = 0; canvas.height = 0;
      }
    },
  };
}
