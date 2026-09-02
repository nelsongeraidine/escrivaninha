import { useCallback, useEffect, useRef, useState } from 'react';

/** Visível após atividade; some após `delayMs` parado; `hold(true)` segura (foco/hover na barra). */
export function useAutoHide(delayMs: number) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  const arm = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    // `held` é ref e não dep: o timer relê o valor corrente ao disparar, então
    // segurar a barra depois de armado ainda impede o auto-ocultar.
    timer.current = window.setTimeout(() => { if (!held.current) setVisible(false); }, delayMs);
  }, [delayMs]);

  const poke = useCallback(() => { setVisible(true); arm(); }, [arm]);
  const hold = useCallback((on: boolean) => { held.current = on; if (on) setVisible(true); else arm(); }, [arm]);

  useEffect(() => { arm(); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, [arm]);
  return { visible, poke, hold };
}
