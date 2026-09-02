import { useCallback, type Dispatch } from 'react';
import type { AppAction, OpenBook } from './appState';
import { loadDocument, destroyDocument } from '../pdf/pdfDocument';
import { validatePdfFile } from '../shared/validatePdfFile';
import { toAppError } from '../shared/errors';
import { loadReadingState, matchesFile, saveReadingState } from '../persistence/readingState';
import { saveCurrentBook, loadCurrentBook } from '../persistence/bookStore';
import { normalizeZoom } from '../book/zoomLevels';

/**
 * Fluxo completo de abertura: valida, carrega, decide a página inicial pelo
 * estado salvo e persiste. Fica fora do App para o componente só compor views.
 */
export function useOpenBook(dispatch: Dispatch<AppAction>, current?: OpenBook) {
  const open = useCallback(async (blob: Blob, name: string, size: number) => {
    dispatch({ type: 'open-start', name });
    try {
      // Encerra o worker do documento anterior antes de abrir outro para não
      // vazar workers e requisições de rede a cada troca de livro.
      if (current) await destroyDocument(current.loaded);
      const loaded = await loadDocument(blob, (l, t) => {
        if (t > 0) dispatch({ type: 'open-progress', progress: Math.min(l / t, 1) });
      });
      const saved = loadReadingState();
      const same = matchesFile(saved, { name, size });
      const book: OpenBook = {
        loaded, name, size, blob,
        // Só retoma página/zoom se o estado salvo for do mesmo arquivo; o clamp
        // protege contra um PDF que encolheu desde a última leitura.
        initialPage: same ? Math.min(saved!.page, loaded.pageCount) : 1,
        initialZoom: same ? normalizeZoom(saved!.zoom) : 100,
      };
      if (!same) saveReadingState({ name, size, page: 1, zoom: 100 });
      dispatch({ type: 'open-success', book });
      // Fire-and-forget: persistir o livro não deve atrasar a entrada na leitura.
      void saveCurrentBook({ name, size, pageCount: loaded.pageCount, blob });
    } catch (e) {
      const err = toAppError(e);
      console.error(err.cause ?? err);
      // Qualquer falha tira o app de "loading" e cai na tela de erro.
      dispatch({ type: 'open-failure', message: err.message });
    }
  }, [dispatch, current]);

  const openFile = useCallback(async (file: File) => {
    try {
      await validatePdfFile(file);
    } catch (e) {
      dispatch({ type: 'open-failure', message: toAppError(e).message });
      return;
    }
    await open(file, file.name, file.size);
  }, [open, dispatch]);

  const openStored = useCallback(async () => {
    const stored = await loadCurrentBook();
    if (!stored?.blob) return;
    await open(stored.blob, stored.name, stored.size);
  }, [open]);

  return { openFile, openStored };
}
