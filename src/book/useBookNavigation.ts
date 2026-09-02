import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampPage, firstPageOfSpread, sheetForTransition, spreadCount, spreadForPage,
  type FlipDirection, type ViewMode,
} from './spreadLayout';

export interface Flip { from: number; to: number; direction: FlipDirection; front?: number; back?: number }

export interface BookNavigation {
  mode: ViewMode;
  spreadIndex: number;
  currentPage: number;
  pageCount: number;
  flip: Flip | null;
  next(): void;
  prev(): void;
  goToPage(page: number): void;
  finishFlip(): void;
}

/**
 * Estado lógico do livro. Durante a animação o spread atual não muda; só ao
 * `finishFlip` o índice avança. Uma entrada extra fica enfileirada para que
 * duas teclas rápidas virem duas páginas sem quebrar a animação.
 */
export function useBookNavigation(pageCount: number, mode: ViewMode, initialPage: number, animate: boolean): BookNavigation {
  // A página guardada é sempre a primeira do spread: assim trocar de modo (spread
  // <-> single) mantém o leitor na mesma folha, sem "pular" para a página par.
  const [page, setPage] = useState(() => {
    const p = clampPage(initialPage, pageCount);
    return firstPageOfSpread(spreadForPage(p, mode, pageCount), mode, pageCount);
  });
  const [flip, setFlip] = useState<Flip | null>(null);
  const queued = useRef<'next' | 'prev' | null>(null);
  // Alvo de um `goToPage` chamado durante o flip: aplicado sem animação ao
  // terminar a virada, para o salto não se perder como no-op.
  const queuedPage = useRef<number | null>(null);
  const spreadIndex = spreadForPage(page, mode, pageCount);
  const total = spreadCount(pageCount, mode);

  // Página exposta é sempre a primeira do spread para o indicador e a persistência.
  const currentPage = firstPageOfSpread(spreadIndex, mode, pageCount);

  // Trocar de modo no meio de um flip deixaria uma sheet órfã: descartamos.
  useEffect(() => { setFlip(null); queued.current = null; queuedPage.current = null; }, [mode]);

  const go = useCallback((target: number) => {
    const to = Math.min(Math.max(target, 0), total - 1);
    const from = spreadForPage(page, mode, pageCount);
    if (to === from) return;
    if (!animate || Math.abs(to - from) !== 1) {
      setPage(firstPageOfSpread(to, mode, pageCount));
      return;
    }
    const sheet = sheetForTransition(from, to, mode, pageCount);
    setFlip({ from, to, ...sheet });
  }, [page, mode, pageCount, total, animate]);

  const next = useCallback(() => {
    if (flip) { queued.current = 'next'; return; }
    go(spreadIndex + 1);
  }, [flip, go, spreadIndex]);

  const prev = useCallback(() => {
    if (flip) { queued.current = 'prev'; return; }
    go(spreadIndex - 1);
  }, [flip, go, spreadIndex]);

  const goToPage = useCallback((p: number) => {
    const target = spreadForPage(clampPage(p, pageCount), mode, pageCount);
    // Não dá para trocar o spread base no meio de um flip sem quebrar a
    // animação; guarda o destino e `finishFlip` aplica o salto sem animar.
    if (flip) { queuedPage.current = target; return; }
    go(target);
  }, [flip, go, mode, pageCount]);

  const finishFlip = useCallback(() => {
    if (!flip) return;
    const landed = flip.to;
    setPage(firstPageOfSpread(landed, mode, pageCount));
    setFlip(null);
    const qp = queuedPage.current;
    queuedPage.current = null;
    const q = queued.current;
    queued.current = null;
    // Salto enfileirado por `goToPage` tem prioridade sobre next/prev pendente:
    // o leitor pediu explicitamente uma página, então aplicamos sem animação.
    if (qp !== null) {
      if (qp !== landed) setPage(firstPageOfSpread(qp, mode, pageCount));
      return;
    }
    if (q) {
      const to = Math.min(Math.max(landed + (q === 'next' ? 1 : -1), 0), total - 1);
      if (to !== landed) setFlip({ from: landed, to, ...sheetForTransition(landed, to, mode, pageCount) });
    }
  }, [flip, mode, pageCount, total]);

  return { mode, spreadIndex, currentPage, pageCount, flip, next, prev, goToPage, finishFlip };
}
