import { useRef, type ChangeEvent } from 'react';

// Renderiza o estado de erro com mensagem alertável. "Escolher outro arquivo" é
// a ação primária porque o erro costuma ser trivial (arquivo errado); forçar
// a volta à biblioteca para tentar de novo era um desvio sem necessidade.
interface Props { message: string; onBack: () => void; onPickFile: (file: File) => void }

export function ErrorState({ message, onBack, onPickFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPickFile(file);
    e.target.value = '';
  }

  return (
    <main className="state wood">
      <p className="state__title" role="alert">{message}</p>
      <div className="state__actions">
        <button type="button" className="button button--primary" onClick={() => inputRef.current?.click()} autoFocus>
          Escolher outro arquivo
        </button>
        <button type="button" className="button" onClick={onBack}>
          Voltar para a biblioteca
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        onChange={onChange}
      />
    </main>
  );
}
