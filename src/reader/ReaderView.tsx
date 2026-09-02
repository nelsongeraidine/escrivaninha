import { useCallback, useEffect, useRef, useState } from 'react';
import type { OpenBook } from '../app/appState';
import { RendererProvider, useRenderer } from '../pdf/RendererContext';
import { useBookNavigation } from '../book/useBookNavigation';
import { useViewMode, usePrefersReducedMotion } from '../shared/useMediaQuery';
import { pagesToPrefetch } from '../book/spreadLayout';
import { nextZoom, prevZoom } from '../book/zoomLevels';
import { useFullscreen } from '../shared/useFullscreen';
import { useAutoHide } from '../shared/useAutoHide';
import { saveReadingState } from '../persistence/readingState';
import { Book, type PageMetrics } from './Book';
import { ReaderControls } from './ReaderControls';

interface Props { book: OpenBook; onBack: () => void }

export function ReaderView({ book, onBack }: Props) {
  return (
    <RendererProvider book={book}>
      <ReaderInner book={book} onBack={onBack} />
    </RendererProvider>
  );
}

function ReaderInner({ book, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mode = useViewMode();
  const reduced = usePrefersReducedMotion();
  const nav = useBookNavigation(book.loaded.pageCount, mode, book.initialPage, !reduced);
  const [zoom, setZoom] = useState(book.initialZoom);
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);
  const renderer = useRenderer();
  const { active: fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
  const { visible, poke, hold } = useAutoHide(2500);

  const onMetrics = useCallback((m: PageMetrics) => setMetrics(m), []);

  // Prefetch na escala corrente; cancela o que saiu da janela.
  useEffect(() => {
    if (!metrics) return;
    const pages = pagesToPrefetch(nav.spreadIndex, nav.mode, nav.pageCount, 4);
    renderer.retainOnly(new Set(pages));
    for (const p of pages) renderer.request(p, metrics.scale, 'prefetch').catch(() => undefined);
  }, [renderer, nav.spreadIndex, nav.mode, nav.pageCount, metrics]);

  // Persistência com debounce: virar 10 páginas rápido gera 1 escrita.
  useEffect(() => {
    const t = window.setTimeout(() => saveReadingState({ name: book.name, size: book.size, page: nav.currentPage, zoom }), 300);
    return () => window.clearTimeout(t);
  }, [book.name, book.size, nav.currentPage, zoom]);

  return (
    <div className="reader" ref={rootRef} onMouseMove={poke} onTouchStart={poke} data-fullscreen={fullscreen}>
      <button type="button" className="reader__back" data-visible={visible} onClick={onBack}>← Biblioteca</button>
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom} onMetrics={onMetrics}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} onFlipDone={nav.finishFlip} />
      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)}>
        <ReaderControls
          visible={visible}
          page={nav.currentPage} pageCount={nav.pageCount} zoom={zoom} fullscreen={fullscreen}
          onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goToPage}
          onZoomIn={() => setZoom((z) => nextZoom(z))} onZoomOut={() => setZoom((z) => prevZoom(z))}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
