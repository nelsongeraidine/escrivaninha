import { describe, it, expect, vi } from 'vitest';
import { PageRenderer, type RenderBackend } from './pageRenderer';
import { BitmapCache } from './bitmapCache';

function bitmap(): ImageBitmap {
  return { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
}

/** Backend controlável: resolve quando o teste mandar. */
function controllableBackend() {
  const pending = new Map<number, { resolve: (b: ImageBitmap) => void; reject: (e: unknown) => void; signal: AbortSignal }>();
  const backend: RenderBackend = {
    render: (page, _scale, signal) =>
      new Promise((resolve, reject) => {
        pending.set(page, { resolve, reject, signal });
        signal.addEventListener('abort', () => reject(Object.assign(new Error('cancel'), { name: 'AbortError' })));
      }),
  };
  return { backend, pending };
}

describe('PageRenderer', () => {
  it('devolve do cache sem chamar o backend', async () => {
    const cache = new BitmapCache();
    const b = bitmap(); cache.set(1, 1, b);
    const backend: RenderBackend = { render: vi.fn() };
    const r = new PageRenderer(backend, cache);
    await expect(r.request(1, 1, 'visible')).resolves.toBe(b);
    expect(backend.render).not.toHaveBeenCalled();
  });

  it('respeita concorrência 2 e prioriza visível', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 2);
    const p1 = r.request(1, 1, 'prefetch');
    const p2 = r.request(2, 1, 'prefetch');
    const p3 = r.request(3, 1, 'prefetch');
    const p4 = r.request(4, 1, 'visible');
    await new Promise((res) => setTimeout(res, 0));
    expect([...pending.keys()]).toEqual([1, 2]);
    pending.get(1)!.resolve(bitmap());
    await p1;
    await new Promise((res) => setTimeout(res, 0));
    // A visível (4) entra antes da 3, que foi pedida antes.
    expect([...pending.keys()]).toContain(4);
    expect(pending.has(3)).toBe(false);
    pending.get(2)!.resolve(bitmap()); await p2;
    pending.get(4)!.resolve(bitmap()); await p4;
    await new Promise((res) => setTimeout(res, 0));
    pending.get(3)!.resolve(bitmap()); await p3;
  });

  it('deduplica pedidos iguais em voo', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 2);
    const a = r.request(5, 1, 'visible');
    const b = r.request(5, 1, 'visible');
    await Promise.resolve();
    expect(pending.size).toBe(1);
    pending.get(5)!.resolve(bitmap());
    expect(await a).toBe(await b);
  });

  it('dispose limpa o cache e fecha os bitmaps retidos', async () => {
    const { backend, pending } = controllableBackend();
    const cache = new BitmapCache();
    const r = new PageRenderer(backend, cache, 1);
    const p = r.request(1, 1, 'visible');
    await Promise.resolve();
    const b = bitmap();
    pending.get(1)!.resolve(b);
    await p;
    expect(cache.size).toBe(1);
    r.dispose();
    expect(cache.size).toBe(0);
    expect(b.close).toHaveBeenCalled();
  });

  it('retainOnly cancela pendentes fora da janela', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 1);
    const p1 = r.request(1, 1, 'prefetch');
    const p9 = r.request(9, 1, 'prefetch');
    await Promise.resolve();
    r.retainOnly(new Set([1]));
    await expect(p9).rejects.toMatchObject({ name: 'AbortError' });
    pending.get(1)!.resolve(bitmap());
    await expect(p1).resolves.toBeTruthy();
  });
});
