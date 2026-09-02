import { useEffect, useState } from 'react';
import type { OpenBook } from '../app/appState';
import { RendererProvider, useRenderer } from '../pdf/RendererContext';
import { useBookNavigation } from '../book/useBookNavigation';
import { useViewMode, usePrefersReducedMotion } from '../shared/useMediaQuery';
import { pagesToPrefetch } from '../book/spreadLayout';
import { Book } from './Book';

interface Props { book: OpenBook; onBack: () => void }

export function ReaderView({ book, onBack }: Props) {
  return (
    <RendererProvider book={book}>
      <ReaderInner book={book} onBack={onBack} />
    </RendererProvider>
  );
}

function ReaderInner({ book, onBack }: Props) {
  const mode = useViewMode();
  const reduced = usePrefersReducedMotion();
  const nav = useBookNavigation(book.loaded.pageCount, mode, book.initialPage, !reduced);
  const [zoom] = useState(book.initialZoom);
  const renderer = useRenderer();

  // Prefetch: pede as vizinhas com prioridade baixa e cancela o que saiu da janela.
  useEffect(() => {
    const pages = pagesToPrefetch(nav.spreadIndex, nav.mode, nav.pageCount, 4);
    renderer.retainOnly(new Set(pages));
    // A escala real vem do Book; aqui só aquecemos o cache na escala corrente
    // guardada pelo Page (mesma chave), então usamos o último scale conhecido.
  }, [renderer, nav.spreadIndex, nav.mode, nav.pageCount]);

  return (
    <div className="reader">
      <button type="button" className="reader__back" onClick={onBack}>← Biblioteca</button>
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} />
      <p className="reader__indicator" aria-live="polite">Página {nav.currentPage} / {nav.pageCount}</p>
    </div>
  );
}
