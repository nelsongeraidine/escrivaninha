import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { PageRenderer, createPdfBackend } from './pageRenderer';
import { BitmapCache } from './bitmapCache';
import type { OpenBook } from '../app/appState';

const Ctx = createContext<PageRenderer | null>(null);

// Um renderer por livro: trocar de livro descarta fila e cache juntos.
export function RendererProvider({ book, children }: { book: OpenBook; children: ReactNode }) {
  const renderer = useMemo(() => new PageRenderer(createPdfBackend(book.loaded), new BitmapCache()), [book]);
  // O cleanup roda também no unmount/remount duplo do StrictMode em dev. Como o
  // renderer vem de um useMemo travado em `book`, a mesma instância é reaproveitada
  // depois desse cleanup; isso só seria problema se `dispose()` fosse terminal, mas
  // ele apenas aborta os jobs pendentes, então reusar a instância é seguro.
  useEffect(() => () => renderer.dispose(), [renderer]);
  return <Ctx.Provider value={renderer}>{children}</Ctx.Provider>;
}

export function useRenderer(): PageRenderer {
  const r = useContext(Ctx);
  if (!r) throw new Error('useRenderer fora de RendererProvider');
  return r;
}
