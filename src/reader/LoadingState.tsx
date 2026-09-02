// Renderiza o estado de carregamento com animação do livro abrindo e barra de progresso.
interface Props { name: string; progress: number }

export function LoadingState({ name, progress }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <main className="state wood" aria-busy="true">
      <div className="opening-book" aria-hidden="true">
        <span className="opening-book__cover" />
        <span className="opening-book__page" />
        <span className="opening-book__page opening-book__page--2" />
      </div>
      <p className="state__title">Preparando seu livro...</p>
      <p className="state__detail">{name}</p>
      <div className="state__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Carregando">
        <span style={{ width: `${pct}%` }} />
      </div>
    </main>
  );
}
