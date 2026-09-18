import { useCallback, useEffect, useRef, useState } from 'react';
import { useDocument } from './RendererContext';

export interface SearchResult { page: number; before: string; match: string; after: string }

// Baixa concorrência: extrair texto compete pelo mesmo worker do pdf.js que
// renderiza as páginas visíveis; poucos pedidos por vez evita competir demais
// com o que o usuário está lendo agora.
const CONCURRENCY = 3;
// Caracteres de contexto ao redor do termo, para o trecho do resultado.
const CONTEXT = 30;

/**
 * Busca por substring no livro inteiro (não só nas páginas na tela). A
 * indexação é preguiçosa: só começa na primeira busca real, para não competir
 * com o carregamento do livro. Não persiste entre sessões; é refeita a cada
 * vez. Sem normalização de acento nem stemming: é um leitor pessoal, não um
 * motor de busca.
 */
export function useBookSearch(pageCount: number) {
  const doc = useDocument();
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState(0);

  const index = useRef<Map<number, string>>(new Map());
  const started = useRef(false);
  const cancelled = useRef(false);

  // Zera no corpo do efeito, não só no cleanup: o StrictMode do React, em dev,
  // monta -> desmonta -> remonta os efeitos uma vez; sem isso o cleanup do
  // primeiro (fantasma) ciclo deixava `cancelled.current` travado em `true`
  // para sempre, e todo worker de indexação desistia no primeiro loop sem
  // erro nenhum (o `if (cancelled.current) return` no topo do laço).
  useEffect(() => {
    cancelled.current = false;
    return () => { cancelled.current = true; };
  }, []);

  const runSearch = useCallback((q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) { setResults([]); return; }
    const found: SearchResult[] = [];
    for (const [page, text] of index.current) {
      const idx = text.toLowerCase().indexOf(needle);
      if (idx === -1) continue;
      const start = Math.max(0, idx - CONTEXT);
      const end = Math.min(text.length, idx + needle.length + CONTEXT);
      found.push({
        page,
        before: (start > 0 ? '…' : '') + text.slice(start, idx).trim(),
        match: text.slice(idx, idx + needle.length),
        after: text.slice(idx + needle.length, end).trim() + (end < text.length ? '…' : ''),
      });
    }
    found.sort((a, b) => a.page - b.page);
    setResults(found);
  }, []);

  const ensureIndexing = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setIndexing(true);
    let next = 1;
    let done = 0;
    async function worker() {
      for (;;) {
        if (cancelled.current) return;
        const page = next++;
        if (page > pageCount) return;
        try {
          const pdfPage = await doc.getPage(page);
          const content = await pdfPage.getTextContent();
          if (cancelled.current) return;
          const text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
          index.current.set(page, text);
        } catch (e) {
          console.error('Falha ao indexar página para busca', page, e);
        }
        done++;
        // Reporta a cada 16 páginas (e na última), não a cada página: eram
        // até 800 atualizações de estado em ~1,5s para uma simples barra de
        // progresso de texto, disparando renders demais em sequência rápida
        // (o React chegou a acusar "Maximum update depth exceeded" num
        // livro de 800 páginas).
        if (!cancelled.current && (done % 16 === 0 || done === pageCount)) {
          setProgress(done / pageCount);
        }
      }
    }
    const workers = Array.from({ length: Math.min(CONCURRENCY, pageCount) }, () => worker());
    void Promise.all(workers).then(() => { if (!cancelled.current) setIndexing(false); });
  }, [doc, pageCount]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    if (q.trim()) ensureIndexing();
    runSearch(q);
  }, [ensureIndexing, runSearch]);

  // Conforme a indexação avança, refaz a busca para o índice crescer os
  // resultados progressivamente, sem o usuário precisar digitar de novo.
  useEffect(() => { if (query.trim()) runSearch(query); }, [progress, query, runSearch]);

  return { query, setQuery, results, indexing, progress };
}
