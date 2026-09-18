# TODO: Escrivaninha

Backlog de melhorias vindo da revisão `$impeccable critique` (18-09-2026, nota 27/40, "Aceitável"). Arquivo na raiz porque é rastreio de projeto, não código de aplicação (mesmo nível de README.md e PRD.md); o relatório completo fica em `.impeccable/critique/` (local, fora do git).

Convenção: `[ ]` pendente, `[x]` feito. Cada item cita o(s) arquivo(s) afetado(s).

## Feito

- [x] **P1 — Barra de controles some, e no touch o gesto de trazê-la de volta também vira a página.** Faixa morta de 30% em torno da lombada; controles nunca escondem antes da primeira interação real; fantasma a 14% de opacidade em vez de opacity 0. (`src/reader/Book.tsx`, `src/reader/ReaderView.tsx`, `src/shared/useAutoHide.ts`, `src/styles/reader.css`) — commit `eb2545f`.
- [x] **P1 — Foco de teclado invisível na primeira parada de Tab da biblioteca.** Um único `<input type="file">` (o pill "Abrir PDF" aciona o mesmo seletor via ref); `:focus-within` com anel dourado no painel inteiro da dropzone. (`src/library/PdfDropzone.tsx`, `src/library/LibraryView.tsx`, `src/styles/library.css`) — commit `eb2545f`.

- [x] **P2 — Zoom acima de 100% quebrava a metáfora de livro.** Recentraliza o scroll no vinco ao trocar de zoom ou de modo spread/single; barras de rolagem na paleta madeira via `scrollbar-color`/`::-webkit-scrollbar`. (`src/reader/Book.tsx`, `src/styles/book.css`) — 18-09-2026, versão 0.15.
- [x] **P2 — Tela de erro era beco sem saída.** "Escolher outro arquivo" agora é a ação primária (reabre o seletor direto, sem voltar à biblioteca); "Voltar para a biblioteca" fica como secundária. (`src/reader/ErrorState.tsx`, `src/app/App.tsx`, `src/styles/states.css`) — 18-09-2026, versão 0.15.

## Feito (P3)

- [x] **Sem camada de texto do PDF: leitor de tela e busca (Ctrl+F) não funcionavam.** `TextLayer` do pdf.js injetada sobre o canvas via `usePageTextLayer`; canvas virou `aria-hidden`, página ganhou `role="group"`/`aria-label`. Verificado ao vivo: texto extraído certo, seleção funciona, `window.find()` acha e destaca, e o clique para virar página (RF07) continua funcionando mesmo em cima do texto (clique simples não é bloqueado por `user-select`). Não cobre busca no livro inteiro (só nas páginas renderizadas na tela; item de TOC/busca abaixo continua em aberto). (`src/pdf/usePageTextLayer.ts`, `src/pdf/RendererContext.tsx`, `src/reader/Page.tsx`, `src/reader/Book.tsx`, `src/reader/Sheet.tsx`, `src/styles/book.css`) — 18-09-2026, versão 0.17.

## Feito (bug de layout + observações menores, lote 18-09-2026 v0.16)

- [x] **Parágrafo encostando na borda direita da tela no mobile.** `body-text-viewport-edge`: `.library__privacy` ganhou `max-width` e o texto virou `<span>` para dimensionar certo dentro do flex; margem da borda passou de ~11px para ~15px. (`src/library/LibraryView.tsx`, `src/styles/library.css`)
- [x] Indicador mostrava "Página 6 / 50" com as páginas 6 e 7 visíveis; agora diz "Páginas 6-7 / 50" (e no aria-label) quando o spread tem duas páginas. (`src/reader/PageIndicator.tsx`, `src/reader/ReaderControls.tsx`)
- [x] Nome do livro nunca aparecia dentro do leitor; agora mostra no canto superior direito, some/aparece com o resto do chrome. (`src/reader/ReaderView.tsx`, `src/styles/reader.css`)
- [x] **`.library__credit`** tinha ~3,17:1 de contraste a 11px; opacidade ajustada de 0,4 para 0,55 (~4,9:1, acima do AA de 4,5:1). (`src/styles/library.css`)
- [x] `.continue__label` ("Continuar lendo") estava a 10px, abaixo do piso de 11px; ajustado para 11px. (`src/styles/library.css`)
- [x] "← Biblioteca" usava um glifo de seta em texto; agora usa o mesmo conjunto de ícones SVG traçados do resto da barra. (`src/reader/ReaderView.tsx`)

## Feito (últimos itens do lote, 18-09-2026 v0.18)

- [x] **Número da página atrasava durante a virada.** O indicador agora mostra o spread de destino (`nav.flip.to`) assim que a virada começa, não só ao terminar; `nav.currentPage` (confirmado) continua sendo o que persiste e o que o prefetch usa. Confirmado ao vivo: 80ms dentro de uma virada de 650ms o indicador já mostrava "Páginas 12-13", não mais "10-11". (`src/reader/ReaderView.tsx`)
- [x] **Salto para página fora do intervalo não dava feedback.** Um Enter fora de 1..N mostra aviso inline (`role="alert"`, campo treme e fica bordô) e mantém o campo aberto para corrigir; editar de novo já limpa o aviso; um blur (clicar fora) continua aceitando o valor bruto e deixando o clamp para `goToPage`, exatamente como antes, para nunca prender o foco. 3 testes novos cobrindo o fluxo. (`src/reader/PageIndicator.tsx`, `src/reader/PageIndicator.test.tsx`, `src/styles/reader.css`)
- [x] **Folha sem curvatura, lia como cartão.** `scaleY(1.018)` sutil no meio do giro (a folha "incha" de leve ao ficar de perfil); o realce de curvatura (`sheet__face::after`) ganhou uma animação própria (`curl`) que intensifica no meio da virada em vez de ficar estático; pico de sombra reduzido de 0,85 para 0,55. Confirmado ao vivo via amostras de opacidade computada durante a animação (0,41 → 0,90 → 0,99 → 0,53 → 0,40). (`src/styles/book.css`)

## Pendente

- [ ] Sem sumário/TOC, busca ou miniaturas; no livro de 800 páginas o único jeito de chegar na página 600 é o salto numérico. Busca hoje só alcança as páginas renderizadas na tela (a camada de texto do item P3 acima cobre isso). Evolução maior, fora do MVP: precisaria de um índice de texto do livro inteiro, não só das páginas visíveis.

## Decisão registrada — deixar como está

- **Padrões visuais genéricos do detector** (`dark-glow`, `wide-tracking`, `gpt-thin-border-wide-shadow`, `nested-cards`, `repeating-stripes-gradient`, `flat-type-hierarchy`): revisados em 18-09-2026, a maioria é decisão consciente de `tokens.css` (brilho dourado do título, tracking do subtítulo). Não mexer sem pedido explícito.
- **EPUB**: avaliado e descartado em 18-09-2026 (exigiria segundo motor de renderização e dependência nova). Ver histórico do PRD.md, versão 0.13.
