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
}

export function ReaderControls(p: Props) {
  return (
    <div className="controls" data-visible={p.visible ? 'true' : 'false'} role="toolbar" aria-label="Controles de leitura">
      <button type="button" onClick={p.onPrev} aria-label="Página anterior" disabled={p.page <= 1}>‹</button>
      <PageIndicator page={p.page} pageCount={p.pageCount} onGoTo={p.onGoTo} />
      <button type="button" onClick={p.onNext} aria-label="Próxima página" disabled={p.lastVisiblePage >= p.pageCount}>›</button>
      <span className="controls__sep" aria-hidden="true" />
      <ZoomControls zoom={p.zoom} onZoomIn={p.onZoomIn} onZoomOut={p.onZoomOut} />
      <span className="controls__sep" aria-hidden="true" />
      <FullscreenButton active={p.fullscreen} onToggle={p.onToggleFullscreen} />
    </div>
  );
}
