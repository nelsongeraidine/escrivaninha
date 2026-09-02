import { useCallback, useEffect, useState, type RefObject } from 'react';

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // O estado real de tela cheia é do documento: espelhamos o evento nativo em
    // vez de confiar no clique, que pode falhar (sem gesto, permissão negada).
    const onChange = () => setActive(document.fullscreenElement === target.current && !!target.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [target]);
  const toggle = useCallback(() => {
    const el = target.current;
    if (!el) return;
    // Navegadores sem a API (ou jsdom): `requestFullscreen` é undefined e o
    // toggle vira no-op em vez de estourar.
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  }, [target]);
  return { active, toggle };
}
