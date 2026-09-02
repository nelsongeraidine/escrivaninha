import { describe, it, expect, vi } from 'vitest';
import { BitmapCache } from './bitmapCache';

function fake(w: number, h: number) {
  return { width: w, height: h, close: vi.fn() };
}

describe('BitmapCache', () => {
  it('guarda e recupera por página e escala', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const b = fake(10, 10);
    c.set(1, 2, b);
    expect(c.get(1, 2)).toBe(b);
    expect(c.get(1, 3)).toBeUndefined();
  });
  it('evicta o menos usado e fecha o bitmap', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>({ maxEntries: 2 });
    const a = fake(1, 1), b = fake(1, 1), d = fake(1, 1);
    c.set(1, 1, a); c.set(2, 1, b);
    c.get(1, 1); // toca a; b vira o menos recente
    c.set(3, 1, d);
    expect(c.get(2, 1)).toBeUndefined();
    expect(b.close).toHaveBeenCalled();
    expect(c.get(1, 1)).toBe(a);
  });
  it('evicta por bytes (w*h*4)', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>({ maxBytes: 1000 });
    const a = fake(10, 10); // 400 B
    const b = fake(10, 10); // 400 B
    const d = fake(10, 10); // 400 B -> excede 1000
    c.set(1, 1, a); c.set(2, 1, b); c.set(3, 1, d);
    expect(c.size).toBe(2);
    expect(a.close).toHaveBeenCalled();
  });
  it('substituir a mesma chave fecha o antigo', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const a = fake(1, 1), b = fake(1, 1);
    c.set(1, 1, a); c.set(1, 1, b);
    expect(a.close).toHaveBeenCalled();
    expect(c.get(1, 1)).toBe(b);
  });
  it('clear fecha tudo', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const a = fake(1, 1); c.set(1, 1, a); c.clear();
    expect(a.close).toHaveBeenCalled();
    expect(c.size).toBe(0);
  });
});
