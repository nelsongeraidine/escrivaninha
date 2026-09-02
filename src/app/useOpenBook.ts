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
      const loaded = await loadDocument(blob, (l, t) => {
        if (t > 0) dispatch({ type: 'open-progress', progress: Math.min(l / t, 1) });
      });
      // Só encerra o worker do documento anterior depois que o novo carregou:
      // se `loadDocument` falhar, o livro que já estava aberto continua utilizável
      // e a tela de erro pode oferecer "voltar para o livro".
      if (current) await destroyDocument(current.loaded);
      const saved = loadReadingState();
      const same = saved !== null && matchesFile(saved, { name, size });
      const resumed = same ? saved : null;
      const book: OpenBook = {
        loaded, name, size, blob,
        // Só retoma página/zoom se o estado salvo for do mesmo arquivo; o clamp
        // protege contra um PDF que encolheu desde a última leitura.
        initialPage: resumed ? Math.min(resumed.page, loaded.pageCount) : 1,
        initialZoom: resumed ? normalizeZoom(resumed.zoom) : 100,
      };
      if (!resumed) saveReadingState({ name, size, page: 1, zoom: 100 });
      dispatch({ type: 'open-success', book });
      // Fire-and-forget: persistir o livro não deve atrasar a entrada na leitura.
      void saveCurrentBook({ name, size, pageCount: loaded.pageCount, blob });
    } catch (e) {
      const err = toAppError(e);
      console.error(err.cause ?? err);
      // Qualquer falha tira o app de "loading" e cai na tela de erro; `current`
      // preserva o livro aberto quando a falha foi ao abrir um arquivo novo.
      dispatch({ type: 'open-failure', message: err.message, book: current });
    }
  }, [dispatch, current]);

  const openFile = useCallback(async (file: File) => {
    try {
      await validatePdfFile(file);
    } catch (e) {
      // Validação falhou antes de qualquer carregamento; mantém o livro atual.
      dispatch({ type: 'open-failure', message: toAppError(e).message, book: current });
      return;
    }
    await open(file, file.name, file.size);
  }, [open, dispatch, current]);

  const openStored = useCallback(async () => {
    const stored = await loadCurrentBook();
    if (!stored?.blob) return;
    await open(stored.blob, stored.name, stored.size);
  }, [open]);

  return { openFile, openStored };
}
