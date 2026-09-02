import { describe, it, expect } from 'vitest';
import {
  clampPage, spreadCount, spreadForPage, pagesInSpread,
  firstPageOfSpread, pagesToPrefetch, sheetForTransition,
} from './spreadLayout';

describe('modo spread', () => {
  it('capa fica sozinha à direita no spread 0', () => {
    expect(pagesInSpread(0, 'spread', 10)).toEqual({ kind: 'spread', right: 1 });
  });
  it('spread k mostra (2k, 2k+1)', () => {
    expect(pagesInSpread(1, 'spread', 10)).toEqual({ kind: 'spread', left: 2, right: 3 });
    expect(pagesInSpread(4, 'spread', 10)).toEqual({ kind: 'spread', left: 8, right: 9 });
  });
  it('último spread com total par tem só a esquerda', () => {
    expect(pagesInSpread(5, 'spread', 10)).toEqual({ kind: 'spread', left: 10 });
    expect(spreadCount(10, 'spread')).toBe(6);
  });
  it('último spread com total ímpar é completo', () => {
    expect(pagesInSpread(5, 'spread', 11)).toEqual({ kind: 'spread', left: 10, right: 11 });
    expect(spreadCount(11, 'spread')).toBe(6);
  });
  it('spreadForPage', () => {
    expect(spreadForPage(1, 'spread', 10)).toBe(0);
    expect(spreadForPage(2, 'spread', 10)).toBe(1);
    expect(spreadForPage(3, 'spread', 10)).toBe(1);
    expect(spreadForPage(10, 'spread', 10)).toBe(5);
  });
  it('firstPageOfSpread', () => {
    expect(firstPageOfSpread(0, 'spread', 10)).toBe(1);
    expect(firstPageOfSpread(3, 'spread', 10)).toBe(6);
  });
  it('sheetForTransition avançando de k para k+1 usa frente 2k+1 e verso 2k+2', () => {
    expect(sheetForTransition(1, 2, 'spread', 10)).toEqual({ front: 3, back: 4, direction: 'forward' });
    expect(sheetForTransition(2, 1, 'spread', 10)).toEqual({ front: 3, back: 4, direction: 'backward' });
    expect(sheetForTransition(0, 1, 'spread', 10)).toEqual({ front: 1, back: 2, direction: 'forward' });
  });
  it('sheet no fim com total ímpar não tem verso', () => {
    expect(sheetForTransition(4, 5, 'spread', 9)).toEqual({ front: 9, back: undefined, direction: 'forward' });
  });
});

describe('modo single', () => {
  it('cada spread é uma página', () => {
    expect(spreadCount(7, 'single')).toBe(7);
    expect(pagesInSpread(0, 'single', 7)).toEqual({ kind: 'single', page: 1 });
    expect(spreadForPage(5, 'single', 7)).toBe(4);
    expect(firstPageOfSpread(4, 'single', 7)).toBe(5);
  });
  it('sheet é a página que sai; verso vazio', () => {
    expect(sheetForTransition(2, 3, 'single', 7)).toEqual({ front: 3, back: undefined, direction: 'forward' });
    expect(sheetForTransition(3, 2, 'single', 7)).toEqual({ front: 3, back: undefined, direction: 'backward' });
  });
});

describe('utilitários', () => {
  it('clampPage', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
  });
  it('pagesToPrefetch respeita limites e inclui visíveis primeiro', () => {
    expect(pagesToPrefetch(0, 'spread', 10, 4)).toEqual([1, 2, 3, 4, 5]);
    expect(pagesToPrefetch(5, 'spread', 10, 4)).toEqual([10, 9, 8, 7, 6]);
    expect(pagesToPrefetch(2, 'single', 3, 4)).toEqual([3, 2, 1]);
  });
  it('troca de modo preserva a página', () => {
    const page = 7;
    const s = spreadForPage(page, 'spread', 20);
    const first = firstPageOfSpread(s, 'spread', 20);
    expect(spreadForPage(first, 'single', 20)).toBe(5);
  });
});
