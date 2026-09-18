import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ReactNode } from 'react';
import { RendererProvider } from './RendererContext';
import { useBookSearch } from './useBookSearch';
import type { OpenBook } from '../app/appState';

// Doc falso: cada página só devolve uma string fixa como texto extraído.
function fakeDoc(pages: string[]): PDFDocumentProxy {
  return {
    getPage: (n: number) => Promise.resolve({
      getTextContent: () => Promise.resolve({ items: [{ str: pages[n - 1] }], styles: {}, lang: null }),
    }),
  } as unknown as PDFDocumentProxy;
}

function fakeBook(pages: string[]): OpenBook {
  return {
    loaded: { doc: fakeDoc(pages), pageCount: pages.length, pageSize: { width: 100, height: 100 } },
    name: 'livro-teste.pdf', size: 1, blob: new Blob(), initialPage: 1, initialZoom: 100,
  } as OpenBook;
}

function wrapperFor(book: OpenBook) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <RendererProvider book={book}>{children}</RendererProvider>;
  };
}

describe('useBookSearch', () => {
  it('não busca com o índice vazio antes de digitar', () => {
    const book = fakeBook(['gato preto', 'cachorro marrom']);
    const { result } = renderHook(() => useBookSearch(2), { wrapper: wrapperFor(book) });
    expect(result.current.results).toEqual([]);
    expect(result.current.indexing).toBe(false);
  });

  it('indexa o livro na primeira busca e acha as páginas com o termo', async () => {
    const book = fakeBook(['o gato subiu no telhado', 'cachorro marrom', 'outro gato, cinza']);
    const { result } = renderHook(() => useBookSearch(3), { wrapper: wrapperFor(book) });

    act(() => { result.current.setQuery('gato'); });
    await waitFor(() => expect(result.current.indexing).toBe(false));

    expect(result.current.results.map((r) => r.page)).toEqual([1, 3]);
    expect(result.current.results[0].match.toLowerCase()).toBe('gato');
  });

  it('busca é case-insensitive e ignora acentuação só quando já bate exata', async () => {
    const book = fakeBook(['Página Única de Teste']);
    const { result } = renderHook(() => useBookSearch(1), { wrapper: wrapperFor(book) });

    act(() => { result.current.setQuery('página'); });
    await waitFor(() => expect(result.current.indexing).toBe(false));

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].match).toBe('Página');
  });

  it('query vazia limpa os resultados sem tocar no índice', async () => {
    const book = fakeBook(['conteúdo qualquer']);
    const { result } = renderHook(() => useBookSearch(1), { wrapper: wrapperFor(book) });

    act(() => { result.current.setQuery('conteúdo'); });
    await waitFor(() => expect(result.current.results).toHaveLength(1));

    act(() => { result.current.setQuery(''); });
    expect(result.current.results).toEqual([]);
  });
});
