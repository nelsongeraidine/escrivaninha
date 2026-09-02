import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

interface Props { page: number; pageCount: number; onGoTo: (p: number) => void }

export function PageIndicator({ page, pageCount, onGoTo }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);
  // `onBlur={commit}` dispara de novo quando o input desmonta logo após Enter ou
  // Escape. Sem esta trava: Enter chamaria `onGoTo` duas vezes e Escape acabaria
  // "confirmando" o número digitado em vez de cancelar.
  const skipCommit = useRef(false);
  const inputId = useId();

  // Ao abrir o editor: zera a trava, parte do valor atual e seleciona tudo.
  useEffect(() => {
    if (editing) { skipCommit.current = false; setValue(String(page)); inputRef.current?.select(); }
  }, [editing, page]);

  function commit() {
    // Já fechado, ou o commit veio do blur de desmonte após Enter/Escape: ignora
    // e rearma a trava para o próximo ciclo de edição.
    if (!editing || skipCommit.current) { skipCommit.current = false; return; }
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) onGoTo(n);
    // O blur disparado pelo desmonte não deve repetir o salto.
    skipCommit.current = true;
    setEditing(false);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    // Parar propagação: as setas aqui editam o número e o handler global de
    // teclado da janela (Task 13) não deve virar a página enquanto edito.
    e.stopPropagation();
    if (e.key === 'Enter') commit();
    // Escape cancela sem salvar; a trava impede que o blur de desmonte comite.
    if (e.key === 'Escape') { skipCommit.current = true; setEditing(false); }
  }

  if (editing) {
    return (
      <span className="indicator">
        <label className="visually-hidden" htmlFor={inputId}>Ir para a página</label>
        <input id={inputId} ref={inputRef} type="number" min={1} max={pageCount} value={value}
          className="indicator__input" autoFocus
          onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} onBlur={commit} />
        <span className="indicator__total"> / {pageCount}</span>
      </span>
    );
  }
  return (
    <button type="button" className="indicator" onClick={() => setEditing(true)} aria-label={`Página ${page} de ${pageCount}. Ir para uma página`}>
      {/* `aria-live="polite"` no texto visível: o leitor de tela anuncia a nova
          página ao virar sem roubar o foco. Fica dentro do botão para o
          `aria-label` continuar sendo o nome acessível do controle. */}
      <span aria-live="polite">Página {page} / {pageCount}</span>
    </button>
  );
}
