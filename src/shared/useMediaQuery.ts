import { useEffect, useState } from 'react';
import type { ViewMode } from '../book/spreadLayout';

// jsdom não implementa `window.matchMedia`; sem o guard os testes que montam a
// árvore do leitor quebrariam. Fora do navegador assumimos "não casa".
function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (hasMatchMedia() ? window.matchMedia(query).matches : false));
  useEffect(() => {
    if (!hasMatchMedia()) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

// Duas páginas só quando há largura e a tela é mais larga que alta o bastante
// para as duas caberem sem ficarem minúsculas.
export function useViewMode(): ViewMode {
  const wide = useMediaQuery('(min-width: 900px) and (min-aspect-ratio: 6/5)');
  return wide ? 'spread' : 'single';
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
