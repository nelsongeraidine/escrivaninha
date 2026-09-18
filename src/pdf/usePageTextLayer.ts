import { useEffect, type RefObject } from 'react';
import { TextLayer } from 'pdfjs-dist';
import { useDocument } from './RendererContext';

/**
 * Injeta o texto selecionável/pesquisável da página sobre o canvas, via a
 * `TextLayer` do pdf.js. `--scale-factor` é a peça que a TextLayer espera
 * encontrar no container (ela mesma não define; é convenção do pdf.js) para
 * converter as métricas de fonte, que vêm em pontos do PDF, em pixels de CSS.
 *
 * Cada troca de página ou de escala reconstrói a camada do zero em vez de
 * atualizar uma instância existente: o texto de uma página pesa poucos KB, e
 * `getTextContent()` é rápido, então não compensa a complexidade extra de
 * manter e atualizar uma `TextLayer` viva entre re-renders.
 */
export function usePageTextLayer(
  container: RefObject<HTMLDivElement | null>,
  page: number | undefined,
  cssScale: number,
): void {
  const doc = useDocument();

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    el.replaceChildren();
    if (!page || !cssScale) return;

    let cancelled = false;
    let layer: TextLayer | null = null;

    void (async () => {
      const pdfPage = await doc.getPage(page);
      if (cancelled) return;
      const viewport = pdfPage.getViewport({ scale: cssScale });
      const textContent = await pdfPage.getTextContent();
      if (cancelled) return;
      el.style.setProperty('--scale-factor', String(cssScale));
      layer = new TextLayer({ textContentSource: textContent, container: el, viewport });
      await layer.render();
    })().catch((e: unknown) => {
      // Cancelamento (troca de página/zoom antes de terminar) não é erro real.
      if (!cancelled) console.error('Falha ao montar a camada de texto', page, e);
    });

    return () => {
      cancelled = true;
      layer?.cancel();
      el.replaceChildren();
    };
  }, [container, doc, page, cssScale]);
}
