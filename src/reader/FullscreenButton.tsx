interface Props { active: boolean; onToggle: () => void }

export function FullscreenButton({ active, onToggle }: Props) {
  return (
    <button type="button" onClick={onToggle} aria-label={active ? 'Sair da tela cheia' : 'Tela cheia'} aria-pressed={active}>
      {active ? '⤡' : '⤢'}
    </button>
  );
}
