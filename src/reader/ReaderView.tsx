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
import { useBookSearch } from '../pdf/useBookSearch';
import { Book, type PageMetrics } from './Book';
import { ReaderControls } from './ReaderControls';
import { SearchPanel } from './SearchPanel';

interface Props { book: OpenBook; onBack: () => void }

// Seta em SVG (traçado), consistente com o conjunto de ícones da barra de
// controles: antes era um glifo "←" de texto, com peso visual diferente.
function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  // O auto-hide só liga depois da primeira interação real (virar página, zoom
  // ou tela cheia): chegar no leitor e a barra já sumir sem o usuário ter feito
  // nada esconde "← Biblioteca" antes de ele aprender que ela existe.
  const [interacted, setInteracted] = useState(false);
  const initialPageRef = useRef(book.initialPage);
  const initialZoomRef = useRef(book.initialZoom);
  useEffect(() => {
    if (nav.currentPage !== initialPageRef.current || zoom !== initialZoomRef.current || fullscreen) {
      setInteracted(true);
    }
  }, [nav.currentPage, zoom, fullscreen]);
  const { visible, poke, hold } = useAutoHide(2500, interacted);

  const [searchOpen, setSearchOpen] = useState(false);
  const search = useBookSearch(nav.pageCount);
  const closeSearch = useCallback(() => { setSearchOpen(false); hold(false); }, [hold]);
  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      // Abrir a busca segura a barra visível (igual passar o mouse em cima);
      // fechar devolve ao auto-hide normal.
      hold(!open);
      return !open;
    });
  }, [hold]);
  const jumpToResult = useCallback((page: number) => { nav.goToPage(page); closeSearch(); }, [nav, closeSearch]);

  const onMetrics = useCallback((m: PageMetrics) => setMetrics(m), []);

  // Indicador mostra o destino da virada assim que ela começa, não só quando
  // termina: num livro de verdade a numeração muda no momento em que a folha
  // sai do lugar, não 650ms depois. `nav.currentPage` (confirmado) continua
  // sendo o que persiste e o que o prefetch usa; isto é só para exibição.
  const displaySpreadIndex = nav.flip ? nav.flip.to : nav.spreadIndex;
  const displaySpread = pagesInSpread(displaySpreadIndex, nav.mode, nav.pageCount);
  const displayPage = displaySpread.kind === 'single'
    ? displaySpread.page
    : displaySpread.left ?? displaySpread.right ?? nav.currentPage;
  // Ultima pagina de fato visivel no spread de destino: base para desabilitar "Proxima".
  const lastVisiblePage = displaySpread.kind === 'single'
    ? displaySpread.page
    : displaySpread.right ?? displaySpread.left ?? nav.currentPage;

  // Teclado global: setas/PageUp-Down/Home/End viram página; Esc sai da tela cheia.
  const handlers = useMemo(() => ({
    next: nav.next, prev: nav.prev,
    first: () => nav.goToPage(1), last: () => nav.goToPage(nav.pageCount),
    // Esc fecha a busca primeiro (se estiver com foco fora do campo de texto,
    // ex.: num resultado clicado); só sai de tela cheia se a busca já estiver fechada.
    exitFullscreen: () => {
      if (searchOpen) { closeSearch(); return; }
      if (document.fullscreenElement) void document.exitFullscreen();
    },
  }), [nav, searchOpen, closeSearch]);
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
        onFocus={() => hold(true)} onBlur={() => hold(false)}><ChevronLeft /> Biblioteca</button>
      {/* Nome do livro: some/aparece junto com o resto do chrome. Sem isso a
          moldura de "biblioteca particular" evapora assim que o livro abre. */}
      <div className="reader__title" data-visible={visible} aria-hidden="true">{book.name}</div>
      <SearchPanel
        open={searchOpen}
        query={search.query} onQueryChange={search.setQuery}
        results={search.results} indexing={search.indexing} progress={search.progress}
        onJump={jumpToResult} onClose={closeSearch}
      />
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom} onMetrics={onMetrics}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} onFlipDone={nav.finishFlip} />
      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)}>
        <ReaderControls
          visible={visible}
          page={displayPage} pageCount={nav.pageCount} lastVisiblePage={lastVisiblePage} zoom={zoom} fullscreen={fullscreen}
          onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goToPage}
          onZoomIn={() => setZoom((z) => nextZoom(z))} onZoomOut={() => setZoom((z) => prevZoom(z))}
          onToggleFullscreen={toggleFullscreen}
          onToggleSearch={toggleSearch} searchActive={searchOpen}
        />
      </div>
    </div>
  );
}
