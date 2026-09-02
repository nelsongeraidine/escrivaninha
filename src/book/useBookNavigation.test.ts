import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ViewMode } from './spreadLayout';
import { useBookNavigation } from './useBookNavigation';

describe('useBookNavigation', () => {
  it('começa no spread da página inicial', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 5, true));
    expect(result.current.spreadIndex).toBe(2);
    expect(result.current.currentPage).toBe(4);
  });
  it('next inicia flip e finishFlip aplica', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 1, true));
    act(() => result.current.next());
    expect(result.current.flip).toEqual({ from: 0, to: 1, direction: 'forward', front: 1, back: 2 });
    expect(result.current.spreadIndex).toBe(0);
    act(() => result.current.finishFlip());
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(1);
  });
  it('sem animação aplica direto', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 1, false));
    act(() => result.current.next());
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(1);
  });
  it('enfileira no máximo uma entrada durante o flip', () => {
    const { result } = renderHook(() => useBookNavigation(20, 'spread', 1, true));
    // act separados: cada next() precisa enxergar o `flip` já commitado do anterior
    // para provar que só uma entrada fica na fila (as duas últimas colapsam numa).
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.finishFlip());
    expect(result.current.spreadIndex).toBe(1);
    expect(result.current.flip).toEqual(expect.objectContaining({ from: 1, to: 2 }));
    act(() => result.current.finishFlip());
    expect(result.current.spreadIndex).toBe(2);
    expect(result.current.flip).toBeNull();
  });
  it('respeita limites', () => {
    const { result } = renderHook(() => useBookNavigation(3, 'single', 1, false));
    act(() => result.current.prev());
    expect(result.current.spreadIndex).toBe(0);
    act(() => result.current.goToPage(99));
    expect(result.current.currentPage).toBe(3);
    act(() => result.current.next());
    expect(result.current.spreadIndex).toBe(2);
  });
  it('goToPage distante não anima, só salta', () => {
    const { result } = renderHook(() => useBookNavigation(50, 'spread', 1, true));
    act(() => result.current.goToPage(40));
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(20);
  });
  it('trocar de modo preserva a página atual', () => {
    const { result, rerender } = renderHook(
      ({ mode }: { mode: ViewMode }) => useBookNavigation(20, mode, 7, false),
      { initialProps: { mode: 'spread' as ViewMode } },
    );
    expect(result.current.currentPage).toBe(6);
    rerender({ mode: 'single' });
    expect(result.current.currentPage).toBe(6);
    expect(result.current.spreadIndex).toBe(5);
  });
});
