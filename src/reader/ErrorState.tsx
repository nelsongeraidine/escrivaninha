// Renderiza o estado de erro com mensagem alertável e botão para voltar à biblioteca.
interface Props { message: string; onBack: () => void }

export function ErrorState({ message, onBack }: Props) {
  return (
    <main className="state wood">
      <p className="state__title" role="alert">{message}</p>
      <button type="button" className="button button--primary" onClick={onBack} autoFocus>
        Voltar para a biblioteca
      </button>
    </main>
  );
}
