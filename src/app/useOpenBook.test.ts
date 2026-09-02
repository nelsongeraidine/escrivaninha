import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpenBook } from './useOpenBook';
import * as pdfDocument from '../pdf/pdfDocument';
import * as bookStore from '../persistence/bookStore';
import * as readingState from '../persistence/readingState';
import type { OpenBook } from './appState';

// `loadDocument`/`destroyDocument` são efeitos externos (worker do pdf.js); o
// teste só verifica a orquestração do hook, então o módulo inteiro é falso.
vi.mock('../pdf/pdfDocument', () => ({
  loadDocument: vi.fn(),
  destroyDocument: vi.fn(),
}));
// `bookStore` toca IndexedDB; aqui basta espionar as chamadas.
vi.mock('../persistence/bookStore', () => ({
  saveCurrentBook: vi.fn().mockResolvedValue(undefined),
  loadCurrentBook: vi.fn().mockResolvedValue(null),
}));
// Mantém `matchesFile` real (é função pura) e troca só os acessos ao localStorage.
vi.mock('../persistence/readingState', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../persistence/readingState')>();
  return { ...actual, loadReadingState: vi.fn(), saveReadingState: vi.fn() };
});

const loadDocument = pdfDocument.loadDocument as unknown as Mock;
const destroyDocument = pdfDocument.destroyDocument as unknown as Mock;
const saveCurrentBook = bookStore.saveCurrentBook as unknown as Mock;
const loadReadingState = readingState.loadReadingState as unknown as Mock;

// Documento carregado fictício: só o que o hook lê (`pageCount`).
function fakeLoaded(pageCount = 10) {
  return { doc: { loadingTask: { destroy: vi.fn() } }, pageCount, pageSize: { width: 100, height: 140 } };
}

// Arquivo cuja assinatura passa em `validatePdfFile` sem precisar de mock.
function validFile(name = 'book.pdf') {
  return new File(['%PDF-1.4 conteudo'], name, { type: 'application/pdf' });
}

beforeEach(() => {
  vi.clearAllMocks();
  loadReadingState.mockReturnValue(null);
  destroyDocument.mockResolvedValue(undefined);
  saveCurrentBook.mockResolvedValue(undefined);
});

describe('useOpenBook', () => {
  it('(a) sucesso: open-start -> open-success com initialPage do estado salvo (clamp) e persiste o livro', async () => {
    const file = validFile();
    loadDocument.mockResolvedValue(fakeLoaded(10));
    // Página salva além do fim: precisa entrar clampada em pageCount.
    loadReadingState.mockReturnValue({ name: file.name, size: file.size, page: 50, zoom: 125, updatedAt: 1 });
    const dispatch = vi.fn();
    const { result } = renderHook(() => useOpenBook(dispatch));

    await act(async () => { await result.current.openFile(file); });

    expect(dispatch.mock.calls[0][0]).toEqual({ type: 'open-start', name: 'book.pdf' });
    const success = dispatch.mock.calls.find((c) => c[0].type === 'open-success')?.[0];
    expect(success).toBeDefined();
    expect(success.book.initialPage).toBe(10);
    expect(saveCurrentBook).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'book.pdf', size: file.size, pageCount: 10 }),
    );
    expect(destroyDocument).not.toHaveBeenCalled();
  });

  it('(b) falha ao carregar: open-failure com o livro atual e sem destruir o documento anterior', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const current = { loaded: fakeLoaded(4), name: 'old.pdf', size: 1 } as unknown as OpenBook;
    loadDocument.mockRejectedValue(new Error('boom'));
    const dispatch = vi.fn();
    const { result } = renderHook(() => useOpenBook(dispatch, current));

    await act(async () => { await result.current.openFile(validFile()); });

    expect(dispatch.mock.calls.some((c) => c[0].type === 'open-start')).toBe(true);
    const failure = dispatch.mock.calls.find((c) => c[0].type === 'open-failure')?.[0];
    expect(failure).toBeDefined();
    expect(failure.book).toBe(current);
    // O livro anterior continua utilizável: nada foi destruído.
    expect(destroyDocument).not.toHaveBeenCalled();
  });

  it('(c) sucesso com livro anterior: destrói o documento antigo depois do novo carregar', async () => {
    const current = { loaded: fakeLoaded(4), name: 'old.pdf', size: 1 } as unknown as OpenBook;
    loadDocument.mockResolvedValue(fakeLoaded(20));
    const dispatch = vi.fn();
    const { result } = renderHook(() => useOpenBook(dispatch, current));

    await act(async () => { await result.current.openFile(validFile()); });

    expect(destroyDocument).toHaveBeenCalledWith(current.loaded);
    // Ordem: só encerra o worker antigo após o novo documento estar pronto.
    expect(destroyDocument.mock.invocationCallOrder[0])
      .toBeGreaterThan(loadDocument.mock.invocationCallOrder[0]);
  });

  it('(d) arquivo inválido: open-failure sem open-start', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const dispatch = vi.fn();
    const { result } = renderHook(() => useOpenBook(dispatch));

    await act(async () => {
      await result.current.openFile(new File(['isto nao e pdf'], 'foto.txt', { type: 'text/plain' }));
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe('open-failure');
    expect(dispatch.mock.calls.some((c) => c[0].type === 'open-start')).toBe(false);
    expect(loadDocument).not.toHaveBeenCalled();
  });
});
