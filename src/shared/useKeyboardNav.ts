import { useEffect } from 'react';

interface Handlers {
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  exitFullscreen: () => void;
}

export function useKeyboardNav(h: Handlers, enabled = true): void {
  // Deps `[h, enabled]`: `h` deve vir memoizado (useMemo com `[nav]`) pelo
  // chamador. Como `nav` é um objeto novo a cada render do hook de navegação, o
  // listener acaba se re-registrando a cada render. É barato (um add/remove de
  // 'keydown' na window) e aceitável para o MVP; não vale a complexidade de um
  // ref para estabilizar.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // Campos editáveis (input de página) ficam com suas teclas.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      switch (e.key) {
        // preventDefault nas setas/PageUp/PageDown/Home/End: sem isso a
        // `.book-area` também rolaria junto com a virada de página.
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          h.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          h.prev();
          break;
        case 'Home':
          e.preventDefault();
          h.first();
          break;
        case 'End':
          e.preventDefault();
          h.last();
          break;
        // Escape apenas sai da tela cheia; nunca navega.
        case 'Escape':
          h.exitFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [h, enabled]);
}
