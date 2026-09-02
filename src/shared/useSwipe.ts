import { useEffect, type RefObject } from 'react';

export function detectSwipe(
  start: { x: number; y: number },
  end: { x: number; y: number },
  threshold = 50,
): 'left' | 'right' | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < threshold) return null;
  // Predominantemente horizontal: evita disparar em rolagem vertical com zoom.
  if (Math.abs(dy) > Math.abs(dx) * 0.6) return null;
  return dx < 0 ? 'left' : 'right';
}

export function useSwipe(ref: RefObject<HTMLElement | null>, onSwipe: (dir: 'left' | 'right') => void): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    // Um único ponto de contato: pinça de zoom (2+ dedos) não deve virar página.
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 1) start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      else start = null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dir = detectSwipe(start, { x: t.clientX, y: t.clientY });
      start = null;
      if (dir) onSwipe(dir);
    };
    // Listeners passivos: só lemos as coordenadas, nunca chamamos preventDefault,
    // então o navegador mantém a rolagem/zoom nativos fluidos.
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [ref, onSwipe]);
}
