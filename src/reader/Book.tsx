import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { pagesInSpread } from '../book/spreadLayout';
import type { BookNavigation } from '../book/useBookNavigation';
import { Page } from './Page';
import { Sheet } from './Sheet';

interface Props {
  nav: BookNavigation;
  pageSize: { width: number; height: number };
  zoom: number;
  onClickSide?: (side: 'left' | 'right') => void;
  /** Encerra o flip quando a animação da folha termina. */
  onFlipDone: () => void;
  /** Reporta a métrica de página corrente (o prefetch do leitor pede na escala real). */
  onMetrics?: (m: PageMetrics) => void;
}

export interface PageMetrics { cssWidth: number; cssHeight: number; scale: number }

export function usePageMetrics(
  container: RefObject<HTMLElement | null>,
  pageSize: Props['pageSize'],
  mode: 'spread' | 'single',
  zoom: number,
): PageMetrics {
  const [area, setArea] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    // jsdom não tem ResizeObserver; nesse caso não observamos e o fit fica em 1.
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [container]);

  // Objeto memoizado: a Task 12 depende dessa identidade estável para o prefetch
  // com a escala real, então só recalculamos quando um insumo muda de fato.
  return useMemo(() => {
    // 100% = página ajustada à área; o zoom multiplica esse ajuste.
    const pagesAcross = mode === 'spread' ? 2 : 1;
    const margin = 0.92;
    const fit = area.w && area.h
      ? Math.min((area.w * margin) / (pageSize.width * pagesAcross), (area.h * margin) / pageSize.height)
      : 1;
    const cssScale = fit * (zoom / 100);
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
    return {
      cssWidth: Math.round(pageSize.width * cssScale),
      cssHeight: Math.round(pageSize.height * cssScale),
      scale: Number((cssScale * dpr).toFixed(3)),
    };
  }, [area.w, area.h, pageSize.width, pageSize.height, mode, zoom]);
}

export function Book({ nav, pageSize, zoom, onClickSide, onFlipDone, onMetrics }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const metrics = usePageMetrics(areaRef, pageSize, nav.mode, zoom);

  // `metrics` é memoizado em `usePageMetrics`, então este effect só roda quando
  // uma métrica muda de fato; `onMetrics` vem estável por `useCallback` no pai.
  useEffect(() => { onMetrics?.(metrics); }, [metrics, onMetrics]);
  const spread = pagesInSpread(nav.spreadIndex, nav.mode, nav.pageCount);

  // Durante um flip a base mostra o que fica parado: esquerda do spread menor
  // e direita do spread maior; a sheet em movimento cobre o resto.
  let left: number | undefined;
  let right: number | undefined;
  let single: number | undefined;
  if (spread.kind === 'single') {
    single = nav.flip ? Math.max(nav.flip.from, nav.flip.to) + 1 : spread.page;
  } else if (nav.flip) {
    const lo = pagesInSpread(Math.min(nav.flip.from, nav.flip.to), 'spread', nav.pageCount);
    const hi = pagesInSpread(Math.max(nav.flip.from, nav.flip.to), 'spread', nav.pageCount);
    left = lo.kind === 'spread' ? lo.left : undefined;
    right = hi.kind === 'spread' ? hi.right : undefined;
  } else {
    left = spread.left; right = spread.right;
  }

  const progress = nav.pageCount > 1 ? nav.currentPage / nav.pageCount : 0;

  return (
    <div className="book-area" ref={areaRef} data-zoom-fit={zoom <= 100 ? '' : undefined}>
      {/* A perspectiva mora aqui, e não em `.book-area`: aquele elemento rola
          (`overflow: auto`) e recortaria a folha 3D ao girar sobre a lombada. */}
      <div className="book-stage">
      <div
        className={`book book--${nav.mode}`}
        style={{ ['--page-w' as string]: `${metrics.cssWidth}px`, ['--page-h' as string]: `${metrics.cssHeight}px`, ['--progress' as string]: progress }}
        data-flipping={nav.flip ? nav.flip.direction : undefined}
      >
        <div className="book__edge book__edge--left" aria-hidden="true" />
        <div className="book__edge book__edge--right" aria-hidden="true" />
        {nav.mode === 'spread' ? (
          <>
            <div className="book__side book__side--left" onClick={() => onClickSide?.('left')}>
              <Page page={left} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="left" />
            </div>
            <div className="book__side book__side--right" onClick={() => onClickSide?.('right')}>
              <Page page={right} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="right" />
            </div>
          </>
        ) : (
          <div className="book__side book__side--single" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onClickSide?.(e.clientX - r.left < r.width / 2 ? 'left' : 'right');
          }}>
            <Page page={single} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="single" />
          </div>
        )}
        <div className="book__spine" aria-hidden="true" />
        {/* `key` por transição: quando `finishFlip` encadeia um flip na mesma
            direção, sem a chave o React reusa o mesmo elemento, o `animation-name`
            não muda e os `@keyframes` não reiniciam (a segunda virada ficaria sem
            animação, avançando só pelo fallback de 900ms). Remontar dá a cada
            virada sua própria animação, effect e timer. */}
        {nav.flip && (
          <Sheet
            key={`${nav.flip.from}-${nav.flip.to}`}
            flip={nav.flip}
            metrics={metrics}
            mode={nav.mode}
            onDone={onFlipDone}
          />
        )}
      </div>
      </div>
    </div>
  );
}
