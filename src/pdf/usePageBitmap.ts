import { useEffect, useState } from 'react';
import { useRenderer } from './RendererContext';

/**
 * Devolve o bitmap da página na escala pedida. Mantém o bitmap anterior até o
 * novo chegar, para o zoom não "piscar" a página em branco.
 */
export function usePageBitmap(page: number | undefined, scale: number): ImageBitmap | null {
  const renderer = useRenderer();
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);

  useEffect(() => {
    if (!page) { setBitmap(null); return; }
    // `alive` evita aplicar o resultado de um pedido antigo depois que página ou
    // escala mudaram; o AbortError do pedido cancelado é ignorado de propósito.
    let alive = true;
    renderer.request(page, scale, 'visible')
      .then((b) => { if (alive) setBitmap(b); })
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name !== 'AbortError') console.error('Falha ao renderizar página', page, e);
      });
    return () => { alive = false; };
  }, [renderer, page, scale]);

  return bitmap;
}
