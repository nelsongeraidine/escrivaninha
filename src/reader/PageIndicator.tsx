import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Props { page: number; pageCount: number; onGoTo: (p: number) => void }

export function PageIndicator({ page, pageCount, onGoTo }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);

  // Ao abrir o editor: parte do valor atual e seleciona tudo para digitar por cima.
  useEffect(() => { if (editing) { setValue(String(page)); inputRef.current?.select(); } }, [editing, page]);

  function commit() {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) onGoTo(n);
    setEditing(false);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    // Parar propagação: as setas aqui editam o número e o handler global de
    // teclado da janela (Task 13) não deve virar a página enquanto edito.
    e.stopPropagation();
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <span className="indicator">
        <label className="visually-hidden" htmlFor="goto-page">Ir para a página</label>
        <input id="goto-page" ref={inputRef} type="number" min={1} max={pageCount} value={value}
          className="indicator__input" autoFocus
          onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} onBlur={commit} />
        <span className="indicator__total"> / {pageCount}</span>
      </span>
    );
  }
  return (
    <button type="button" className="indicator" onClick={() => setEditing(true)} aria-label={`Página ${page} de ${pageCount}. Ir para uma página`}>
      Página {page} / {pageCount}
    </button>
  );
}
