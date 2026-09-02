interface Props { zoom: number; onZoomIn: () => void; onZoomOut: () => void }

export function ZoomControls({ zoom, onZoomIn, onZoomOut }: Props) {
  return (
    <span className="zoom" role="group" aria-label="Zoom">
      {/* Rótulo com o sinal de menos matemático (U+2212), mais legível que o hífen. */}
      <button type="button" onClick={onZoomOut} aria-label="Diminuir zoom" disabled={zoom <= 50}>−</button>
      <span className="zoom__value" aria-live="polite">{zoom}%</span>
      <button type="button" onClick={onZoomIn} aria-label="Aumentar zoom" disabled={zoom >= 200}>+</button>
    </span>
  );
}
