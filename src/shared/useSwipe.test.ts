import { describe, it, expect } from 'vitest';
import { detectSwipe } from './useSwipe';

describe('detectSwipe', () => {
  it('esquerda quando dx negativo além do limiar', () => {
    expect(detectSwipe({ x: 200, y: 100 }, { x: 120, y: 110 })).toBe('left');
  });
  it('direita quando dx positivo', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 180, y: 90 })).toBe('right');
  });
  it('ignora curto ou predominantemente vertical', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 130, y: 100 })).toBeNull();
    expect(detectSwipe({ x: 100, y: 100 }, { x: 170, y: 200 })).toBeNull();
  });
});
