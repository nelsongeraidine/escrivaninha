import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import type { SearchResult } from '../pdf/useBookSearch';

interface Props {
  open: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchResult[];
  indexing: boolean;
  progress: number;
  onJump: (page: number) => void;
  onClose: () => void;
}

export function SearchPanel({ open, query, onQueryChange, results, indexing, progress, onJump, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const statusId = useId();

  // Foca o campo toda vez que o painel abre, para digitar sem clicar.
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  if (!open) return null;

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    // Sem propagar: o handler global de teclado ignora INPUT, mas evita
    // qualquer ambiguidade futura se essa regra mudar.
    e.stopPropagation();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="search-panel" role="dialog" aria-label="Buscar no livro">
      <div className="search-panel__bar">
        <label className="visually-hidden" htmlFor={inputId}>Buscar no livro</label>
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          className="search-panel__input"
          placeholder="Buscar no livro..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKey}
          aria-describedby={statusId}
        />
        <button type="button" className="search-panel__close" onClick={onClose} aria-label="Fechar busca">✕</button>
      </div>

      <p id={statusId} className="search-panel__status" aria-live="polite">
        {indexing && `Lendo o livro... ${Math.round(progress * 100)}%`}
        {!indexing && query.trim() && results.length === 0 && 'Nenhum resultado.'}
        {!indexing && query.trim() && results.length > 0 && `${results.length} resultado${results.length > 1 ? 's' : ''}.`}
      </p>

      {results.length > 0 && (
        <ul className="search-panel__results">
          {results.map((r) => (
            <li key={r.page}>
              <button type="button" className="search-panel__result" onClick={() => onJump(r.page)}>
                <span className="search-panel__result-page">Página {r.page}</span>
                <span className="search-panel__result-snippet">
                  {r.before} <mark>{r.match}</mark> {r.after}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
