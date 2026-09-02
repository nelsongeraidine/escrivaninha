import { describe, it, expect } from 'vitest';
import { appReducer, initialState, type OpenBook } from './appState';

const book = { name: 'a.pdf' } as unknown as OpenBook;

describe('appReducer', () => {
  it('library -> loading -> reading', () => {
    let s = appReducer(initialState, { type: 'open-start', name: 'a.pdf' });
    expect(s).toEqual({ status: 'loading', name: 'a.pdf', progress: 0 });
    s = appReducer(s, { type: 'open-progress', progress: 0.5 });
    expect(s).toMatchObject({ status: 'loading', progress: 0.5 });
    s = appReducer(s, { type: 'open-success', book });
    expect(s).toEqual({ status: 'reading', book });
  });
  it('falha vai para error e dismiss volta para library', () => {
    let s = appReducer({ status: 'loading', name: 'a', progress: 0 }, { type: 'open-failure', message: 'msg' });
    expect(s).toMatchObject({ status: 'error', message: 'msg' });
    s = appReducer(s, { type: 'dismiss-error' });
    expect(s.status).toBe('library');
  });
  it('voltar para biblioteca mantém o livro e resume retoma', () => {
    let s = appReducer({ status: 'reading', book }, { type: 'back-to-library' });
    expect(s).toEqual({ status: 'library', book });
    s = appReducer(s, { type: 'resume' });
    expect(s).toEqual({ status: 'reading', book });
  });
  it('resume sem livro não muda nada', () => {
    expect(appReducer(initialState, { type: 'resume' })).toEqual(initialState);
  });
  it('progresso fora de loading é ignorado', () => {
    expect(appReducer(initialState, { type: 'open-progress', progress: 0.3 })).toEqual(initialState);
  });
});
