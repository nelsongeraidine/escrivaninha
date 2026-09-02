# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Data de Atualização: 02-09-2026_Versão 0.10

## Visão geral

Escrivaninha é um leitor de PDF que apresenta o documento como um livro físico (spread, virada de página animada, navegação por mouse/teclado/touch). Processamento 100% no navegador; o arquivo nunca sai do dispositivo. UI em português brasileiro.

## Arquitetura em uma página

Stack: Vite 8 + React 19 + TypeScript strict, `pdfjs-dist` 6 (worker via `?url`, sem CDN), CSS puro com custom properties, fontes self-hosted (`@fontsource`). Sem lib de UI, sem Tailwind.

`App` é uma máquina de estados: `library → loading → reading`, com `error → library`. Voltar à biblioteca mantém o documento em memória.

- `src/app/`: App e máquina de estados.
- `src/library/`: tela inicial, dropzone, card "Continuar lendo".
- `src/reader/`: ReaderView, Book/Sheet/Page, controles, loading e erro. `Sheet.tsx` roda a virada em CSS 3D: `@keyframes` em `src/styles/book.css`, com `animationend` e fallback de 900 ms.
- `src/pdf/`: carga do documento, fila de render (concorrência 2, cancelável), cache LRU de `ImageBitmap` (24 entradas / ~100 MB), prefetch ±4 páginas.
- `src/book/`: `spreadLayout.ts` (funções puras página↔sheet↔spread: spread 0 = capa sozinha; spread k = (2k, 2k+1); sheet k = frente 2k+1 / verso 2k+2), `useBookNavigation.ts` (estado do flip e fila de viradas), `zoomLevels.ts`.
- `src/persistence/`: IndexedDB (`escrivaninha/books`, Blob até 150 MB) e localStorage (página, zoom).
- `src/shared/`: fullscreen, teclado, swipe, media query, mapeamento de erros.

Spec completo: `docs/superpowers/specs/2026-09-02-escrivaninha-design.md`.

## Escopo do projeto

Requisitos, prioridades, decisões e critérios de aceitação estão em @PRD.md. O PRD é a fonte de verdade de escopo; o spec detalha o "como".

## Regras de comportamento

1. Antes de qualquer mudança não-trivial (mais de um arquivo ou alteração de comportamento existente), propor um plano e aguardar aprovação antes de executar.
2. Nunca adicionar bibliotecas externas, CDNs ou pacotes sem consultar o usuário antes.
3. Comentários em português. Comentários explicam o "porquê" do código, não o "o quê".
4. Antes de criar arquivo fora da estrutura definida no spec (`src/app`, `library`, `reader`, `pdf`, `book`, `persistence`, `shared`, `styles`), justificar por que ele precisa existir.
5. Se uma feature pedida conflitar com o PRD.md, avisar antes de implementar.
6. Toda atualização no projeto deve ser documentada com data e versão, neste arquivo e no PRD.md, no formato `Data de Atualização: DD-MM-YYYY_Versão X.XX`. Manter o histórico de versões do PRD.md atualizado.

## Convenções de código

- Componentes React em PascalCase (`ReaderControls.tsx`); hooks em camelCase com prefixo `use` (`useBookNavigation.ts`); módulos puros em camelCase (`spreadLayout.ts`).
- Um componente/hook por arquivo; nenhum arquivo concentra a aplicação.
- Páginas do PDF são 1-based; índices de spread e sheet são 0-based. Nunca misturar sem conversão explícita em `spreadLayout.ts`.
- Textos de UI e mensagens de erro em pt-BR, amigáveis; detalhe técnico vai para `console.error`.
- Tokens de cor e tipografia só em `src/styles/tokens.css`; componentes usam `var(--...)`.
- Testes Vitest ao lado do módulo (`spreadLayout.test.ts`) para lógica pura; validação de UX no navegador com Playwright seguindo `docs/validation.md`.
- Sem travessão em textos; sem `any`; sem `eslint-disable` sem comentário justificando.

## Como rodar

```bash
npm install
npm run dev          # servidor Vite em http://localhost:5173
npm run build        # build de produção em dist/
npm run preview      # serve o build
npm test             # Vitest (todos)
npx vitest run src/book/spreadLayout.test.ts   # um arquivo
npm run lint         # oxlint + tsc -b --noEmit
node scripts/make-fixtures.mjs   # gera PDFs de teste (3, 50, 800 páginas) em fixtures/
```

Usuário final: duplo clique em `Abrir Escrivaninha.bat`.

Pasta está sob sync do OneDrive: evitar builds concorrentes e, se houver lentidão, pausar o sync.
