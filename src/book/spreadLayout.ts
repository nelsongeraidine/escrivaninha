export type ViewMode = 'spread' | 'single';

export type Spread =
  | { kind: 'spread'; left?: number; right?: number }
  | { kind: 'single'; page: number };

export type FlipDirection = 'forward' | 'backward';

export function clampPage(page: number, total: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), Math.max(total, 1));
}

export function spreadCount(total: number, mode: ViewMode): number {
  if (mode === 'single') return total;
  // Spread 0 é a capa sozinha; depois pares (2k, 2k+1).
  return Math.floor(total / 2) + 1;
}

export function spreadForPage(page: number, mode: ViewMode, total: number): number {
  const p = clampPage(page, total);
  return mode === 'single' ? p - 1 : Math.floor(p / 2);
}

export function pagesInSpread(index: number, mode: ViewMode, total: number): Spread {
  if (mode === 'single') return { kind: 'single', page: clampPage(index + 1, total) };
  if (index <= 0) return { kind: 'spread', right: 1 };
  const left = 2 * index;
  const right = 2 * index + 1;
  const spread: Spread = { kind: 'spread' };
  if (left <= total) spread.left = left;
  if (right <= total) spread.right = right;
  return spread;
}

export function firstPageOfSpread(index: number, mode: ViewMode, total: number): number {
  const s = pagesInSpread(index, mode, total);
  if (s.kind === 'single') return s.page;
  return clampPage(s.left ?? s.right ?? 1, total);
}

export function pagesToPrefetch(index: number, mode: ViewMode, total: number, radius: number): number[] {
  const visible: number[] = [];
  const s = pagesInSpread(index, mode, total);
  if (s.kind === 'single') visible.push(s.page);
  else {
    if (s.left) visible.push(s.left);
    if (s.right) visible.push(s.right);
  }
  // Prioridade: visíveis, depois as seguintes (leitura avança), depois as anteriores.
  const last = visible[visible.length - 1];
  const first = visible[0];
  const after: number[] = [];
  const before: number[] = [];
  for (let i = 1; i <= radius; i++) {
    if (last + i <= total) after.push(last + i);
    if (first - i >= 1) before.push(first - i);
  }
  return [...visible, ...after, ...before];
}

/**
 * Raio de prefetch (em paginas para cada lado) conforme o custo de um bitmap.
 * O cache de ImageBitmap tem orcamento de ~100 MB; em tela retina com zoom alto
 * cada pagina passa de 20 MB e um raio fixo de 4 faria o cache girar (thrash),
 * chegando a evictar o proprio spread visivel. Degrada o raio para caber no
 * orcamento sem perder a pre-carga das paginas mais provaveis.
 */
export function prefetchRadiusFor(bytesPerBitmap: number): number {
  if (bytesPerBitmap > 24 * 1024 * 1024) return 1;
  if (bytesPerBitmap > 12 * 1024 * 1024) return 2;
  return 4;
}

export function sheetForTransition(
  from: number, to: number, mode: ViewMode, total: number,
): { front?: number; back?: number; direction: FlipDirection } {
  const direction: FlipDirection = to > from ? 'forward' : 'backward';
  const k = Math.min(from, to);
  if (mode === 'single') {
    // A folha que vira é a página do spread menor; o verso é papel em branco.
    return { front: clampPage(k + 1, total), back: undefined, direction };
  }
  // Sheet k: frente = direita do spread k, verso = esquerda do spread k+1.
  const front = 2 * k + 1;
  const back = 2 * k + 2;
  return {
    front: front <= total ? front : undefined,
    back: back <= total ? back : undefined,
    direction,
  };
}
