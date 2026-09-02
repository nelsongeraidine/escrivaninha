import { useEffect, useRef } from 'react';
import { usePageBitmap } from '../pdf/usePageBitmap';

interface Props {
  page?: number;
  scale: number;
  cssWidth: number;
  cssHeight: number;
  side: 'left' | 'right' | 'single';
}

export function Page({ page, scale, cssWidth, cssHeight, side }: Props) {
  const bitmap = usePageBitmap(page, scale);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!bitmap) { canvas.width = 0; canvas.height = 0; return; }
    // Um bitmap já fechado (dispose no StrictMode) fica com 0x0 pela spec de
    // ImageBitmap; desenhá-lo lançaria InvalidStateError, então ignoramos.
    if (bitmap.width === 0 || bitmap.height === 0) return;
    // Só redimensiona quando as dimensões mudam: atribuir width/height limpa o
    // canvas, então fazer isso a cada frame causaria flicker no zoom.
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width; canvas.height = bitmap.height;
    }
    ctx.drawImage(bitmap, 0, 0);
  }, [bitmap]);

  return (
    <div className={`page page--${side}`} style={{ width: cssWidth, height: cssHeight }} data-page={page ?? ''}>
      {page ? (
        <canvas ref={canvasRef} className="page__canvas" style={{ width: cssWidth, height: cssHeight }} aria-label={`Página ${page}`} role="img" />
      ) : (
        <div className="page__blank" aria-hidden="true" />
      )}
      {/* Overlay marfim (multiply): iguala o branco do PDF ao tom do papel do
          verso e escurece de leve as bordas, como folha encadernada. */}
      {page && <div className="page__paper" aria-hidden="true" />}
      {page && !bitmap && <div className="page__loading" aria-hidden="true" />}
    </div>
  );
}
