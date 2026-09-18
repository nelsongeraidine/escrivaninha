# TODO: Escrivaninha

Backlog de melhorias vindo da revisão `$impeccable critique` (18-09-2026, nota 27/40, "Aceitável"). Arquivo na raiz porque é rastreio de projeto, não código de aplicação (mesmo nível de README.md e PRD.md); o relatório completo fica em `.impeccable/critique/` (local, fora do git).

Convenção: `[ ]` pendente, `[x]` feito. Cada item cita o(s) arquivo(s) afetado(s).

## Feito

- [x] **P1 — Barra de controles some, e no touch o gesto de trazê-la de volta também vira a página.** Faixa morta de 30% em torno da lombada; controles nunca escondem antes da primeira interação real; fantasma a 14% de opacidade em vez de opacity 0. (`src/reader/Book.tsx`, `src/reader/ReaderView.tsx`, `src/shared/useAutoHide.ts`, `src/styles/reader.css`) — commit `eb2545f`.
- [x] **P1 — Foco de teclado invisível na primeira parada de Tab da biblioteca.** Um único `<input type="file">` (o pill "Abrir PDF" aciona o mesmo seletor via ref); `:focus-within` com anel dourado no painel inteiro da dropzone. (`src/library/PdfDropzone.tsx`, `src/library/LibraryView.tsx`, `src/styles/library.css`) — commit `eb2545f`.

- [x] **P2 — Zoom acima de 100% quebrava a metáfora de livro.** Recentraliza o scroll no vinco ao trocar de zoom ou de modo spread/single; barras de rolagem na paleta madeira via `scrollbar-color`/`::-webkit-scrollbar`. (`src/reader/Book.tsx`, `src/styles/book.css`) — 18-09-2026, versão 0.15.
- [x] **P2 — Tela de erro era beco sem saída.** "Escolher outro arquivo" agora é a ação primária (reabre o seletor direto, sem voltar à biblioteca); "Voltar para a biblioteca" fica como secundária. (`src/reader/ErrorState.tsx`, `src/app/App.tsx`, `src/styles/states.css`) — 18-09-2026, versão 0.15.

## Pendente — P3

- [ ] **Sem camada de texto do PDF: leitor de tela e busca (Ctrl+F) não funcionam.** Cada página é só um `<canvas role="img" aria-label="Página N">`; sem seleção, sem busca, sem conteúdo legível para tecnologia assistiva. Maior esforço de código do backlog (mexe em `src/pdf/`); único item que é acessibilidade de verdade, não só polimento. Fix: renderizar a camada de texto transparente do pdf.js sobre o canvas; se ficar fora do escopo, declarar isso explicitamente na seção de acessibilidade do PRD. (`src/pdf/`, `src/reader/Page.tsx`)

## Pendente — bug de layout (achado pelo detector, não é só gosto)

- [ ] **Parágrafo encostando na borda direita da tela no mobile.** `body-text-viewport-edge`: um `<p>` de 74 caracteres na biblioteca (provavelmente `.library__privacy` ou `.dropzone__hint`) bate a margem direita (11px) só em 390px de largura. (`src/styles/library.css`)

## Pendente — observações menores

- [ ] Indicador mostra "Página 6 / 50" com as páginas 6 e 7 visíveis; devia dizer "Páginas 6-7 de 50". (`src/reader/PageIndicator.tsx`)
- [ ] Número da página atrasa durante a virada (só atualiza no fim da animação). (`src/reader/Sheet.tsx`, `src/book/useBookNavigation.ts`)
- [ ] Nome do livro nunca aparece dentro do leitor; a moldura "biblioteca particular" evapora ao entrar no livro. (`src/reader/ReaderView.tsx`)
- [ ] Salto para página fora do intervalo (input de página) não dá feedback visual do clamp. (`src/reader/PageIndicator.tsx`)
- [ ] **`.library__credit`** (assinatura "feito por @nelsonggeraidine") mede ~3,17:1 de contraste a 11px, abaixo do AA de 4,5:1 para texto normal. É recente (sessão de 18-09-2026); ajustar opacidade/cor. (`src/styles/library.css`)
- [ ] `.continue__label` ("Continuar lendo") a 10px, abaixo do piso de 11px para texto funcional. (`src/styles/library.css`)
- [ ] Folha em movimento não tem curvatura (lê como cartão, não como papel); pico de sombra em 0,85 escurece bastante a página saindo. (`src/styles/book.css`)
- [ ] "← Biblioteca" usa um glifo de seta em texto enquanto todo o resto usa o conjunto de ícones SVG traçados. (`src/reader/ReaderView.tsx`)
- [ ] Sem sumário/TOC, busca ou miniaturas; no livro de 800 páginas o único jeito de chegar na página 600 é o salto numérico. (evolução maior, fora do MVP)

## Decisão registrada — deixar como está

- **Padrões visuais genéricos do detector** (`dark-glow`, `wide-tracking`, `gpt-thin-border-wide-shadow`, `nested-cards`, `repeating-stripes-gradient`, `flat-type-hierarchy`): revisados em 18-09-2026, a maioria é decisão consciente de `tokens.css` (brilho dourado do título, tracking do subtítulo). Não mexer sem pedido explícito.
- **EPUB**: avaliado e descartado em 18-09-2026 (exigiria segundo motor de renderização e dependência nova). Ver histórico do PRD.md, versão 0.13.
