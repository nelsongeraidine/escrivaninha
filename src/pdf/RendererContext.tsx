import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageRenderer, createPdfBackend } from './pageRenderer';
import { BitmapCache } from './bitmapCache';
import type { OpenBook } from '../app/appState';

interface RendererCtxValue { renderer: PageRenderer; doc: PDFDocumentProxy }

const Ctx = createContext<RendererCtxValue | null>(null);

// Um renderer por livro: trocar de livro descarta fila e cache juntos. O `doc`
// viaja junto porque a camada de texto (usePageTextLayer) precisa do
// PDFDocumentProxy para pedir `getTextContent()`, e é o mesmo documento que o
// renderer já usa para rasterizar.
export function RendererProvider({ book, children }: { book: OpenBook; children: ReactNode }) {
  const renderer = useMemo(() => new PageRenderer(createPdfBackend(book.loaded), new BitmapCache()), [book]);
  // O cleanup roda também no unmount/remount duplo do StrictMode em dev. Como o
  // renderer vem de um useMemo travado em `book`, a mesma instância é reaproveitada
  // depois desse cleanup; `dispose()` não é terminal (a fila volta a funcionar).
  // Ele agora também fecha os bitmaps em cache, então em dev o segundo mount
  // re-pede as páginas (cache miss) e as renderiza de novo; é inofensivo.
  useEffect(() => () => renderer.dispose(), [renderer]);
  const value = useMemo(() => ({ renderer, doc: book.loaded.doc }), [renderer, book.loaded.doc]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRenderer(): PageRenderer {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRenderer fora de RendererProvider');
  return ctx.renderer;
}

export function useDocument(): PDFDocumentProxy {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDocument fora de RendererProvider');
  return ctx.doc;
}
