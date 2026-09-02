import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OpenBook } from '../app/appState';
import { RendererProvider, useRenderer } from '../pdf/RendererContext';
import { useBookNavigation } from '../book/useBookNavigation';
import { useViewMode, usePrefersReducedMotion } from '../shared/useMediaQuery';
import { pagesInSpread, pagesToPrefetch, prefetchRadiusFor } from '../book/spreadLayout';
import { nextZoom, prevZoom } from '../book/zoomLevels';
import { useFullscreen } from '../shared/useFullscreen';
import { useAutoHide } from '../shared/useAutoHide';
import { useKeyboardNav } from '../shared/useKeyboardNav';
import { useSwipe } from '../shared/useSwipe';
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

  // Ultima pagina de fato visivel no spread: base para desabilitar "Proxima".
  const currentSpread = pagesInSpread(nav.spreadIndex, nav.mode, nav.pageCount);
  const lastVisiblePage = currentSpread.kind === 'single'
    ? currentSpread.page
    : currentSpread.right ?? currentSpread.left ?? nav.currentPage;

  // Teclado global: setas/PageUp-Down/Home/End viram página; Esc sai da tela cheia.
  const handlers = useMemo(() => ({
    next: nav.next, prev: nav.prev,
    first: () => nav.goToPage(1), last: () => nav.goToPage(nav.pageCount),
    exitFullscreen: () => { if (document.fullscreenElement) void document.exitFullscreen(); },
  }), [nav]);
  useKeyboardNav(handlers);

  // Swipe horizontal no toque: esquerda avança, direita volta.
  const onSwipe = useCallback((d: 'left' | 'right') => (d === 'left' ? nav.next() : nav.prev()), [nav]);
  useSwipe(rootRef, onSwipe);

  // Foca a raiz ao montar para o teclado responder sem um clique prévio.
  useEffect(() => { rootRef.current?.focus(); }, []);

  // Prefetch na escala corrente; cancela o que saiu da janela.
  useEffect(() => {
    if (!metrics) return;
    // Estima o custo de um bitmap nesta escala (px fisicos x 4 bytes RGBA) para
    // encolher o raio quando o orcamento de ~100 MB do cache nao comporta 4
    // paginas; em retina + zoom alto um raio fixo evictaria o spread visivel.
    const px = book.loaded.pageSize.width * metrics.scale * book.loaded.pageSize.height * metrics.scale * 4;
    const radius = prefetchRadiusFor(px);
    const pages = pagesToPrefetch(nav.spreadIndex, nav.mode, nav.pageCount, radius);
    renderer.retainOnly(new Set(pages));
    for (const p of pages) renderer.request(p, metrics.scale, 'prefetch').catch(() => undefined);
  }, [renderer, nav.spreadIndex, nav.mode, nav.pageCount, metrics, book.loaded.pageSize.width, book.loaded.pageSize.height]);

  // Persistência com debounce: virar 10 páginas rápido gera 1 escrita.
  useEffect(() => {
    const t = window.setTimeout(() => saveReadingState({ name: book.name, size: book.size, page: nav.currentPage, zoom }), 300);
    return () => window.clearTimeout(t);
  }, [book.name, book.size, nav.currentPage, zoom]);

  return (
    <div className="reader wood--desk" ref={rootRef} tabIndex={-1} onMouseMove={poke} onTouchStart={poke} onFocusCapture={poke} data-fullscreen={fullscreen}>
      {/* `onFocusCapture={poke}` revela a barra e o botão quando o foco chega via
          Tab: sem isso o `← Biblioteca` fica focável mesmo invisível
          (`data-visible='false'` só zera opacity/pointer-events). O `onFocus`/
          `onBlur` no botão usa o mesmo `hold` dos controles para não sumir
          enquanto ele tem o foco do teclado. */}
      <button type="button" className="reader__back" data-visible={visible} onClick={onBack}
        onFocus={() => hold(true)} onBlur={() => hold(false)}>← Biblioteca</button>
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom} onMetrics={onMetrics}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} onFlipDone={nav.finishFlip} />
      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)}>
        <ReaderControls
          visible={visible}
          page={nav.currentPage} pageCount={nav.pageCount} lastVisiblePage={lastVisiblePage} zoom={zoom} fullscreen={fullscreen}
          onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goToPage}
          onZoomIn={() => setZoom((z) => nextZoom(z))} onZoomOut={() => setZoom((z) => prevZoom(z))}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
