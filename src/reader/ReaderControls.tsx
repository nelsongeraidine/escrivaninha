import { PageIndicator } from './PageIndicator';
import { ZoomControls } from './ZoomControls';
import { FullscreenButton } from './FullscreenButton';

interface Props {
  visible: boolean;
  page: number; pageCount: number; zoom: number; fullscreen: boolean;
  // Ultima pagina visivel no spread atual: no modo spread o par (2k, 2k+1) chega
  // ao fim do livro quando `page` (a esquerda) ainda e menor que `pageCount`, entao
  // comparar so `page` deixaria "Proxima pagina" ativo no ultimo spread.
  lastVisiblePage: number;
  onPrev: () => void; onNext: () => void; onGoTo: (p: number) => void;
  onZoomIn: () => void; onZoomOut: () => void; onToggleFullscreen: () => void;
  onToggleSearch: () => void; searchActive: boolean;
}

// Icones em SVG (stroke, currentColor) para um conjunto visualmente coerente
// no lugar de glifos unicode de pesos diferentes.
function ChevronLeft() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M20 20l-4.6-4.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function ReaderControls(p: Props) {
  return (
    <div className="controls" data-visible={p.visible ? 'true' : 'false'} role="toolbar" aria-label="Controles de leitura">
      <button type="button" onClick={p.onPrev} aria-label="Página anterior" disabled={p.page <= 1}><ChevronLeft /></button>
      <PageIndicator page={p.page} pageCount={p.pageCount} onGoTo={p.onGoTo} lastVisiblePage={p.lastVisiblePage} />
      <button type="button" onClick={p.onNext} aria-label="Próxima página" disabled={p.lastVisiblePage >= p.pageCount}><ChevronRight /></button>
      <span className="controls__sep" aria-hidden="true" />
      <ZoomControls zoom={p.zoom} onZoomIn={p.onZoomIn} onZoomOut={p.onZoomOut} />
      <span className="controls__sep" aria-hidden="true" />
      <FullscreenButton active={p.fullscreen} onToggle={p.onToggleFullscreen} />
      <button type="button" onClick={p.onToggleSearch} aria-label="Buscar no livro" aria-pressed={p.searchActive}>
        <SearchIcon />
      </button>
    </div>
  );
}
