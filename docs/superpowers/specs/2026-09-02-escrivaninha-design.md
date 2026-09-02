# Escrivaninha: design do MVP

Data: 2026-09-02

## Objetivo

Aplicativo web que abre um PDF local e o apresenta como um livro físico: páginas em spread, virada de página animada, navegação por mouse, teclado e touch. Processamento 100% no navegador; o arquivo nunca sai do dispositivo.

Nome: **Escrivaninha**. Subtítulo: **Sua biblioteca particular**. Idioma da UI: português brasileiro.

Pergunta guia para toda decisão de UX: "isso faz o usuário sentir que está lendo um livro ou usando um visualizador de PDF?"

## Escopo do MVP

Inclui:
- Tela inicial (biblioteca) com dropzone + botão "Abrir PDF" e card "Continuar lendo" quando houver livro salvo.
- Leitor em modo livro com spread de 2 páginas (desktop/paisagem) ou 1 página (mobile/retrato).
- Virada de página animada em CSS 3D, nos dois sentidos.
- Controles: anterior, próxima, indicador `Página N / T` com salto direto, zoom 50 a 200 %, tela cheia, voltar para biblioteca.
- Teclado (← → PageUp PageDown Home End Esc), clique nas metades do livro, swipe horizontal.
- Persistência local: arquivo (IndexedDB, teto 150 MB), página atual, zoom.
- Estados: biblioteca, carregando, lendo, erro.

Fora do MVP (evoluções possíveis): arrastar a página com o dedo/mouse (drag curl), múltiplos livros na biblioteca, marcadores, busca de texto, PDFs com senha.

## Stack

- Vite 8, React 19, TypeScript (strict).
- `pdfjs-dist` 6.x; worker importado via `pdfjs-dist/build/pdf.worker.min.mjs?url` (sem CDN).
- CSS puro com custom properties. Sem Tailwind, sem lib de componentes.
- Fontes self-hosted via `@fontsource`: Cormorant Garamond (títulos) e Inter (UI).
- Vitest + Testing Library para unidades; Playwright (MCP) para validação no navegador.
- Git desde o início; deploy alvo Vercel (site estático, sem backend).

## Estrutura de pastas

```
src/
  app/          App.tsx, appState.ts (máquina de estados)
  library/      LibraryView, PdfDropzone, ContinueReadingCard
  reader/       ReaderView, Book, Sheet, Page, ReaderControls, PageIndicator, ZoomControls, FullscreenButton, LoadingState, ErrorState
  pdf/          pdfDocument.ts, pageRenderer.ts, bitmapCache.ts, usePdfDocument.ts, usePageBitmap.ts
  book/         spreadLayout.ts, useBookNavigation.ts, useFlipAnimation.ts
  persistence/  bookStore.ts (IndexedDB), readingState.ts (localStorage)
  shared/       useFullscreen.ts, useKeyboardNav.ts, useSwipe.ts, useMediaQuery.ts, errors.ts
  styles/       tokens.css, base.css, wood.css, book.css
```

Nenhum arquivo deve concentrar a aplicação; cada unidade tem uma responsabilidade e interface clara.

## Máquina de estados da aplicação

```
library --(arquivo válido)--> loading --(doc pronto)--> reading
loading --(falha)--> error --(ok)--> library
reading --(← Biblioteca)--> library   (mantém documento em memória e estado de leitura)
reading --(novo arquivo)--> loading
```

`library` exibe "Continuar lendo" se `readingState` + `bookStore` tiverem um livro. Reabrir a partir do card vai direto para `loading` com o Blob do IndexedDB.

## Modelo do livro (spreadLayout)

Termos:
- **page**: índice 1-based do PDF.
- **sheet**: folha física com frente (recto) e verso (verso).
- **spread**: par visível (esquerda, direita); qualquer lado pode ser vazio.

Modo spread (2 páginas): a capa (página 1) aparece sozinha à direita, como livro real. Regra geral: spread 0 = (vazio, 1); spread k (k ≥ 1) = (2k, 2k+1). Página par à esquerda, ímpar à direita. Se o total for par, o último spread é (total, vazio). Sheet k (k ≥ 0) tem frente = 2k+1 e verso = 2k+2; virar a sheet k leva do spread k ao spread k+1.

Modo single (1 página): spread n = (n); a sheet é a própria página, gira sobre a borda externa.

