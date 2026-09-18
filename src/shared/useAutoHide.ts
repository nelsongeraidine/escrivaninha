import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Visível após atividade; some após `delayMs` parado; `hold(true)` segura (foco/hover na barra).
 * `enabled=false` mantém sempre visível sem armar o timer: usado para não esconder
 * o botão de voltar e a barra antes da primeira interação real do usuário no livro.
 */
export function useAutoHide(delayMs: number, enabled = true) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  const arm = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!enabled) return;
    // `held` é ref e não dep: o timer relê o valor corrente ao disparar, então
    // segurar a barra depois de armado ainda impede o auto-ocultar.
    timer.current = window.setTimeout(() => { if (!held.current) setVisible(false); }, delayMs);
  }, [delayMs, enabled]);

  const poke = useCallback(() => { setVisible(true); arm(); }, [arm]);
  const hold = useCallback((on: boolean) => { held.current = on; if (on) setVisible(true); else arm(); }, [arm]);

  // Reentrar em `enabled` (primeira interação) precisa revelar de novo: antes
  // disso a barra ficava sempre visível; ao ligar o auto-hide ela deve reaparecer
  // e só então começar a contagem, nunca sumir no mesmo frame em que liga.
  useEffect(() => { setVisible(true); arm(); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, [arm]);
  return { visible, poke, hold };
}
