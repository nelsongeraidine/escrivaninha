import { useEffect, useReducer, useState } from 'react';
import { appReducer, initialState } from './appState';
import { useOpenBook } from './useOpenBook';
import { LibraryView } from '../library/LibraryView';
import { loadCurrentBook, type StoredBook } from '../persistence/bookStore';
import { loadReadingState } from '../persistence/readingState';

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const book = 'book' in state ? state.book : undefined;
  const { openFile, openStored } = useOpenBook(dispatch, book);
  const [stored, setStored] = useState<StoredBook | null>(null);

  // Recarrega o card do livro salvo sempre que a view muda: ao voltar da leitura
  // para a biblioteca o IndexedDB ja tem o ultimo livro persistido.
  useEffect(() => { void loadCurrentBook().then(setStored); }, [state.status]);

  if (state.status === 'library') {
    const saved = loadReadingState();
    const continueInfo = book
      ? { name: book.name, page: saved?.page ?? 1, pageCount: book.loaded.pageCount, onContinue: () => dispatch({ type: 'resume' }) }
      : stored?.blob
        ? { name: stored.name, page: saved?.page ?? 1, pageCount: stored.pageCount, onContinue: () => { void openStored(); } }
        : undefined;
    return <LibraryView onFile={(f) => { void openFile(f); }} continueInfo={continueInfo} />;
  }
  if (state.status === 'loading') return <p>Preparando seu livro...</p>;
  if (state.status === 'error') return <p role="alert">{state.message}</p>;
  return <p>Lendo {state.book.name} ({state.book.loaded.pageCount} páginas)</p>;
}
