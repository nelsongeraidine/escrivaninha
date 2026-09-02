import type { LoadedDocument } from '../pdf/pdfDocument';

export interface OpenBook {
  loaded: LoadedDocument;
  name: string;
  size: number;
  blob: Blob;
  initialPage: number;
  initialZoom: number;
}

export type AppState =
  | { status: 'library'; book?: OpenBook }
  | { status: 'loading'; name: string; progress: number }
  | { status: 'reading'; book: OpenBook }
  | { status: 'error'; message: string; book?: OpenBook };

export type AppAction =
  | { type: 'open-start'; name: string }
  | { type: 'open-progress'; progress: number }
  | { type: 'open-success'; book: OpenBook }
  | { type: 'open-failure'; message: string }
  | { type: 'resume' }
  | { type: 'back-to-library' }
  | { type: 'dismiss-error' };

export const initialState: AppState = { status: 'library' };

// Máquina explícita: cada transição inválida devolve o estado atual, o que
// evita telas intermediárias inconsistentes quando eventos chegam atrasados.
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'open-start':
      return { status: 'loading', name: action.name, progress: 0 };
    case 'open-progress':
      return state.status === 'loading' ? { ...state, progress: action.progress } : state;
    case 'open-success':
      return { status: 'reading', book: action.book };
    case 'open-failure':
      return { status: 'error', message: action.message, book: bookOf(state) };
    case 'resume':
      return state.status === 'library' && state.book ? { status: 'reading', book: state.book } : state;
    case 'back-to-library':
      return state.status === 'reading' ? { status: 'library', book: state.book } : state;
    case 'dismiss-error':
      return state.status === 'error' ? { status: 'library', book: state.book } : state;
  }
}

// Preserva o livro atual ao entrar em erro para que a tela de falha ainda
// ofereça "voltar para o livro" quando a abertura de um novo arquivo falha.
function bookOf(state: AppState): OpenBook | undefined {
  return state.status === 'reading' || state.status === 'library' || state.status === 'error' ? state.book : undefined;
}