Funções puras exportadas:
- `spreadForPage(page, mode, total) -> spreadIndex`
- `pagesInSpread(spreadIndex, mode, total) -> { left?: page, right?: page }`
- `pagesToPrefetch(spreadIndex, mode, total, radius) -> page[]`
- `clampPage(page, total)`

Ao trocar de modo (rotacionar o celular, redimensionar), a página atual é preservada e o spread recalculado.

## Animação de virada (useFlipAnimation)

- Container do livro com `perspective: 2400px`.
- Só a sheet em movimento vira; front e back com `backface-visibility: hidden`, `transform-origin` na lombada (spread) ou na borda externa (single).
- Avançar: `rotateY(0 → -180deg)`; voltar: `rotateY(-180 → 0)` da sheet anterior. Duração 650 ms, easing `cubic-bezier(0.4, 0, 0.2, 1)`.
- A virada usa `@keyframes` CSS (transform da folha e opacidade das camadas de luz/sombra) e o React espera `animationend` para confirmar o novo spread.
- Durante a animação, entradas de navegação são enfileiradas (no máximo 1 pendente) para não quebrar o estado; ao terminar, o estado lógico avança e a sheet volta a ser DOM estático.
- `prefers-reduced-motion`: troca instantânea com fade de 150 ms.

Detalhes estáticos: gradiente de lombada no centro, bordas de papel creme (`#f4ecd8`) com vinheta leve, blocos laterais simulando páginas restantes (espessura proporcional à posição), sombra ambiente do livro sobre a mesa.

## Renderização de PDF (pdf/)

- `pdfDocument.ts`: `loadDocument(source: File | Blob | ArrayBuffer, onProgress)` retorna `PDFDocumentProxy`; `destroyDocument()`. Um documento ativo por vez.
- `pageRenderer.ts`: `renderPage(doc, pageNumber, scale) -> Promise<ImageBitmap>`; escala efetiva = `devicePixelRatio × zoom × fitScale`, onde `fitScale` ajusta a página à área disponível. Fila com concorrência 2; cada job é cancelável (`RenderTask.cancel()`); pedidos fora da janela atual são cancelados.
- `bitmapCache.ts`: LRU por chave `page@scale`, limite 24 entradas ou ~100 MB estimados (largura × altura × 4). Ao evictar, `ImageBitmap.close()`.
- `usePageBitmap(page, scale)`: retorna bitmap do cache ou dispara render; mantém o bitmap anterior (escala antiga) até o novo chegar, evitando flash durante zoom.
- Prefetch: spread atual ± 2 spreads (raio 4 páginas). Prioridade: visível > próximo > anterior.
- `Page` desenha o bitmap em um `<canvas>` via `drawImage` (canvas com `width/height` em pixels físicos e CSS em pixels lógicos).

## Zoom

Níveis: 50, 75, 100, 125, 150, 175, 200 %. 100 % = página ajustada à altura disponível. Zoom > 100 % mantém o livro centralizado e permite rolagem dentro da área do leitor (overflow do container, sem deslocar a barra de controles). Zoom altera a escala de render; o cache guarda bitmaps por escala.

## Controles e interação

- Barra inferior translúcida (blur leve, fundo marrom-escuro 70 %), aparece ao mover o mouse/tocar e some após 2,5 s parada. Sempre visível enquanto tiver foco de teclado dentro dela.
- Conteúdo: `‹` `Página 14 / 286` `›` | `−  100%  +` | tela cheia. O indicador é um botão; ao clicar vira input numérico; Enter salta, Esc cancela.
- `← Biblioteca` no canto superior esquerdo, mesma lógica de auto-ocultar.
- Mouse: clique na metade direita do livro avança; esquerda volta. Cliques na barra não propagam.
- Teclado (com foco em qualquer lugar do leitor): `←`/`PageUp` volta, `→`/`PageDown` avança, `Home` primeira, `End` última, `Esc` sai de tela cheia. Ignorado quando o foco está no input de página.
- Touch: swipe horizontal com deslocamento ≥ 50 px e predominantemente horizontal.
- Tela cheia via Fullscreen API no elemento raiz do leitor; ao entrar, `← Biblioteca` e barra seguem a regra de auto-ocultar.

Acessibilidade: todos os botões com `aria-label`; indicador de página em `aria-live="polite"`; foco visível com anel dourado; contraste mínimo 4.5:1 nos textos da UI; mensagens de erro em `role="alert"`.

## Upload

