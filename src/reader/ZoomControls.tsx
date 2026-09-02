interface Props { zoom: number; onZoomIn: () => void; onZoomOut: () => void }

export function ZoomControls({ zoom, onZoomIn, onZoomOut }: Props) {
  return (
    <span className="zoom" role="group" aria-label="Zoom">
      <button type="button" onClick={onZoomOut} aria-label="Diminuir zoom" disabled={zoom <= 50}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
      <span className="zoom__value" aria-live="polite">{zoom}%</span>
      <button type="button" onClick={onZoomIn} aria-label="Aumentar zoom" disabled={zoom >= 200}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
