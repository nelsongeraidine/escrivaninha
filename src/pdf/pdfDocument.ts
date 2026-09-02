import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { toAppError } from '../shared/errors';

// O worker precisa ser servido pelo próprio Vite; sem isso o pdf.js cai em
// modo "fake worker" na thread principal e trava a UI em PDFs grandes.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export interface LoadedDocument {
  doc: PDFDocumentProxy;
  pageCount: number;
  /** Tamanho da página 1 em pontos (escala 1); usado para ajustar o livro. */
  pageSize: { width: number; height: number };
}

export async function loadDocument(
  source: Blob,
  onProgress?: (loaded: number, total: number) => void,
): Promise<LoadedDocument> {
  try {
    const data = await source.arrayBuffer();
    const task = pdfjs.getDocument({ data });
    if (onProgress) task.onProgress = (p: { loaded: number; total: number }) => onProgress(p.loaded, p.total);
    const doc = await task.promise;
    const first = await doc.getPage(1);
    const vp = first.getViewport({ scale: 1 });
    return { doc, pageCount: doc.numPages, pageSize: { width: vp.width, height: vp.height } };
  } catch (e) {
    throw toAppError(e);
  }
}

export async function destroyDocument(loaded: LoadedDocument): Promise<void> {
  // No pdfjs-dist 6 o `PDFDocumentProxy` não expõe `destroy()`; quem encerra o
  // worker e as requisições de rede é o `loadingTask`.
  await loaded.doc.loadingTask.destroy();
}
