import { describe, it, expect } from 'vitest';
import { nextZoom, prevZoom, normalizeZoom, ZOOM_LEVELS } from './zoomLevels';

describe('zoomLevels', () => {
  it('avança e trava no máximo', () => {
    expect(nextZoom(100)).toBe(125);
    expect(nextZoom(200)).toBe(200);
  });
  it('recua e trava no mínimo', () => {
    expect(prevZoom(100)).toBe(75);
    expect(prevZoom(50)).toBe(50);
  });
  it('normaliza valores fora da lista para o mais próximo', () => {
    expect(normalizeZoom(110)).toBe(100);
    expect(normalizeZoom(999)).toBe(200);
    expect(normalizeZoom(NaN)).toBe(100);
    expect(ZOOM_LEVELS[0]).toBe(50);
  });
});
