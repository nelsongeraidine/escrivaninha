import { describe, it, expect, beforeEach } from 'vitest';
import { loadReadingState, saveReadingState, clearReadingState, matchesFile } from './readingState';

beforeEach(() => localStorage.clear());

describe('readingState', () => {
  it('salva e lê', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 4, zoom: 125 });
    const s = loadReadingState();
    expect(s).toMatchObject({ name: 'a.pdf', size: 10, page: 4, zoom: 125 });
    expect(typeof s!.updatedAt).toBe('number');
  });
  it('retorna null se vazio ou corrompido', () => {
    expect(loadReadingState()).toBeNull();
    localStorage.setItem('escrivaninha.reading', '{nope');
    expect(loadReadingState()).toBeNull();
  });
  it('matchesFile compara nome e tamanho', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 1, zoom: 100 });
    const s = loadReadingState();
    expect(matchesFile(s, { name: 'a.pdf', size: 10 })).toBe(true);
    expect(matchesFile(s, { name: 'a.pdf', size: 11 })).toBe(false);
    expect(matchesFile(null, { name: 'a.pdf', size: 10 })).toBe(false);
  });
  it('clear remove', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 1, zoom: 100 });
    clearReadingState();
    expect(loadReadingState()).toBeNull();
  });
});
