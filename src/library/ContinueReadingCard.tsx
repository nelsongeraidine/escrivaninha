interface Props { name: string; page: number; pageCount: number; onContinue: () => void }

export function ContinueReadingCard({ name, page, pageCount, onContinue }: Props) {
  return (
    <button type="button" className="continue" onClick={onContinue}>
      <span className="continue__label">Continuar lendo</span>
      <span className="continue__name">{name}</span>
      <span className="continue__page">Página {page} de {pageCount}</span>
    </button>
  );
}
