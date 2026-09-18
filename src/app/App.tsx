import { useEffect, useReducer, useState } from 'react';
import { appReducer, initialState } from './appState';
import { useOpenBook } from './useOpenBook';
import { LibraryView } from '../library/LibraryView';
import { ReaderView } from '../reader/ReaderView';
import { LoadingState } from '../reader/LoadingState';
import { ErrorState } from '../reader/ErrorState';
import { loadCurrentBook, type StoredBook } from '../persistence/bookStore';
import { loadReadingState, matchesFile } from '../persistence/readingState';

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
    // So mostra a pagina salva se o estado do localStorage for do mesmo arquivo
    // (nome + tamanho); caso contrario o card mostraria a pagina de outro livro.
    const continueInfo = book
      ? { name: book.name, page: matchesFile(saved, book) ? saved!.page : 1, pageCount: book.loaded.pageCount, onContinue: () => dispatch({ type: 'resume' }) }
      : stored?.blob
        ? { name: stored.name, page: matchesFile(saved, stored) ? saved!.page : 1, pageCount: stored.pageCount, onContinue: () => { void openStored(); } }
        : undefined;
    return <LibraryView onFile={(f) => { void openFile(f); }} continueInfo={continueInfo} />;
  }
  if (state.status === 'loading') return <LoadingState name={state.name} progress={state.progress} />;
  if (state.status === 'error') {
    return (
      <ErrorState
        message={state.message}
        onBack={() => dispatch({ type: 'dismiss-error' })}
        onPickFile={(f) => { void openFile(f); }}
      />
    );
  }
  return <ReaderView book={state.book} onBack={() => dispatch({ type: 'back-to-library' })} />;
}