- `PdfDropzone`: área clicável (abre `<input type="file" accept="application/pdf,.pdf">`) e alvo de drag & drop. Estados: idle, dragover (borda dourada, leve elevação do livro ilustrado), rejeitado (shake curto + mensagem).
- Validação: extensão `.pdf` ou MIME `application/pdf`, mais verificação dos 5 primeiros bytes (`%PDF-`). Tamanho máximo aceito para leitura: 500 MB (acima disso, erro amigável). Persistência só até 150 MB.

## Persistência

- IndexedDB, banco `escrivaninha`, store `books`, chave fixa `current`: `{ name, size, pageCount, blob?, savedAt }`. `blob` presente só se `size ≤ 150 MB`.
- localStorage `escrivaninha.reading`: `{ name, size, page, zoom, updatedAt }`. Página e zoom salvos com debounce de 300 ms.
- Ao abrir um arquivo com mesmo `name + size` do salvo, retoma a página. Arquivo diferente reinicia na página 1.
- Falhas de IndexedDB (modo privado, cota) são silenciosas: a leitura funciona, só não persiste.

## Estados e mensagens

- Biblioteca vazia: título, subtítulo, dropzone com "Seu próximo livro", "Escolha um PDF e comece a leitura.", "Clique para selecionar ou arraste o arquivo até aqui.", botão "Abrir PDF", rodapé "O documento permanece neste dispositivo e não é enviado a nenhum servidor."
- Carregando: "Preparando seu livro..." com animação CSS de livro abrindo e barra fina de progresso quando `onProgress` reportar total.
- Erro (mapeado em `shared/errors.ts`):
  - não é PDF → "Este arquivo não parece ser um PDF."
  - `InvalidPDFException` → "Não foi possível abrir este PDF. O arquivo pode estar danificado."
  - `PasswordException` → "Este PDF está protegido por senha. Ainda não é possível abri-lo aqui."
  - tamanho > 500 MB → "Este arquivo é muito grande para ser lido aqui (limite de 500 MB)."
  - falha de render → "Houve um problema ao exibir esta página."
  - genérico → "Algo deu errado ao preparar seu livro. Tente novamente."
  Nunca exibir mensagem técnica; detalhe vai para `console.error`.

## Identidade visual

Tokens (`tokens.css`):
- `--wood-900: #1a110b`, `--wood-800: #2a1a10`, `--wood-700: #3d2617`, `--wood-600: #5a3a24`
- `--gold-500: #c9a45c`, `--gold-300: #e2c98a`
- `--cream-100: #f4ecd8`, `--cream-200: #e9dfc6`
- `--bordeaux-600: #6e1f23`
- `--ink-900: #1c1410`
- Tipografia: Cormorant Garamond 500/600 para título e subtítulo (subtítulo em itálico); Inter 400/500 para UI.
- Fundo da biblioteca: gradientes CSS em camadas (veios de madeira com `repeating-linear-gradient` de baixo contraste + vinheta radial). Sem imagem. Fundo do leitor: `--wood-900` com vinheta, mais discreto para não competir com o livro.
- Botão principal: contorno dourado, texto dourado, fundo translúcido; hover preenche levemente. Sem gradientes saturados, sem sombras coloridas.

## Responsividade

- `min-width: 900px` e orientação paisagem (ou proporção ≥ 1.2): modo spread.
- Abaixo disso: modo single.
- Página ajustada pela altura disponível (viewport menos barra), limitada pela largura.
- Em telas < 480 px a barra de controles reduz para `‹ 14/286 ›` e tela cheia; zoom via botões menores em segunda linha.

## Testes

Vitest:
- `spreadLayout`: capa isolada, spreads pares/ímpares, último spread com total par e ímpar, troca de modo preservando página, prefetch nos limites.
- `useBookNavigation`: limites, direção da virada, fila durante animação.
- `bitmapCache`: eviction LRU e `close()`.
- `errors.ts`: mapeamento de cada exceção.
- `readingState`: leitura/escrita e debounce.

Playwright (manual via MCP, roteiro em `docs/validation.md`): abrir app, upload por botão e por drag, viradas nos dois sentidos, teclado completo, salto de página, zoom, fullscreen, voltar e continuar, três viewports (1440×900, 1024×768, 390×844), PDFs de 3, 50 e 800 páginas gerados com `pdf-lib` em script `scripts/make-fixtures.mjs`, console sem erros.

## Critérios de aceitação

Os 24 itens da seção 29 do briefing, verificados item a item ao final.
