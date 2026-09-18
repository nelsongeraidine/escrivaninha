import { useEffect, useRef } from 'react';
import { usePageBitmap } from '../pdf/usePageBitmap';
import { usePageTextLayer } from '../pdf/usePageTextLayer';

interface Props {
  page?: number;
  scale: number;
  /** Escala em px de CSS (sem devicePixelRatio), para a camada de texto. */
  cssScale: number;
  cssWidth: number;
  cssHeight: number;
  side: 'left' | 'right' | 'single';
  /** A folha em `Sheet` é `aria-hidden` e duplica, por 650ms, uma página que
      já existe estática em `Book`; montar a camada de texto ali também seria
      trabalho perdido (busca `getTextContent()` de novo para nada visível
      nem acessível). Default `true`: só `Sheet` desliga. */
  textLayer?: boolean;
}

export function Page({ page, scale, cssScale, cssWidth, cssHeight, side, textLayer = true }: Props) {
  const bitmap = usePageBitmap(page, scale);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  // Só monta o texto depois que o bitmap chegou: evita texto selecionável
  // "flutuando" um frame antes da imagem da página aparecer por baixo.
  usePageTextLayer(textLayerRef, textLayer && bitmap ? page : undefined, cssScale);

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
    <div
      className={`page page--${side}`}
      style={{ width: cssWidth, height: cssHeight }}
      data-page={page ?? ''}
      role={page ? 'group' : undefined}
      aria-label={page ? `Página ${page}` : undefined}
    >
      {page ? (
        // `aria-hidden`: a camada de texto abaixo é quem carrega o conteúdo
        // acessível agora; o canvas vira só a imagem visual da página.
        <canvas ref={canvasRef} className="page__canvas" style={{ width: cssWidth, height: cssHeight }} aria-hidden="true" />
      ) : (
        <div className="page__blank" aria-hidden="true" />
      )}
      {/* Overlay marfim (multiply): iguala o branco do PDF ao tom do papel do
          verso e escurece de leve as bordas, como folha encadernada. */}
      {page && <div className="page__paper" aria-hidden="true" />}
      {/* Texto selecionável/pesquisável (TextLayer do pdf.js): habilita
          copiar e a busca nativa (Ctrl+F) do navegador nas páginas visíveis.
          Sem role/aria-label próprios: os spans (role="presentation", vindos
          do pdf.js) já expõem o texto como conteúdo do grupo acima. */}
      {page && textLayer && <div ref={textLayerRef} className="page__text" />}
      {page && !bitmap && <div className="page__loading" aria-hidden="true" />}
    </div>
  );
}
