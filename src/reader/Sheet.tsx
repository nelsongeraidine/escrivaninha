import { useEffect, useRef } from 'react';
import type { Flip } from '../book/useBookNavigation';
import type { ViewMode } from '../book/spreadLayout';
import type { PageMetrics } from './Book';
import { Page } from './Page';

interface Props { flip: Flip; metrics: PageMetrics; mode: ViewMode; onDone: () => void }

/**
 * Folha que gira sobre a lombada (spread) ou sobre a borda esquerda (single).
 * A frente é a página que sai; o verso, a que entra. A animação é CSS; o React
 * só espera `animationend` para confirmar o novo spread.
 */
export function Sheet({ flip, metrics, mode, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  // Guardamos a callback num ref para o effect abaixo não depender dela: assim o
  // listener/timer são montados uma vez por flip. A escrita fica num effect (e
  // não no corpo do render) para nao acessar `.current` durante a renderização.
  useEffect(() => { done.current = onDone; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Só a folha dispara o fim: `animationend` das camadas de luz/sombra
    // (shade/cast) borbulha até aqui e não pode encerrar o flip antes da hora.
    const handler = (e: AnimationEvent) => { if (e.target === el) done.current(); };
    el.addEventListener('animationend', handler);
    // Fallback: se o navegador pular a animação (aba oculta), não travar o livro.
    const t = window.setTimeout(() => done.current(), 900);
    return () => { el.removeEventListener('animationend', handler); window.clearTimeout(t); };
  }, [flip]);

  return (
    <div ref={ref} className={`sheet sheet--${flip.direction} sheet--${mode}`} style={{ width: metrics.cssWidth, height: metrics.cssHeight }} aria-hidden="true">
      <div className="sheet__face sheet__face--front">
        <Page page={flip.front} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side={mode === 'spread' ? 'right' : 'single'} />
        <div className="sheet__shade" />
      </div>
      <div className="sheet__face sheet__face--back">
        <Page page={flip.back} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="left" />
        <div className="sheet__shade" />
      </div>
      <div className="sheet__cast" />
    </div>
  );
}
