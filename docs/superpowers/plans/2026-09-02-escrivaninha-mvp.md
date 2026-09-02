# Escrivaninha MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leitor de PDF local que apresenta o documento como um livro físico, com virada de página animada, navegação por mouse/teclado/touch, zoom, tela cheia e retomada da leitura.

**Architecture:** SPA Vite + React 19 com máquina de estados `library → loading → reading` (`error → library`). O módulo `pdf/` renderiza páginas sob demanda em `ImageBitmap` com fila cancelável e cache LRU; `book/` mapeia páginas em spreads/sheets com funções puras e anima a virada com CSS 3D; `persistence/` guarda o Blob no IndexedDB e o estado de leitura no localStorage.

**Tech Stack:** Vite 8, React 19, TypeScript strict, pdfjs-dist 6, CSS puro com custom properties, @fontsource (Cormorant Garamond + Inter), Vitest + jsdom + Testing Library, fake-indexeddb (teste), Playwright MCP para validação manual.

**Spec:** `docs/superpowers/specs/2026-09-02-escrivaninha-design.md`

## Global Constraints

- Nenhum pacote além dos listados na Task 1 sem consultar o usuário (regra 2 do CLAUDE.md).
- Comentários em português explicando o porquê; sem `any`; sem `eslint-disable` sem justificativa.
- Textos de UI em pt-BR; mensagens de erro amigáveis, detalhe técnico só em `console.error`.
- Páginas do PDF são 1-based; índices de spread/sheet são 0-based; conversão só em `src/book/spreadLayout.ts`.
- Cores e fontes só via tokens em `src/styles/tokens.css`.
- Sem travessão (—) em textos e comentários.
- Sem CDN: worker do pdf.js importado com `?url`; fontes self-hosted.
- Cache de bitmaps: 24 entradas ou ~100 MB; prefetch raio 4 páginas; concorrência de render 2.
- Persistência do Blob só até 150 MB; leitura recusada acima de 500 MB.
- Zoom em níveis 50, 75, 100, 125, 150, 175, 200.
- Animação: 650 ms, `cubic-bezier(0.4, 0, 0.2, 1)`; `prefers-reduced-motion` troca com fade de 150 ms.
- Modo spread quando `min-width: 900px` e proporção ≥ 1.2; senão single.
- Cada task termina com commit; ao final, atualizar versão e data em `CLAUDE.md` e `PRD.md` (regra 6).

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/main.tsx` | Bootstrap React, importa fontes e CSS globais |
| `src/app/App.tsx` | Compõe views conforme o estado |
| `src/app/appState.ts` | Reducer da máquina de estados e tipo `OpenBook` |
| `src/app/useOpenBook.ts` | Orquestra validação → carga → persistência e despacha ações |
| `src/library/LibraryView.tsx` | Tela inicial (título, dropzone, card continuar, rodapé) |
| `src/library/PdfDropzone.tsx` | Input de arquivo + drag & drop com estados visuais |
| `src/library/ContinueReadingCard.tsx` | Card "Continuar lendo" |
| `src/reader/ReaderView.tsx` | Layout do leitor, prefetch, integra controles e interações |
| `src/reader/Book.tsx` | Mede área, calcula tamanho de página, renderiza base + sheet em animação |
| `src/reader/Sheet.tsx` | Folha com frente/verso e camadas de sombra |
| `src/reader/Page.tsx` | Canvas que desenha um `ImageBitmap` |
| `src/reader/ReaderControls.tsx` | Barra inferior com auto-ocultar |
| `src/reader/PageIndicator.tsx` | `Página N / T` clicável com input de salto |
| `src/reader/ZoomControls.tsx` | `− 100% +` |
| `src/reader/FullscreenButton.tsx` | Botão tela cheia |
| `src/reader/LoadingState.tsx` | "Preparando seu livro..." |
| `src/reader/ErrorState.tsx` | Mensagem de erro + voltar |
| `src/pdf/pdfDocument.ts` | `loadDocument`, `destroyDocument`, `readPageSize` |
| `src/pdf/pageRenderer.ts` | Fila de render com prioridade e cancelamento |
| `src/pdf/bitmapCache.ts` | LRU de `ImageBitmap` |
| `src/pdf/usePageBitmap.ts` | Hook: bitmap de uma página numa escala |
| `src/book/spreadLayout.ts` | Funções puras página↔spread↔sheet |
| `src/book/useBookNavigation.ts` | Estado de spread atual + flip em andamento + fila |
| `src/book/zoomLevels.ts` | Níveis de zoom e passos |
| `src/persistence/bookStore.ts` | IndexedDB do livro atual |
| `src/persistence/readingState.ts` | localStorage de página/zoom |
| `src/shared/errors.ts` | `AppError` e mapeamento de exceções para mensagens |
| `src/shared/validatePdfFile.ts` | Extensão/MIME/assinatura/tamanho |
| `src/shared/useFullscreen.ts` | Fullscreen API |
| `src/shared/useKeyboardNav.ts` | Atalhos de teclado |
| `src/shared/useSwipe.ts` | Gesto horizontal |
| `src/shared/useMediaQuery.ts` | Hook de media query |
| `src/shared/useAutoHide.ts` | Visibilidade por inatividade |
| `src/styles/tokens.css` | Tokens |
| `src/styles/base.css` | Reset, tipografia base, foco |
| `src/styles/wood.css` | Fundo de madeira em CSS |
| `src/styles/book.css` | Livro, sheet, sombras, keyframes de virada |
| `src/styles/reader.css` | Layout do leitor e controles |
| `src/styles/library.css` | Layout da biblioteca e dropzone |
| `scripts/make-fixtures.mjs` | Gera PDFs de 3, 50 e 800 páginas sem dependências |
| `docs/validation.md` | Roteiro de validação no navegador |

---

### Task 1: Scaffold do projeto, tokens e tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `src/test/setup.ts`, `.gitignore`

**Interfaces:**
- Produces: scripts `dev`, `build`, `preview`, `test`, `lint`; alias de fontes `--font-serif`, `--font-ui`; tokens de cor.

- [ ] **Step 1: Scaffold com Vite (template react-ts)**

```bash
cd "c:/Users/ngera/OneDrive/Documentos/ClaudeCode/A Escrivaninha - PDF"
npm create vite@latest . -- --template react-ts
```
Se o CLI perguntar sobre pasta não vazia, escolher "Ignore files and continue". Remover `src/App.css`, `src/App.tsx`, `src/index.css`, `src/assets/`, `public/vite.svg` (serão recriados).

- [ ] **Step 2: Instalar dependências aprovadas**

```bash
npm install pdfjs-dist@6 @fontsource/cormorant-garamond @fontsource/inter
npm install -D vitest jsdom @testing-library/react @testing-library/dom fake-indexeddb
```

- [ ] **Step 3: Scripts e config de teste**

Em `package.json`, garantir:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint . && tsc -b --noEmit"
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: false,
  },
});
```

`src/test/setup.ts`:
```ts
// Ambiente de teste: IndexedDB falso para os módulos de persistência.
import 'fake-indexeddb/auto';
```

- [ ] **Step 4: Tokens e base**

`src/styles/tokens.css`:
```css
:root {
  --wood-900: #1a110b;
  --wood-800: #2a1a10;
  --wood-700: #3d2617;
  --wood-600: #5a3a24;
  --gold-500: #c9a45c;
  --gold-300: #e2c98a;
  --cream-100: #f4ecd8;
  --cream-200: #e9dfc6;
  --bordeaux-600: #6e1f23;
  --ink-900: #1c1410;

  --font-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-ui: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --ease-page: cubic-bezier(0.4, 0, 0.2, 1);
  --flip-duration: 650ms;
  --controls-fade: 220ms;

  --shadow-book: 0 30px 60px rgba(0, 0, 0, 0.55), 0 8px 18px rgba(0, 0, 0, 0.35);
}
```

`src/styles/base.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body {
  background: var(--wood-900);
  color: var(--cream-100);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}
/* Foco visível dourado: única indicação de foco em toda a UI. */
:focus-visible {
  outline: 2px solid var(--gold-500);
  outline-offset: 3px;
  border-radius: 4px;
}
.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`index.html`: `<html lang="pt-BR">`, `<title>Escrivaninha</title>`, meta viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `<meta name="theme-color" content="#1a110b">`.

`src/app/App.tsx` provisório:
```tsx
export function App() {
  return <h1>Escrivaninha</h1>;
}
```

- [ ] **Step 5: Verificar build e lint**

Run: `npm run build && npm run lint`
Expected: build ok em `dist/`, lint sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS, tokens e tooling de teste"
```

---

### Task 2: spreadLayout (funções puras)

**Files:**
- Create: `src/book/spreadLayout.ts`, `src/book/spreadLayout.test.ts`

**Interfaces:**
- Produces:
```ts
export type ViewMode = 'spread' | 'single';
export type Spread =
  | { kind: 'spread'; left?: number; right?: number }
  | { kind: 'single'; page: number };
export function clampPage(page: number, total: number): number;
export function spreadCount(total: number, mode: ViewMode): number;
export function spreadForPage(page: number, mode: ViewMode, total: number): number;
export function pagesInSpread(index: number, mode: ViewMode, total: number): Spread;
export function firstPageOfSpread(index: number, mode: ViewMode, total: number): number;
export function pagesToPrefetch(index: number, mode: ViewMode, total: number, radius: number): number[];
/** Sheet que se move ao ir de `from` para `to` (spreads adjacentes) e suas faces. */
export function sheetForTransition(from: number, to: number, mode: ViewMode, total: number): { front?: number; back?: number; direction: 'forward' | 'backward' };
```

- [ ] **Step 1: Escrever os testes**

`src/book/spreadLayout.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  clampPage, spreadCount, spreadForPage, pagesInSpread,
  firstPageOfSpread, pagesToPrefetch, sheetForTransition,
} from './spreadLayout';

describe('modo spread', () => {
  it('capa fica sozinha à direita no spread 0', () => {
    expect(pagesInSpread(0, 'spread', 10)).toEqual({ kind: 'spread', right: 1 });
  });
  it('spread k mostra (2k, 2k+1)', () => {
    expect(pagesInSpread(1, 'spread', 10)).toEqual({ kind: 'spread', left: 2, right: 3 });
    expect(pagesInSpread(4, 'spread', 10)).toEqual({ kind: 'spread', left: 8, right: 9 });
  });
  it('último spread com total par tem só a esquerda', () => {
    expect(pagesInSpread(5, 'spread', 10)).toEqual({ kind: 'spread', left: 10 });
    expect(spreadCount(10, 'spread')).toBe(6);
  });
  it('último spread com total ímpar é completo', () => {
    expect(pagesInSpread(5, 'spread', 11)).toEqual({ kind: 'spread', left: 10, right: 11 });
    expect(spreadCount(11, 'spread')).toBe(6);
  });
  it('spreadForPage', () => {
    expect(spreadForPage(1, 'spread', 10)).toBe(0);
    expect(spreadForPage(2, 'spread', 10)).toBe(1);
    expect(spreadForPage(3, 'spread', 10)).toBe(1);
    expect(spreadForPage(10, 'spread', 10)).toBe(5);
  });
  it('firstPageOfSpread', () => {
    expect(firstPageOfSpread(0, 'spread', 10)).toBe(1);
    expect(firstPageOfSpread(3, 'spread', 10)).toBe(6);
  });
  it('sheetForTransition avançando de k para k+1 usa frente 2k+1 e verso 2k+2', () => {
    expect(sheetForTransition(1, 2, 'spread', 10)).toEqual({ front: 3, back: 4, direction: 'forward' });
    expect(sheetForTransition(2, 1, 'spread', 10)).toEqual({ front: 3, back: 4, direction: 'backward' });
    expect(sheetForTransition(0, 1, 'spread', 10)).toEqual({ front: 1, back: 2, direction: 'forward' });
  });
  it('sheet no fim com total ímpar não tem verso', () => {
    expect(sheetForTransition(4, 5, 'spread', 9)).toEqual({ front: 9, back: undefined, direction: 'forward' });
  });
});

describe('modo single', () => {
  it('cada spread é uma página', () => {
    expect(spreadCount(7, 'single')).toBe(7);
    expect(pagesInSpread(0, 'single', 7)).toEqual({ kind: 'single', page: 1 });
    expect(spreadForPage(5, 'single', 7)).toBe(4);
    expect(firstPageOfSpread(4, 'single', 7)).toBe(5);
  });
  it('sheet é a página que sai; verso vazio', () => {
    expect(sheetForTransition(2, 3, 'single', 7)).toEqual({ front: 3, back: undefined, direction: 'forward' });
    expect(sheetForTransition(3, 2, 'single', 7)).toEqual({ front: 3, back: undefined, direction: 'backward' });
  });
});

describe('utilitários', () => {
  it('clampPage', () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
  });
  it('pagesToPrefetch respeita limites e inclui visíveis primeiro', () => {
    expect(pagesToPrefetch(0, 'spread', 10, 4)).toEqual([1, 2, 3, 4, 5]);
    expect(pagesToPrefetch(5, 'spread', 10, 4)).toEqual([10, 9, 8, 7, 6]);
    expect(pagesToPrefetch(2, 'single', 3, 4)).toEqual([3, 2, 1]);
  });
  it('troca de modo preserva a página', () => {
    const page = 7;
    const s = spreadForPage(page, 'spread', 20);
    const first = firstPageOfSpread(s, 'spread', 20);
    expect(spreadForPage(first, 'single', 20)).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/book/spreadLayout.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

`src/book/spreadLayout.ts`:
```ts
export type ViewMode = 'spread' | 'single';

export type Spread =
  | { kind: 'spread'; left?: number; right?: number }
  | { kind: 'single'; page: number };

export type FlipDirection = 'forward' | 'backward';

export function clampPage(page: number, total: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), Math.max(total, 1));
}

export function spreadCount(total: number, mode: ViewMode): number {
  if (mode === 'single') return total;
  // Spread 0 é a capa sozinha; depois pares (2k, 2k+1).
  return Math.floor(total / 2) + 1;
}

export function spreadForPage(page: number, mode: ViewMode, total: number): number {
  const p = clampPage(page, total);
  return mode === 'single' ? p - 1 : Math.floor(p / 2);
}

export function pagesInSpread(index: number, mode: ViewMode, total: number): Spread {
  if (mode === 'single') return { kind: 'single', page: clampPage(index + 1, total) };
  if (index <= 0) return { kind: 'spread', right: 1 };
  const left = 2 * index;
  const right = 2 * index + 1;
  const spread: Spread = { kind: 'spread' };
  if (left <= total) spread.left = left;
  if (right <= total) spread.right = right;
  return spread;
}

export function firstPageOfSpread(index: number, mode: ViewMode, total: number): number {
  const s = pagesInSpread(index, mode, total);
  if (s.kind === 'single') return s.page;
  return clampPage(s.left ?? s.right ?? 1, total);
}

export function pagesToPrefetch(index: number, mode: ViewMode, total: number, radius: number): number[] {
  const visible: number[] = [];
  const s = pagesInSpread(index, mode, total);
  if (s.kind === 'single') visible.push(s.page);
  else {
    if (s.left) visible.push(s.left);
    if (s.right) visible.push(s.right);
  }
  // Prioridade: visíveis, depois as seguintes (leitura avança), depois as anteriores.
  const last = visible[visible.length - 1];
  const first = visible[0];
  const after: number[] = [];
  const before: number[] = [];
  for (let i = 1; i <= radius; i++) {
    if (last + i <= total) after.push(last + i);
    if (first - i >= 1) before.push(first - i);
  }
  return [...visible, ...after, ...before];
}

export function sheetForTransition(
  from: number, to: number, mode: ViewMode, total: number,
): { front?: number; back?: number; direction: FlipDirection } {
  const direction: FlipDirection = to > from ? 'forward' : 'backward';
  const k = Math.min(from, to);
  if (mode === 'single') {
    // A folha que vira é a página do spread menor; o verso é papel em branco.
    return { front: clampPage(k + 1, total), back: undefined, direction };
  }
  // Sheet k: frente = direita do spread k, verso = esquerda do spread k+1.
  const front = 2 * k + 1;
  const back = 2 * k + 2;
  return {
    front: front <= total ? front : undefined,
    back: back <= total ? back : undefined,
    direction,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/book/spreadLayout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/book/spreadLayout.ts src/book/spreadLayout.test.ts
git commit -m "feat(book): mapeamento página/spread/sheet com testes"
```

---

### Task 3: Erros amigáveis e validação do arquivo

**Files:**
- Create: `src/shared/errors.ts`, `src/shared/errors.test.ts`, `src/shared/validatePdfFile.ts`, `src/shared/validatePdfFile.test.ts`

**Interfaces:**
- Produces:
```ts
export type AppErrorCode = 'not-pdf' | 'invalid-pdf' | 'password' | 'too-large' | 'render' | 'unknown';
export class AppError extends Error { readonly code: AppErrorCode; constructor(code: AppErrorCode, cause?: unknown) }
export function messageFor(code: AppErrorCode): string;
export function toAppError(error: unknown): AppError;
export const MAX_READ_BYTES = 500 * 1024 * 1024;
export async function validatePdfFile(file: File): Promise<void>; // lança AppError
```

- [ ] **Step 1: Testes**

`src/shared/errors.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { AppError, toAppError, messageFor } from './errors';

describe('toAppError', () => {
  it('preserva AppError', () => {
    const e = new AppError('too-large');
    expect(toAppError(e)).toBe(e);
  });
  it('mapeia exceções do pdf.js pelo nome', () => {
    expect(toAppError({ name: 'InvalidPDFException', message: 'x' }).code).toBe('invalid-pdf');
    expect(toAppError({ name: 'PasswordException', message: 'x' }).code).toBe('password');
    expect(toAppError({ name: 'RenderingCancelledException', message: 'x' }).code).toBe('render');
  });
  it('erros desconhecidos viram unknown', () => {
    expect(toAppError(new Error('boom')).code).toBe('unknown');
    expect(toAppError(undefined).code).toBe('unknown');
  });
});

describe('messageFor', () => {
  it('nunca vaza texto técnico', () => {
    const codes = ['not-pdf', 'invalid-pdf', 'password', 'too-large', 'render', 'unknown'] as const;
    for (const c of codes) {
      const m = messageFor(c);
      expect(m.length).toBeGreaterThan(10);
      expect(m).not.toMatch(/exception|error:/i);
    }
  });
});
```

`src/shared/validatePdfFile.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validatePdfFile } from './validatePdfFile';
import { AppError } from './errors';

function makeFile(bytes: string, name: string, type = 'application/pdf'): File {
  return new File([new TextEncoder().encode(bytes)], name, { type });
}

describe('validatePdfFile', () => {
  it('aceita assinatura %PDF-', async () => {
    await expect(validatePdfFile(makeFile('%PDF-1.7 ...', 'a.pdf'))).resolves.toBeUndefined();
  });
  it('aceita .pdf mesmo sem MIME', async () => {
    await expect(validatePdfFile(makeFile('%PDF-1.4', 'a.pdf', ''))).resolves.toBeUndefined();
  });
  it('rejeita extensão e MIME errados', async () => {
    await expect(validatePdfFile(makeFile('%PDF-1.4', 'a.txt', 'text/plain'))).rejects.toMatchObject({ code: 'not-pdf' });
  });
  it('rejeita assinatura inválida', async () => {
    const err = await validatePdfFile(makeFile('hello', 'a.pdf')).catch((e: AppError) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('not-pdf');
  });
  it('rejeita acima de 500 MB', async () => {
    const big = { name: 'a.pdf', type: 'application/pdf', size: 501 * 1024 * 1024, slice: () => new Blob(['%PDF-']) } as unknown as File;
    await expect(validatePdfFile(big)).rejects.toMatchObject({ code: 'too-large' });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/shared`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/shared/errors.ts`:
```ts
export type AppErrorCode = 'not-pdf' | 'invalid-pdf' | 'password' | 'too-large' | 'render' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  constructor(code: AppErrorCode, cause?: unknown) {
    super(messageFor(code), { cause });
    this.name = 'AppError';
    this.code = code;
  }
}

const MESSAGES: Record<AppErrorCode, string> = {
  'not-pdf': 'Este arquivo não parece ser um PDF.',
  'invalid-pdf': 'Não foi possível abrir este PDF. O arquivo pode estar danificado.',
  password: 'Este PDF está protegido por senha. Ainda não é possível abri-lo aqui.',
  'too-large': 'Este arquivo é muito grande para ser lido aqui (limite de 500 MB).',
  render: 'Houve um problema ao exibir esta página.',
  unknown: 'Algo deu errado ao preparar seu livro. Tente novamente.',
};

export function messageFor(code: AppErrorCode): string {
  return MESSAGES[code];
}

// O pdf.js identifica exceções pelo `name`; o mapeamento por nome evita
// depender das classes internas, que mudam entre versões.
const PDFJS_BY_NAME: Record<string, AppErrorCode> = {
  InvalidPDFException: 'invalid-pdf',
  MissingPDFException: 'invalid-pdf',
  FormatError: 'invalid-pdf',
  PasswordException: 'password',
  RenderingCancelledException: 'render',
};

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const name = typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : '';
  const code = PDFJS_BY_NAME[name] ?? 'unknown';
  return new AppError(code, error);
}
```

`src/shared/validatePdfFile.ts`:
```ts
import { AppError } from './errors';

export const MAX_READ_BYTES = 500 * 1024 * 1024;

const SIGNATURE = '%PDF-';

export async function validatePdfFile(file: File): Promise<void> {
  const byExt = /\.pdf$/i.test(file.name);
  const byMime = file.type === 'application/pdf';
  if (!byExt && !byMime) throw new AppError('not-pdf');
  if (file.size > MAX_READ_BYTES) throw new AppError('too-large');

  // Extensão e MIME são só declarações; a assinatura no início do arquivo é a
  // única checagem barata que pega arquivos renomeados.
  const head = await file.slice(0, SIGNATURE.length).text();
  if (head !== SIGNATURE) throw new AppError('not-pdf');
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/shared`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/errors.ts src/shared/errors.test.ts src/shared/validatePdfFile.ts src/shared/validatePdfFile.test.ts
git commit -m "feat(shared): erros amigáveis e validação de PDF"
```

---

### Task 4: Cache LRU de bitmaps e fila de render

**Files:**
- Create: `src/pdf/bitmapCache.ts`, `src/pdf/bitmapCache.test.ts`, `src/pdf/pageRenderer.ts`, `src/pdf/pageRenderer.test.ts`, `src/pdf/pdfDocument.ts`

**Interfaces:**
- Produces:
```ts
// bitmapCache.ts
export interface BitmapLike { width: number; height: number; close(): void }
export class BitmapCache<T extends BitmapLike = ImageBitmap> {
  constructor(opts?: { maxEntries?: number; maxBytes?: number });
  key(page: number, scale: number): string;
  get(page: number, scale: number): T | undefined;
  set(page: number, scale: number, bitmap: T): void;
  clear(): void;
  readonly size: number;
}
// pdfDocument.ts
export interface LoadedDocument { doc: PDFDocumentProxy; pageCount: number; pageSize: { width: number; height: number } }
export async function loadDocument(source: Blob, onProgress?: (loaded: number, total: number) => void): Promise<LoadedDocument>;
export async function destroyDocument(loaded: LoadedDocument): Promise<void>;
// pageRenderer.ts
export type Priority = 'visible' | 'prefetch';
export interface RenderBackend { render(page: number, scale: number, signal: AbortSignal): Promise<ImageBitmap> }
export class PageRenderer {
  constructor(backend: RenderBackend, cache: BitmapCache, concurrency?: number);
  request(page: number, scale: number, priority: Priority): Promise<ImageBitmap>;
  /** Cancela pendentes cujo page não está em keep. */
  retainOnly(keep: ReadonlySet<number>): void;
  dispose(): void;
}
export function createPdfBackend(loaded: LoadedDocument): RenderBackend;
```

- [ ] **Step 1: Testes do cache**

`src/pdf/bitmapCache.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { BitmapCache } from './bitmapCache';

function fake(w: number, h: number) {
  return { width: w, height: h, close: vi.fn() };
}

describe('BitmapCache', () => {
  it('guarda e recupera por página e escala', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const b = fake(10, 10);
    c.set(1, 2, b);
    expect(c.get(1, 2)).toBe(b);
    expect(c.get(1, 3)).toBeUndefined();
  });
  it('evicta o menos usado e fecha o bitmap', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>({ maxEntries: 2 });
    const a = fake(1, 1), b = fake(1, 1), d = fake(1, 1);
    c.set(1, 1, a); c.set(2, 1, b);
    c.get(1, 1); // toca a; b vira o menos recente
    c.set(3, 1, d);
    expect(c.get(2, 1)).toBeUndefined();
    expect(b.close).toHaveBeenCalled();
    expect(c.get(1, 1)).toBe(a);
  });
  it('evicta por bytes (w*h*4)', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>({ maxBytes: 1000 });
    const a = fake(10, 10); // 400 B
    const b = fake(10, 10); // 400 B
    const d = fake(10, 10); // 400 B -> excede 1000
    c.set(1, 1, a); c.set(2, 1, b); c.set(3, 1, d);
    expect(c.size).toBe(2);
    expect(a.close).toHaveBeenCalled();
  });
  it('substituir a mesma chave fecha o antigo', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const a = fake(1, 1), b = fake(1, 1);
    c.set(1, 1, a); c.set(1, 1, b);
    expect(a.close).toHaveBeenCalled();
    expect(c.get(1, 1)).toBe(b);
  });
  it('clear fecha tudo', () => {
    const c = new BitmapCache<ReturnType<typeof fake>>();
    const a = fake(1, 1); c.set(1, 1, a); c.clear();
    expect(a.close).toHaveBeenCalled();
    expect(c.size).toBe(0);
  });
});
```

- [ ] **Step 2: Testes da fila**

`src/pdf/pageRenderer.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { PageRenderer, type RenderBackend } from './pageRenderer';
import { BitmapCache } from './bitmapCache';

function bitmap(): ImageBitmap {
  return { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
}

/** Backend controlável: resolve quando o teste mandar. */
function controllableBackend() {
  const pending = new Map<number, { resolve: (b: ImageBitmap) => void; reject: (e: unknown) => void; signal: AbortSignal }>();
  const backend: RenderBackend = {
    render: (page, _scale, signal) =>
      new Promise((resolve, reject) => {
        pending.set(page, { resolve, reject, signal });
        signal.addEventListener('abort', () => reject(Object.assign(new Error('cancel'), { name: 'AbortError' })));
      }),
  };
  return { backend, pending };
}

describe('PageRenderer', () => {
  it('devolve do cache sem chamar o backend', async () => {
    const cache = new BitmapCache();
    const b = bitmap(); cache.set(1, 1, b);
    const backend: RenderBackend = { render: vi.fn() };
    const r = new PageRenderer(backend, cache);
    await expect(r.request(1, 1, 'visible')).resolves.toBe(b);
    expect(backend.render).not.toHaveBeenCalled();
  });

  it('respeita concorrência 2 e prioriza visível', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 2);
    const p1 = r.request(1, 1, 'prefetch');
    const p2 = r.request(2, 1, 'prefetch');
    const p3 = r.request(3, 1, 'prefetch');
    const p4 = r.request(4, 1, 'visible');
    await Promise.resolve();
    expect([...pending.keys()]).toEqual([1, 2]);
    pending.get(1)!.resolve(bitmap());
    await p1;
    await Promise.resolve();
    // A visível (4) entra antes da 3, que foi pedida antes.
    expect([...pending.keys()]).toContain(4);
    expect(pending.has(3)).toBe(false);
    pending.get(2)!.resolve(bitmap()); await p2;
    pending.get(4)!.resolve(bitmap()); await p4;
    await Promise.resolve();
    pending.get(3)!.resolve(bitmap()); await p3;
  });

  it('deduplica pedidos iguais em voo', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 2);
    const a = r.request(5, 1, 'visible');
    const b = r.request(5, 1, 'visible');
    await Promise.resolve();
    expect(pending.size).toBe(1);
    pending.get(5)!.resolve(bitmap());
    expect(await a).toBe(await b);
  });

  it('retainOnly cancela pendentes fora da janela', async () => {
    const { backend, pending } = controllableBackend();
    const r = new PageRenderer(backend, new BitmapCache(), 1);
    const p1 = r.request(1, 1, 'prefetch');
    const p9 = r.request(9, 1, 'prefetch');
    await Promise.resolve();
    r.retainOnly(new Set([1]));
    await expect(p9).rejects.toMatchObject({ name: 'AbortError' });
    pending.get(1)!.resolve(bitmap());
    await expect(p1).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/pdf`
Expected: FAIL.

- [ ] **Step 4: Implementar o cache**

`src/pdf/bitmapCache.ts`:
```ts
export interface BitmapLike { width: number; height: number; close(): void }

const DEFAULT_MAX_ENTRIES = 24;
const DEFAULT_MAX_BYTES = 100 * 1024 * 1024;

/**
 * LRU de bitmaps já renderizados. Um Map preserva ordem de inserção, então
 * re-inserir uma chave ao ler a move para o fim (mais recente).
 */
export class BitmapCache<T extends BitmapLike = ImageBitmap> {
  private readonly map = new Map<string, T>();
  private bytes = 0;
  private readonly maxEntries: number;
  private readonly maxBytes: number;

  constructor(opts: { maxEntries?: number; maxBytes?: number } = {}) {
    this.maxEntries = opts.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  }

  key(page: number, scale: number): string {
    return `${page}@${scale.toFixed(3)}`;
  }

  get size(): number { return this.map.size; }

  get(page: number, scale: number): T | undefined {
    const k = this.key(page, scale);
    const v = this.map.get(k);
    if (v === undefined) return undefined;
    this.map.delete(k);
    this.map.set(k, v);
    return v;
  }

  set(page: number, scale: number, bitmap: T): void {
    const k = this.key(page, scale);
    const old = this.map.get(k);
    if (old) { this.map.delete(k); this.bytes -= sizeOf(old); old.close(); }
    this.map.set(k, bitmap);
    this.bytes += sizeOf(bitmap);
    this.evict();
  }

  clear(): void {
    for (const v of this.map.values()) v.close();
    this.map.clear();
    this.bytes = 0;
  }

  private evict(): void {
    while (this.map.size > this.maxEntries || this.bytes > this.maxBytes) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      const v = this.map.get(oldest.value)!;
      this.map.delete(oldest.value);
      this.bytes -= sizeOf(v);
      v.close();
    }
  }
}

function sizeOf(b: BitmapLike): number {
  return b.width * b.height * 4;
}
```

- [ ] **Step 5: Implementar documento e fila**

`src/pdf/pdfDocument.ts`:
```ts
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
  await loaded.doc.destroy();
}
```

`src/pdf/pageRenderer.ts`:
```ts
import type { LoadedDocument } from './pdfDocument';
import { BitmapCache } from './bitmapCache';

export type Priority = 'visible' | 'prefetch';

export interface RenderBackend {
  render(page: number, scale: number, signal: AbortSignal): Promise<ImageBitmap>;
}

interface Job {
  page: number;
  scale: number;
  priority: Priority;
  controller: AbortController;
  promise: Promise<ImageBitmap>;
  resolve: (b: ImageBitmap) => void;
  reject: (e: unknown) => void;
  started: boolean;
}

/**
 * Fila com concorrência limitada. Renderizar é caro e o usuário pula páginas:
 * a fila garante que o que está na tela ganha do prefetch e que o que saiu da
 * janela é cancelado em vez de ocupar o worker.
 */
export class PageRenderer {
  private readonly jobs = new Map<string, Job>();
  private running = 0;

  constructor(
    private readonly backend: RenderBackend,
    private readonly cache: BitmapCache,
    private readonly concurrency = 2,
  ) {}

  request(page: number, scale: number, priority: Priority): Promise<ImageBitmap> {
    const cached = this.cache.get(page, scale);
    if (cached) return Promise.resolve(cached);

    const key = this.cache.key(page, scale);
    const existing = this.jobs.get(key);
    if (existing) {
      if (priority === 'visible') existing.priority = 'visible';
      return existing.promise;
    }

    let resolve!: (b: ImageBitmap) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<ImageBitmap>((res, rej) => { resolve = res; reject = rej; });
    // Evita "unhandled rejection" quando ninguém mais espera um job cancelado.
    promise.catch(() => undefined);
    const job: Job = { page, scale, priority, controller: new AbortController(), promise, resolve, reject, started: false };
    this.jobs.set(key, job);
    this.pump();
    return promise;
  }

  retainOnly(keep: ReadonlySet<number>): void {
    for (const [key, job] of this.jobs) {
      if (!keep.has(job.page)) {
        job.controller.abort();
        job.reject(Object.assign(new Error('render cancelado'), { name: 'AbortError' }));
        this.jobs.delete(key);
        if (job.started) this.running--;
      }
    }
    this.pump();
  }

  dispose(): void {
    this.retainOnly(new Set());
  }

  private pump(): void {
    while (this.running < this.concurrency) {
      const next = this.pickNext();
      if (!next) return;
      next.started = true;
      this.running++;
      this.backend.render(next.page, next.scale, next.controller.signal)
        .then((bitmap) => {
          if (next.controller.signal.aborted) { bitmap.close(); return; }
          this.cache.set(next.page, next.scale, bitmap);
          next.resolve(bitmap);
        })
        .catch((e) => { if (!next.controller.signal.aborted) next.reject(e); })
        .finally(() => {
          if (this.jobs.get(this.cache.key(next.page, next.scale)) === next) {
            this.jobs.delete(this.cache.key(next.page, next.scale));
            this.running--;
          }
          this.pump();
        });
    }
  }

  private pickNext(): Job | undefined {
    let best: Job | undefined;
    for (const job of this.jobs.values()) {
      if (job.started) continue;
      if (!best || (job.priority === 'visible' && best.priority !== 'visible')) best = job;
    }
    return best;
  }
}

export function createPdfBackend(loaded: LoadedDocument): RenderBackend {
  return {
    async render(pageNumber, scale, signal) {
      const page = await loaded.doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const task = page.render({ canvas, viewport });
      const onAbort = () => task.cancel();
      signal.addEventListener('abort', onAbort, { once: true });
      try {
        await task.promise;
        // ImageBitmap é desenhado sem custo de layout e libera o canvas temporário.
        return await createImageBitmap(canvas);
      } finally {
        signal.removeEventListener('abort', onAbort);
        canvas.width = 0; canvas.height = 0;
      }
    },
  };
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/pdf`
Expected: PASS. Também `npm run lint` sem erros (o import `?url` exige `/// <reference types="vite/client" />` em `src/vite-env.d.ts`, já criado pelo template).

- [ ] **Step 7: Commit**

```bash
git add src/pdf
git commit -m "feat(pdf): carga do documento, fila de render cancelável e cache LRU"
```

---

### Task 5: Persistência (localStorage + IndexedDB)

**Files:**
- Create: `src/persistence/readingState.ts`, `src/persistence/readingState.test.ts`, `src/persistence/bookStore.ts`, `src/persistence/bookStore.test.ts`

**Interfaces:**
- Produces:
```ts
// readingState.ts
export interface ReadingState { name: string; size: number; page: number; zoom: number; updatedAt: number }
export function loadReadingState(): ReadingState | null;
export function saveReadingState(state: Omit<ReadingState, 'updatedAt'>): void;
export function clearReadingState(): void;
export function matchesFile(state: ReadingState | null, file: { name: string; size: number }): boolean;
// bookStore.ts
export const MAX_PERSIST_BYTES = 150 * 1024 * 1024;
export interface StoredBook { name: string; size: number; pageCount: number; blob?: Blob; savedAt: number }
export async function saveCurrentBook(book: Omit<StoredBook, 'savedAt'>): Promise<void>;
export async function loadCurrentBook(): Promise<StoredBook | null>;
export async function clearCurrentBook(): Promise<void>;
```

- [ ] **Step 1: Testes**

`src/persistence/readingState.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadReadingState, saveReadingState, clearReadingState, matchesFile } from './readingState';

beforeEach(() => localStorage.clear());

describe('readingState', () => {
  it('salva e lê', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 4, zoom: 125 });
    const s = loadReadingState();
    expect(s).toMatchObject({ name: 'a.pdf', size: 10, page: 4, zoom: 125 });
    expect(typeof s!.updatedAt).toBe('number');
  });
  it('retorna null se vazio ou corrompido', () => {
    expect(loadReadingState()).toBeNull();
    localStorage.setItem('escrivaninha.reading', '{nope');
    expect(loadReadingState()).toBeNull();
  });
  it('matchesFile compara nome e tamanho', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 1, zoom: 100 });
    const s = loadReadingState();
    expect(matchesFile(s, { name: 'a.pdf', size: 10 })).toBe(true);
    expect(matchesFile(s, { name: 'a.pdf', size: 11 })).toBe(false);
    expect(matchesFile(null, { name: 'a.pdf', size: 10 })).toBe(false);
  });
  it('clear remove', () => {
    saveReadingState({ name: 'a.pdf', size: 10, page: 1, zoom: 100 });
    clearReadingState();
    expect(loadReadingState()).toBeNull();
  });
});
```

`src/persistence/bookStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveCurrentBook, loadCurrentBook, clearCurrentBook, MAX_PERSIST_BYTES } from './bookStore';

beforeEach(async () => { await clearCurrentBook(); });

describe('bookStore', () => {
  it('salva blob pequeno e recupera', async () => {
    const blob = new Blob(['%PDF-1.4']);
    await saveCurrentBook({ name: 'a.pdf', size: blob.size, pageCount: 3, blob });
    const b = await loadCurrentBook();
    expect(b?.name).toBe('a.pdf');
    expect(b?.pageCount).toBe(3);
    expect(b?.blob).toBeInstanceOf(Blob);
  });
  it('acima do teto guarda só metadados', async () => {
    const blob = new Blob(['x']);
    await saveCurrentBook({ name: 'big.pdf', size: MAX_PERSIST_BYTES + 1, pageCount: 900, blob });
    const b = await loadCurrentBook();
    expect(b?.blob).toBeUndefined();
    expect(b?.pageCount).toBe(900);
  });
  it('retorna null quando vazio', async () => {
    expect(await loadCurrentBook()).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/persistence`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/persistence/readingState.ts`:
```ts
const KEY = 'escrivaninha.reading';

export interface ReadingState {
  name: string;
  size: number;
  page: number;
  zoom: number;
  updatedAt: number;
}

export function loadReadingState(): ReadingState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isReadingState(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveReadingState(state: Omit<ReadingState, 'updatedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // Cota cheia ou modo privado: a leitura continua, só não persiste.
  }
}

export function clearReadingState(): void {
  try { localStorage.removeItem(KEY); } catch { /* idem */ }
}

export function matchesFile(state: ReadingState | null, file: { name: string; size: number }): boolean {
  return !!state && state.name === file.name && state.size === file.size;
}

function isReadingState(v: unknown): v is ReadingState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.size === 'number'
    && typeof o.page === 'number' && typeof o.zoom === 'number' && typeof o.updatedAt === 'number';
}
```

`src/persistence/bookStore.ts`:
```ts
export const MAX_PERSIST_BYTES = 150 * 1024 * 1024;

const DB_NAME = 'escrivaninha';
const STORE = 'books';
const CURRENT_KEY = 'current';

export interface StoredBook {
  name: string;
  size: number;
  pageCount: number;
  blob?: Blob;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  }));
}

export async function saveCurrentBook(book: Omit<StoredBook, 'savedAt'>): Promise<void> {
  // Acima do teto guardamos só metadados: o usuário reabre o arquivo e a
  // página salva no localStorage é reaproveitada.
  const record: StoredBook = {
    name: book.name,
    size: book.size,
    pageCount: book.pageCount,
    blob: book.size <= MAX_PERSIST_BYTES ? book.blob : undefined,
    savedAt: Date.now(),
  };
  try {
    await withStore('readwrite', (s) => s.put(record, CURRENT_KEY));
  } catch (e) {
    console.error('Não foi possível persistir o livro', e);
  }
}

export async function loadCurrentBook(): Promise<StoredBook | null> {
  try {
    const r = await withStore<StoredBook | undefined>('readonly', (s) => s.get(CURRENT_KEY));
    return r ?? null;
  } catch {
    return null;
  }
}

export async function clearCurrentBook(): Promise<void> {
  try { await withStore('readwrite', (s) => s.delete(CURRENT_KEY)); } catch { /* silencioso */ }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/persistence`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence
git commit -m "feat(persistence): estado de leitura em localStorage e livro atual em IndexedDB"
```

---

### Task 6: Máquina de estados e orquestração de abertura

**Files:**
- Create: `src/app/appState.ts`, `src/app/appState.test.ts`, `src/app/useOpenBook.ts`, `src/book/zoomLevels.ts`, `src/book/zoomLevels.test.ts`

**Interfaces:**
- Produces:
```ts
// zoomLevels.ts
export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const;
export function nextZoom(current: number): number;
export function prevZoom(current: number): number;
export function normalizeZoom(value: number): number;
// appState.ts
export interface OpenBook { loaded: LoadedDocument; name: string; size: number; blob: Blob; initialPage: number; initialZoom: number }
export type AppState =
  | { status: 'library'; book?: OpenBook }
  | { status: 'loading'; name: string; progress: number }
  | { status: 'reading'; book: OpenBook }
  | { status: 'error'; message: string; book?: OpenBook };
export type AppAction =
  | { type: 'open-start'; name: string }
  | { type: 'open-progress'; progress: number }
  | { type: 'open-success'; book: OpenBook }
  | { type: 'open-failure'; message: string }
  | { type: 'resume' }
  | { type: 'back-to-library' }
  | { type: 'dismiss-error' };
export const initialState: AppState;
export function appReducer(state: AppState, action: AppAction): AppState;
// useOpenBook.ts
export function useOpenBook(dispatch: Dispatch<AppAction>, current?: OpenBook): { openFile: (file: File) => Promise<void>; openStored: () => Promise<void> };
```

- [ ] **Step 1: Testes**

`src/book/zoomLevels.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { nextZoom, prevZoom, normalizeZoom, ZOOM_LEVELS } from './zoomLevels';

describe('zoomLevels', () => {
  it('avança e trava no máximo', () => {
    expect(nextZoom(100)).toBe(125);
    expect(nextZoom(200)).toBe(200);
  });
  it('recua e trava no mínimo', () => {
    expect(prevZoom(100)).toBe(75);
    expect(prevZoom(50)).toBe(50);
  });
  it('normaliza valores fora da lista para o mais próximo', () => {
    expect(normalizeZoom(110)).toBe(100);
    expect(normalizeZoom(999)).toBe(200);
    expect(normalizeZoom(NaN)).toBe(100);
    expect(ZOOM_LEVELS[0]).toBe(50);
  });
});
```

`src/app/appState.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { appReducer, initialState, type OpenBook } from './appState';

const book = { name: 'a.pdf' } as unknown as OpenBook;

describe('appReducer', () => {
  it('library -> loading -> reading', () => {
    let s = appReducer(initialState, { type: 'open-start', name: 'a.pdf' });
    expect(s).toEqual({ status: 'loading', name: 'a.pdf', progress: 0 });
    s = appReducer(s, { type: 'open-progress', progress: 0.5 });
    expect(s).toMatchObject({ status: 'loading', progress: 0.5 });
    s = appReducer(s, { type: 'open-success', book });
    expect(s).toEqual({ status: 'reading', book });
  });
  it('falha vai para error e dismiss volta para library', () => {
    let s = appReducer({ status: 'loading', name: 'a', progress: 0 }, { type: 'open-failure', message: 'msg' });
    expect(s).toMatchObject({ status: 'error', message: 'msg' });
    s = appReducer(s, { type: 'dismiss-error' });
    expect(s.status).toBe('library');
  });
  it('voltar para biblioteca mantém o livro e resume retoma', () => {
    let s = appReducer({ status: 'reading', book }, { type: 'back-to-library' });
    expect(s).toEqual({ status: 'library', book });
    s = appReducer(s, { type: 'resume' });
    expect(s).toEqual({ status: 'reading', book });
  });
  it('resume sem livro não muda nada', () => {
    expect(appReducer(initialState, { type: 'resume' })).toEqual(initialState);
  });
  it('progresso fora de loading é ignorado', () => {
    expect(appReducer(initialState, { type: 'open-progress', progress: 0.3 })).toEqual(initialState);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app src/book/zoomLevels.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/book/zoomLevels.ts`:
```ts
export const ZOOM_LEVELS = [50, 75, 100, 125, 150, 175, 200] as const;

export function normalizeZoom(value: number): number {
  if (!Number.isFinite(value)) return 100;
  let best: number = ZOOM_LEVELS[0];
  for (const z of ZOOM_LEVELS) if (Math.abs(z - value) < Math.abs(best - value)) best = z;
  return best;
}

export function nextZoom(current: number): number {
  const i = ZOOM_LEVELS.indexOf(normalizeZoom(current) as (typeof ZOOM_LEVELS)[number]);
  return ZOOM_LEVELS[Math.min(i + 1, ZOOM_LEVELS.length - 1)];
}

export function prevZoom(current: number): number {
  const i = ZOOM_LEVELS.indexOf(normalizeZoom(current) as (typeof ZOOM_LEVELS)[number]);
  return ZOOM_LEVELS[Math.max(i - 1, 0)];
}
```

`src/app/appState.ts`:
```ts
import type { LoadedDocument } from '../pdf/pdfDocument';

export interface OpenBook {
  loaded: LoadedDocument;
  name: string;
  size: number;
  blob: Blob;
  initialPage: number;
  initialZoom: number;
}

export type AppState =
  | { status: 'library'; book?: OpenBook }
  | { status: 'loading'; name: string; progress: number }
  | { status: 'reading'; book: OpenBook }
  | { status: 'error'; message: string; book?: OpenBook };

export type AppAction =
  | { type: 'open-start'; name: string }
  | { type: 'open-progress'; progress: number }
  | { type: 'open-success'; book: OpenBook }
  | { type: 'open-failure'; message: string }
  | { type: 'resume' }
  | { type: 'back-to-library' }
  | { type: 'dismiss-error' };

export const initialState: AppState = { status: 'library' };

// Máquina explícita: cada transição inválida devolve o estado atual, o que
// evita telas intermediárias inconsistentes quando eventos chegam atrasados.
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'open-start':
      return { status: 'loading', name: action.name, progress: 0 };
    case 'open-progress':
      return state.status === 'loading' ? { ...state, progress: action.progress } : state;
    case 'open-success':
      return { status: 'reading', book: action.book };
    case 'open-failure':
      return { status: 'error', message: action.message, book: bookOf(state) };
    case 'resume':
      return state.status === 'library' && state.book ? { status: 'reading', book: state.book } : state;
    case 'back-to-library':
      return state.status === 'reading' ? { status: 'library', book: state.book } : state;
    case 'dismiss-error':
      return state.status === 'error' ? { status: 'library', book: state.book } : state;
  }
}

function bookOf(state: AppState): OpenBook | undefined {
  return state.status === 'reading' || state.status === 'library' || state.status === 'error' ? state.book : undefined;
}
```

`src/app/useOpenBook.ts`:
```ts
import { useCallback, type Dispatch } from 'react';
import type { AppAction, OpenBook } from './appState';
import { loadDocument, destroyDocument } from '../pdf/pdfDocument';
import { validatePdfFile } from '../shared/validatePdfFile';
import { toAppError } from '../shared/errors';
import { loadReadingState, matchesFile, saveReadingState } from '../persistence/readingState';
import { saveCurrentBook, loadCurrentBook } from '../persistence/bookStore';
import { normalizeZoom } from '../book/zoomLevels';

/**
 * Fluxo completo de abertura: valida, carrega, decide a página inicial pelo
 * estado salvo e persiste. Fica fora do App para o componente só compor views.
 */
export function useOpenBook(dispatch: Dispatch<AppAction>, current?: OpenBook) {
  const open = useCallback(async (blob: Blob, name: string, size: number) => {
    dispatch({ type: 'open-start', name });
    try {
      if (current) await destroyDocument(current.loaded);
      const loaded = await loadDocument(blob, (l, t) => {
        if (t > 0) dispatch({ type: 'open-progress', progress: Math.min(l / t, 1) });
      });
      const saved = loadReadingState();
      const same = matchesFile(saved, { name, size });
      const book: OpenBook = {
        loaded, name, size, blob,
        initialPage: same ? Math.min(saved!.page, loaded.pageCount) : 1,
        initialZoom: same ? normalizeZoom(saved!.zoom) : 100,
      };
      if (!same) saveReadingState({ name, size, page: 1, zoom: 100 });
      dispatch({ type: 'open-success', book });
      void saveCurrentBook({ name, size, pageCount: loaded.pageCount, blob });
    } catch (e) {
      const err = toAppError(e);
      console.error(err.cause ?? err);
      dispatch({ type: 'open-failure', message: err.message });
    }
  }, [dispatch, current]);

  const openFile = useCallback(async (file: File) => {
    try {
      await validatePdfFile(file);
    } catch (e) {
      dispatch({ type: 'open-failure', message: toAppError(e).message });
      return;
    }
    await open(file, file.name, file.size);
  }, [open, dispatch]);

  const openStored = useCallback(async () => {
    const stored = await loadCurrentBook();
    if (!stored?.blob) return;
    await open(stored.blob, stored.name, stored.size);
  }, [open]);

  return { openFile, openStored };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/app src/book && npm run lint`
Expected: PASS, lint limpo.

- [ ] **Step 5: Commit**

```bash
git add src/app src/book/zoomLevels.ts src/book/zoomLevels.test.ts
git commit -m "feat(app): máquina de estados, níveis de zoom e fluxo de abertura"
```

---

### Task 7: Biblioteca (tela inicial) com dropzone

**Files:**
- Create: `src/library/LibraryView.tsx`, `src/library/PdfDropzone.tsx`, `src/library/PdfDropzone.test.tsx`, `src/library/ContinueReadingCard.tsx`, `src/styles/wood.css`, `src/styles/library.css`
- Modify: `src/app/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `useOpenBook`, `appReducer`, `loadCurrentBook`, `loadReadingState`.
- Produces:
```tsx
export function PdfDropzone(props: { onFile: (file: File) => void; disabled?: boolean }): JSX.Element;
export function ContinueReadingCard(props: { name: string; page: number; pageCount: number; onContinue: () => void }): JSX.Element;
export function LibraryView(props: { onFile: (file: File) => void; continueInfo?: { name: string; page: number; pageCount: number; onContinue: () => void } }): JSX.Element;
```

- [ ] **Step 1: Teste do dropzone**

`src/library/PdfDropzone.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { PdfDropzone } from './PdfDropzone';

function pdf(name = 'a.pdf') { return new File(['%PDF-'], name, { type: 'application/pdf' }); }

describe('PdfDropzone', () => {
  it('chama onFile ao escolher pelo input', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    const input = screen.getByLabelText('Abrir PDF', { selector: 'input' });
    fireEvent.change(input, { target: { files: [pdf()] } });
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.pdf' }));
  });
  it('destaca durante o arrasto e aceita o drop', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    const zone = screen.getByTestId('dropzone');
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'] } });
    expect(zone).toHaveAttribute('data-dragging', 'true');
    fireEvent.drop(zone, { dataTransfer: { files: [pdf('b.pdf')], types: ['Files'] } });
    expect(zone).toHaveAttribute('data-dragging', 'false');
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'b.pdf' }));
  });
  it('ignora drop sem arquivo', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    fireEvent.drop(screen.getByTestId('dropzone'), { dataTransfer: { files: [], types: [] } });
    expect(onFile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/library`
Expected: FAIL.

- [ ] **Step 3: Implementar componentes**

`src/library/PdfDropzone.tsx`:
```tsx
import { useId, useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface Props { onFile: (file: File) => void; disabled?: boolean }

export function PdfDropzone({ onFile, disabled }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave disparam para cada filho; o contador evita piscar.
  const depth = useRef(0);

  function hasFiles(e: DragEvent) {
    return Array.from(e.dataTransfer?.types ?? []).includes('Files');
  }
  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    depth.current++;
    setDragging(true);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  function onDragLeave() {
    depth.current = Math.max(depth.current - 1, 0);
    if (depth.current === 0) setDragging(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFile(file);
  }
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }

  return (
    <div
      className="dropzone"
      data-testid="dropzone"
      data-dragging={dragging ? 'true' : 'false'}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="dropzone__book" aria-hidden="true">
        <span className="dropzone__ribbon" />
        <span className="dropzone__title">Seu<br />próximo<br />livro</span>
      </div>
      <p className="dropzone__lead">Escolha um PDF e comece a leitura.</p>
      <p className="dropzone__hint">
        {dragging ? 'Solte o arquivo para abrir.' : 'Clique para selecionar ou arraste o arquivo até aqui.'}
      </p>
      <label htmlFor={inputId} className="visually-hidden">Abrir PDF</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="visually-hidden"
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
      />
    </div>
  );
}
```

`src/library/ContinueReadingCard.tsx`:
```tsx
interface Props { name: string; page: number; pageCount: number; onContinue: () => void }

export function ContinueReadingCard({ name, page, pageCount, onContinue }: Props) {
  return (
    <button type="button" className="continue" onClick={onContinue}>
      <span className="continue__label">Continuar lendo</span>
      <span className="continue__name">{name}</span>
      <span className="continue__page">Página {page} de {pageCount}</span>
    </button>
  );
}
```

`src/library/LibraryView.tsx`:
```tsx
import { useRef } from 'react';
import { PdfDropzone } from './PdfDropzone';
import { ContinueReadingCard } from './ContinueReadingCard';

interface Props {
  onFile: (file: File) => void;
  continueInfo?: { name: string; page: number; pageCount: number; onContinue: () => void };
}

export function LibraryView({ onFile, continueInfo }: Props) {
  const openRef = useRef<HTMLInputElement>(null);
  return (
    <main className="library wood">
      <header className="library__header">
        <h1 className="library__title">Escrivaninha</h1>
        <p className="library__subtitle">Sua biblioteca particular</p>
      </header>

      <PdfDropzone onFile={onFile} />

      <div className="library__actions">
        <label className="button button--primary">
          Abrir PDF
          <input
            ref={openRef}
            type="file"
            accept="application/pdf,.pdf"
            className="visually-hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
          />
        </label>
        {continueInfo && <ContinueReadingCard {...continueInfo} />}
      </div>

      <p className="library__privacy">
        <span aria-hidden="true">🔒</span> O documento permanece neste dispositivo e não é enviado a nenhum servidor.
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Estilos**

`src/styles/wood.css`:
```css
/* Madeira em CSS: veios com repeating-linear-gradient de baixo contraste,
   nós com radial-gradients esparsos e vinheta. Sem imagem: zero bytes de asset. */
.wood {
  background-color: var(--wood-800);
  background-image:
    radial-gradient(ellipse at 50% 30%, rgba(201, 164, 92, 0.10), transparent 60%),
    radial-gradient(ellipse at 50% 100%, rgba(0, 0, 0, 0.55), transparent 70%),
    repeating-linear-gradient(
      92deg,
      rgba(0, 0, 0, 0.00) 0px,
      rgba(0, 0, 0, 0.12) 3px,
      rgba(0, 0, 0, 0.00) 7px,
      rgba(255, 220, 160, 0.03) 11px,
      rgba(0, 0, 0, 0.00) 16px
    ),
    repeating-linear-gradient(
      88deg,
      rgba(0, 0, 0, 0.00) 0px,
      rgba(0, 0, 0, 0.08) 23px,
      rgba(0, 0, 0, 0.00) 41px
    ),
    linear-gradient(180deg, var(--wood-700) 0%, var(--wood-800) 45%, var(--wood-900) 100%);
  box-shadow: inset 0 0 180px rgba(0, 0, 0, 0.75);
}
```

`src/styles/library.css`:
```css
.library {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  justify-items: center;
  align-content: center;
  gap: 28px;
  padding: 48px 20px 28px;
}
.library__header { text-align: center; }
.library__title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(44px, 7vw, 68px);
  letter-spacing: 0.04em;
  color: var(--gold-300);
  margin: 0;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.6);
}
.library__subtitle {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 18px;
  color: var(--cream-200);
  opacity: 0.8;
  margin: 6px 0 0;
}

.dropzone {
  width: min(560px, 92vw);
  padding: 44px 24px 36px;
  border: 1px dashed rgba(201, 164, 92, 0.35);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
  text-align: center;
  cursor: pointer;
  transition: border-color var(--controls-fade), background var(--controls-fade), transform var(--controls-fade);
}
.dropzone:hover { border-color: rgba(201, 164, 92, 0.6); }
.dropzone[data-dragging='true'] {
  border-color: var(--gold-500);
  background: rgba(201, 164, 92, 0.08);
  transform: translateY(-2px);
}
.dropzone__book {
  position: relative;
  width: 132px; height: 178px;
  margin: 0 auto 26px;
  border-radius: 4px 10px 10px 4px;
  background: linear-gradient(100deg, #7a2a24 0%, #5b1c1b 60%, #4a1614 100%);
  box-shadow: inset 4px 0 0 rgba(0, 0, 0, 0.35), inset -2px 0 0 rgba(255, 255, 255, 0.05), 0 18px 30px rgba(0, 0, 0, 0.5);
  display: grid; place-items: center;
  transition: transform 400ms var(--ease-page);
}
.dropzone[data-dragging='true'] .dropzone__book { transform: translateY(-6px) rotate(-1.5deg); }
.dropzone__title {
  font-family: var(--font-serif);
  color: var(--cream-100);
  font-size: 15px; letter-spacing: 0.16em; text-transform: uppercase; line-height: 1.5;
}
.dropzone__ribbon {
  position: absolute; top: -4px; right: 18px;
  width: 12px; height: 78px;
  background: var(--bordeaux-600);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%);
}
.dropzone__lead { font-family: var(--font-serif); font-size: 21px; margin: 0 0 6px; color: var(--cream-100); }
.dropzone__hint { font-size: 13px; color: var(--cream-200); opacity: 0.7; margin: 0; }

.library__actions { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: center; }
.button {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid rgba(201, 164, 92, 0.6);
  color: var(--gold-300);
  background: rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: background var(--controls-fade), border-color var(--controls-fade);
}
.button:hover { background: rgba(201, 164, 92, 0.12); border-color: var(--gold-500); }
.button:focus-within { outline: 2px solid var(--gold-500); outline-offset: 3px; }

.continue {
  display: grid; text-align: left;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid rgba(201, 164, 92, 0.3);
  background: rgba(0, 0, 0, 0.25);
}
.continue:hover { border-color: var(--gold-500); }
.continue__label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-500); }
.continue__name { font-family: var(--font-serif); font-size: 17px; color: var(--cream-100); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.continue__page { font-size: 12px; color: var(--cream-200); opacity: 0.75; }

.library__privacy { font-size: 12px; color: var(--cream-200); opacity: 0.6; margin: 0; }
```

- [ ] **Step 5: App e main**

`src/main.tsx`: adicionar `import './styles/wood.css'; import './styles/library.css';` após `base.css`.

`src/app/App.tsx`:
```tsx
import { useEffect, useReducer, useState } from 'react';
import { appReducer, initialState } from './appState';
import { useOpenBook } from './useOpenBook';
import { LibraryView } from '../library/LibraryView';
import { loadCurrentBook, type StoredBook } from '../persistence/bookStore';
import { loadReadingState } from '../persistence/readingState';

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const book = 'book' in state ? state.book : undefined;
  const { openFile, openStored } = useOpenBook(dispatch, book);
  const [stored, setStored] = useState<StoredBook | null>(null);

  useEffect(() => { void loadCurrentBook().then(setStored); }, [state.status]);

  if (state.status === 'library') {
    const saved = loadReadingState();
    const continueInfo = book
      ? { name: book.name, page: saved?.page ?? 1, pageCount: book.loaded.pageCount, onContinue: () => dispatch({ type: 'resume' }) }
      : stored?.blob
        ? { name: stored.name, page: saved?.page ?? 1, pageCount: stored.pageCount, onContinue: () => { void openStored(); } }
        : undefined;
    return <LibraryView onFile={(f) => { void openFile(f); }} continueInfo={continueInfo} />;
  }
  if (state.status === 'loading') return <p>Preparando seu livro...</p>;
  if (state.status === 'error') return <p role="alert">{state.message}</p>;
  return <p>Lendo {state.book.name} ({state.book.loaded.pageCount} páginas)</p>;
}
```

- [ ] **Step 6: Rodar testes, lint e conferir no navegador**

Run: `npx vitest run src/library && npm run lint && npm run dev`
Abrir `http://localhost:5173`: título, dropzone, botão; arrastar um PDF muda o destaque; abrir um PDF mostra "Lendo ...". Console sem erros.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(library): tela inicial com dropzone, botão Abrir PDF e card continuar"
```

---

### Task 8: Estados de loading e erro

**Files:**
- Create: `src/reader/LoadingState.tsx`, `src/reader/ErrorState.tsx`, `src/styles/states.css`
- Modify: `src/app/App.tsx`, `src/main.tsx`

**Interfaces:**
- Produces:
```tsx
export function LoadingState(props: { name: string; progress: number }): JSX.Element;
export function ErrorState(props: { message: string; onBack: () => void }): JSX.Element;
```

- [ ] **Step 1: Implementar**

`src/reader/LoadingState.tsx`:
```tsx
interface Props { name: string; progress: number }

export function LoadingState({ name, progress }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <main className="state wood" aria-busy="true">
      <div className="opening-book" aria-hidden="true">
        <span className="opening-book__cover" />
        <span className="opening-book__page" />
        <span className="opening-book__page opening-book__page--2" />
      </div>
      <p className="state__title">Preparando seu livro...</p>
      <p className="state__detail">{name}</p>
      <div className="state__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Carregando">
        <span style={{ width: `${pct}%` }} />
      </div>
    </main>
  );
}
```

`src/reader/ErrorState.tsx`:
```tsx
interface Props { message: string; onBack: () => void }

export function ErrorState({ message, onBack }: Props) {
  return (
    <main className="state wood">
      <p className="state__title" role="alert">{message}</p>
      <button type="button" className="button button--primary" onClick={onBack} autoFocus>
        Voltar para a biblioteca
      </button>
    </main>
  );
}
```

`src/styles/states.css`:
```css
.state {
  min-height: 100%;
  display: grid; place-content: center; justify-items: center;
  gap: 14px; text-align: center; padding: 24px;
}
.state__title { font-family: var(--font-serif); font-size: 26px; color: var(--cream-100); margin: 0; }
.state__detail { font-size: 13px; color: var(--cream-200); opacity: 0.7; margin: 0; }
.state__progress {
  width: 220px; height: 2px; background: rgba(201, 164, 92, 0.2); border-radius: 2px; overflow: hidden;
}
.state__progress > span { display: block; height: 100%; background: var(--gold-500); transition: width 200ms linear; }

/* Livro abrindo: capa fixa, duas "páginas" virando em loop com perspectiva. */
.opening-book { position: relative; width: 120px; height: 84px; perspective: 600px; margin-bottom: 8px; }
.opening-book__cover, .opening-book__page {
  position: absolute; left: 50%; top: 0; width: 56px; height: 84px;
  transform-origin: left center; border-radius: 0 4px 4px 0;
}
.opening-book__cover { background: var(--bordeaux-600); box-shadow: 0 8px 18px rgba(0,0,0,.5); }
.opening-book__page {
  background: var(--cream-100);
  animation: page-loop 1.6s var(--ease-page) infinite;
}
.opening-book__page--2 { animation-delay: 0.8s; }
@keyframes page-loop {
  0% { transform: rotateY(0deg); }
  60%, 100% { transform: rotateY(-180deg); }
}
@media (prefers-reduced-motion: reduce) { .opening-book__page { animation: none; } }
```

Em `src/main.tsx`: `import './styles/states.css';`.

Em `src/app/App.tsx` substituir os `<p>` provisórios:
```tsx
if (state.status === 'loading') return <LoadingState name={state.name} progress={state.progress} />;
if (state.status === 'error') return <ErrorState message={state.message} onBack={() => dispatch({ type: 'dismiss-error' })} />;
```
com os imports correspondentes.

- [ ] **Step 2: Verificar no navegador**

`npm run dev`; arrastar um `.txt` renomeado para `.pdf` mostra "Este arquivo não parece ser um PDF." e o botão volta à biblioteca. Um PDF válido mostra o loading e depois "Lendo ...".

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(reader): estados de carregamento e erro"
```

---

### Task 9: Página renderizada (hook + canvas)

**Files:**
- Create: `src/pdf/usePageBitmap.ts`, `src/pdf/RendererContext.tsx`, `src/reader/Page.tsx`

**Interfaces:**
- Consumes: `PageRenderer`, `BitmapCache`, `createPdfBackend`.
- Produces:
```tsx
export const RendererProvider: (props: { book: OpenBook; children: ReactNode }) => JSX.Element;
export function useRenderer(): PageRenderer;
export function usePageBitmap(page: number | undefined, scale: number): ImageBitmap | null;
export function Page(props: { page?: number; scale: number; cssWidth: number; cssHeight: number; side: 'left' | 'right' | 'single' }): JSX.Element;
```

- [ ] **Step 1: Implementar contexto do renderer**

`src/pdf/RendererContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { PageRenderer, createPdfBackend } from './pageRenderer';
import { BitmapCache } from './bitmapCache';
import type { OpenBook } from '../app/appState';

const Ctx = createContext<PageRenderer | null>(null);

// Um renderer por livro: trocar de livro descarta fila e cache juntos.
export function RendererProvider({ book, children }: { book: OpenBook; children: ReactNode }) {
  const renderer = useMemo(() => new PageRenderer(createPdfBackend(book.loaded), new BitmapCache()), [book]);
  useEffect(() => () => renderer.dispose(), [renderer]);
  return <Ctx.Provider value={renderer}>{children}</Ctx.Provider>;
}

export function useRenderer(): PageRenderer {
  const r = useContext(Ctx);
  if (!r) throw new Error('useRenderer fora de RendererProvider');
  return r;
}
```

`src/pdf/usePageBitmap.ts`:
```ts
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
```

`src/reader/Page.tsx`:
```tsx
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
      {page && !bitmap && <div className="page__loading" aria-hidden="true" />}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run lint`
Expected: limpo.

- [ ] **Step 3: Commit**

```bash
git add src/pdf/usePageBitmap.ts src/pdf/RendererContext.tsx src/reader/Page.tsx
git commit -m "feat(pdf): contexto do renderer, hook de bitmap e componente Page"
```

---

### Task 10: Navegação do livro e spread estático

**Files:**
- Create: `src/book/useBookNavigation.ts`, `src/book/useBookNavigation.test.ts`, `src/shared/useMediaQuery.ts`, `src/reader/Book.tsx`, `src/reader/ReaderView.tsx`, `src/styles/book.css`, `src/styles/reader.css`
- Modify: `src/app/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `spreadLayout`, `Page`, `RendererProvider`.
- Produces:
```ts
export interface Flip { from: number; to: number; direction: FlipDirection; front?: number; back?: number }
export interface BookNavigation {
  mode: ViewMode; spreadIndex: number; currentPage: number; pageCount: number; flip: Flip | null;
  next(): void; prev(): void; goToPage(page: number): void; finishFlip(): void;
}
export function useBookNavigation(pageCount: number, mode: ViewMode, initialPage: number, animate: boolean): BookNavigation;
export function useMediaQuery(query: string): boolean;
export function useViewMode(): ViewMode; // em useMediaQuery.ts
```

- [ ] **Step 1: Testes da navegação**

`src/book/useBookNavigation.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookNavigation } from './useBookNavigation';

describe('useBookNavigation', () => {
  it('começa no spread da página inicial', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 5, true));
    expect(result.current.spreadIndex).toBe(2);
    expect(result.current.currentPage).toBe(4);
  });
  it('next inicia flip e finishFlip aplica', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 1, true));
    act(() => result.current.next());
    expect(result.current.flip).toEqual({ from: 0, to: 1, direction: 'forward', front: 1, back: 2 });
    expect(result.current.spreadIndex).toBe(0);
    act(() => result.current.finishFlip());
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(1);
  });
  it('sem animação aplica direto', () => {
    const { result } = renderHook(() => useBookNavigation(10, 'spread', 1, false));
    act(() => result.current.next());
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(1);
  });
  it('enfileira no máximo uma entrada durante o flip', () => {
    const { result } = renderHook(() => useBookNavigation(20, 'spread', 1, true));
    act(() => { result.current.next(); result.current.next(); result.current.next(); });
    act(() => result.current.finishFlip());
    expect(result.current.spreadIndex).toBe(1);
    expect(result.current.flip).toEqual(expect.objectContaining({ from: 1, to: 2 }));
    act(() => result.current.finishFlip());
    expect(result.current.spreadIndex).toBe(2);
    expect(result.current.flip).toBeNull();
  });
  it('respeita limites', () => {
    const { result } = renderHook(() => useBookNavigation(3, 'single', 1, false));
    act(() => result.current.prev());
    expect(result.current.spreadIndex).toBe(0);
    act(() => result.current.goToPage(99));
    expect(result.current.currentPage).toBe(3);
    act(() => result.current.next());
    expect(result.current.spreadIndex).toBe(2);
  });
  it('goToPage distante não anima, só salta', () => {
    const { result } = renderHook(() => useBookNavigation(50, 'spread', 1, true));
    act(() => result.current.goToPage(40));
    expect(result.current.flip).toBeNull();
    expect(result.current.spreadIndex).toBe(20);
  });
  it('trocar de modo preserva a página atual', () => {
    const { result, rerender } = renderHook(({ mode }) => useBookNavigation(20, mode, 7, false), { initialProps: { mode: 'spread' as const } });
    expect(result.current.currentPage).toBe(6);
    rerender({ mode: 'single' as const });
    expect(result.current.currentPage).toBe(6);
    expect(result.current.spreadIndex).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/book/useBookNavigation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar hook e media query**

`src/book/useBookNavigation.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clampPage, firstPageOfSpread, sheetForTransition, spreadCount, spreadForPage,
  type FlipDirection, type ViewMode,
} from './spreadLayout';

export interface Flip { from: number; to: number; direction: FlipDirection; front?: number; back?: number }

export interface BookNavigation {
  mode: ViewMode;
  spreadIndex: number;
  currentPage: number;
  pageCount: number;
  flip: Flip | null;
  next(): void;
  prev(): void;
  goToPage(page: number): void;
  finishFlip(): void;
}

/**
 * Estado lógico do livro. Durante a animação o spread atual não muda; só ao
 * `finishFlip` o índice avança. Uma entrada extra fica enfileirada para que
 * duas teclas rápidas virem duas páginas sem quebrar a animação.
 */
export function useBookNavigation(pageCount: number, mode: ViewMode, initialPage: number, animate: boolean): BookNavigation {
  const [page, setPage] = useState(() => clampPage(initialPage, pageCount));
  const [flip, setFlip] = useState<Flip | null>(null);
  const queued = useRef<'next' | 'prev' | null>(null);
  const spreadIndex = spreadForPage(page, mode, pageCount);
  const total = spreadCount(pageCount, mode);

  // Página exposta é sempre a primeira do spread para o indicador e a persistência.
  const currentPage = firstPageOfSpread(spreadIndex, mode, pageCount);

  // Trocar de modo no meio de um flip deixaria uma sheet órfã: descartamos.
  useEffect(() => { setFlip(null); queued.current = null; }, [mode]);

  const go = useCallback((target: number) => {
    const to = Math.min(Math.max(target, 0), total - 1);
    const from = spreadForPage(page, mode, pageCount);
    if (to === from) return;
    if (!animate || Math.abs(to - from) !== 1) {
      setPage(firstPageOfSpread(to, mode, pageCount));
      return;
    }
    const sheet = sheetForTransition(from, to, mode, pageCount);
    setFlip({ from, to, ...sheet });
  }, [page, mode, pageCount, total, animate]);

  const next = useCallback(() => {
    if (flip) { queued.current = 'next'; return; }
    go(spreadIndex + 1);
  }, [flip, go, spreadIndex]);

  const prev = useCallback(() => {
    if (flip) { queued.current = 'prev'; return; }
    go(spreadIndex - 1);
  }, [flip, go, spreadIndex]);

  const goToPage = useCallback((p: number) => {
    if (flip) return;
    go(spreadForPage(clampPage(p, pageCount), mode, pageCount));
  }, [flip, go, mode, pageCount]);

  const finishFlip = useCallback(() => {
    if (!flip) return;
    const landed = flip.to;
    setPage(firstPageOfSpread(landed, mode, pageCount));
    setFlip(null);
    const q = queued.current;
    queued.current = null;
    if (q) {
      const to = Math.min(Math.max(landed + (q === 'next' ? 1 : -1), 0), total - 1);
      if (to !== landed) setFlip({ from: landed, to, ...sheetForTransition(landed, to, mode, pageCount) });
    }
  }, [flip, mode, pageCount, total]);

  return { mode, spreadIndex, currentPage, pageCount, flip, next, prev, goToPage, finishFlip };
}
```

`src/shared/useMediaQuery.ts`:
```ts
import { useEffect, useState } from 'react';
import type { ViewMode } from '../book/spreadLayout';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

// Duas páginas só quando há largura e a tela é mais larga que alta o bastante
// para as duas caberem sem ficarem minúsculas.
export function useViewMode(): ViewMode {
  const wide = useMediaQuery('(min-width: 900px) and (min-aspect-ratio: 6/5)');
  return wide ? 'spread' : 'single';
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/book`
Expected: PASS.

- [ ] **Step 5: Book e ReaderView (sem animação ainda)**

`src/reader/Book.tsx`:
```tsx
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { pagesInSpread } from '../book/spreadLayout';
import type { BookNavigation } from '../book/useBookNavigation';
import { Page } from './Page';

interface Props {
  nav: BookNavigation;
  pageSize: { width: number; height: number };
  zoom: number;
  onClickSide?: (side: 'left' | 'right') => void;
  /** Sheet em animação, injetada pela Task 11. */
  children?: ReactNode;
}

export interface PageMetrics { cssWidth: number; cssHeight: number; scale: number }

export function usePageMetrics(container: React.RefObject<HTMLElement | null>, pageSize: Props['pageSize'], mode: 'spread' | 'single', zoom: number): PageMetrics {
  const [area, setArea] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [container]);
  // 100% = página ajustada à área; o zoom multiplica esse ajuste.
  const pagesAcross = mode === 'spread' ? 2 : 1;
  const margin = 0.92;
  const fit = area.w && area.h
    ? Math.min((area.w * margin) / (pageSize.width * pagesAcross), (area.h * margin) / pageSize.height)
    : 1;
  const cssScale = fit * (zoom / 100);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
  return {
    cssWidth: Math.round(pageSize.width * cssScale),
    cssHeight: Math.round(pageSize.height * cssScale),
    scale: Number((cssScale * dpr).toFixed(3)),
  };
}

export function Book({ nav, pageSize, zoom, onClickSide, children }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const metrics = usePageMetrics(areaRef, pageSize, nav.mode, zoom);
  const spread = pagesInSpread(nav.spreadIndex, nav.mode, nav.pageCount);

  // Durante um flip a base mostra o que fica parado: esquerda do spread menor
  // e direita do spread maior; a sheet em movimento cobre o resto.
  let left: number | undefined;
  let right: number | undefined;
  let single: number | undefined;
  if (spread.kind === 'single') {
    single = nav.flip ? Math.max(nav.flip.from, nav.flip.to) + 1 : spread.page;
  } else if (nav.flip) {
    const lo = pagesInSpread(Math.min(nav.flip.from, nav.flip.to), 'spread', nav.pageCount);
    const hi = pagesInSpread(Math.max(nav.flip.from, nav.flip.to), 'spread', nav.pageCount);
    left = lo.kind === 'spread' ? lo.left : undefined;
    right = hi.kind === 'spread' ? hi.right : undefined;
  } else {
    left = spread.left; right = spread.right;
  }

  const progress = nav.pageCount > 1 ? nav.currentPage / nav.pageCount : 0;

  return (
    <div className="book-area" ref={areaRef}>
      <div
        className={`book book--${nav.mode}`}
        style={{ ['--page-w' as string]: `${metrics.cssWidth}px`, ['--page-h' as string]: `${metrics.cssHeight}px`, ['--progress' as string]: progress }}
        data-flipping={nav.flip ? nav.flip.direction : undefined}
      >
        <div className="book__edge book__edge--left" aria-hidden="true" />
        <div className="book__edge book__edge--right" aria-hidden="true" />
        {nav.mode === 'spread' ? (
          <>
            <div className="book__side book__side--left" onClick={() => onClickSide?.('left')}>
              <Page page={left} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="left" />
            </div>
            <div className="book__side book__side--right" onClick={() => onClickSide?.('right')}>
              <Page page={right} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="right" />
            </div>
          </>
        ) : (
          <div className="book__side book__side--single" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onClickSide?.(e.clientX - r.left < r.width / 2 ? 'left' : 'right');
          }}>
            <Page page={single} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="single" />
          </div>
        )}
        <div className="book__spine" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
```

`src/reader/ReaderView.tsx` (primeira versão: só livro, teclado básico vem na Task 13):
```tsx
import { useEffect, useState } from 'react';
import type { OpenBook } from '../app/appState';
import { RendererProvider, useRenderer } from '../pdf/RendererContext';
import { useBookNavigation } from '../book/useBookNavigation';
import { useViewMode, usePrefersReducedMotion } from '../shared/useMediaQuery';
import { pagesToPrefetch } from '../book/spreadLayout';
import { Book } from './Book';

interface Props { book: OpenBook; onBack: () => void }

export function ReaderView({ book, onBack }: Props) {
  return (
    <RendererProvider book={book}>
      <ReaderInner book={book} onBack={onBack} />
    </RendererProvider>
  );
}

function ReaderInner({ book, onBack }: Props) {
  const mode = useViewMode();
  const reduced = usePrefersReducedMotion();
  const nav = useBookNavigation(book.loaded.pageCount, mode, book.initialPage, !reduced);
  const [zoom] = useState(book.initialZoom);
  const renderer = useRenderer();

  // Prefetch: pede as vizinhas com prioridade baixa e cancela o que saiu da janela.
  useEffect(() => {
    const pages = pagesToPrefetch(nav.spreadIndex, nav.mode, nav.pageCount, 4);
    renderer.retainOnly(new Set(pages));
    // A escala real vem do Book; aqui só aquecemos o cache na escala corrente
    // guardada pelo Page (mesma chave), então usamos o último scale conhecido.
  }, [renderer, nav.spreadIndex, nav.mode, nav.pageCount]);

  return (
    <div className="reader">
      <button type="button" className="reader__back" onClick={onBack}>← Biblioteca</button>
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} />
      <p className="reader__indicator" aria-live="polite">Página {nav.currentPage} / {nav.pageCount}</p>
    </div>
  );
}
```

Nota: o prefetch real com escala é fechado na Task 12 (o `Book` passa a expor `metrics.scale` via callback `onMetrics`). Aqui o `retainOnly` já evita renders fora da janela.

`src/styles/book.css`:
```css
.book-area {
  flex: 1; min-height: 0; width: 100%;
  display: grid; place-items: center;
  overflow: auto;
  perspective: 2400px;
}
.book {
  position: relative;
  display: flex;
  height: var(--page-h);
  box-shadow: var(--shadow-book);
  border-radius: 3px;
  transform-style: preserve-3d;
}
.book--spread { width: calc(var(--page-w) * 2); }
.book--single { width: var(--page-w); }

.book__side { position: relative; width: var(--page-w); height: var(--page-h); }

.page {
  position: relative; overflow: hidden;
  background: var(--cream-100);
  /* Papel: leve textura de fibra e vinheta nas bordas externas. */
  background-image:
    radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.35), transparent 70%),
    repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0 1px, transparent 1px 3px);
}
.page__canvas { display: block; }
.page__blank { width: 100%; height: 100%; background: var(--cream-200); }
.page__loading {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* Sombra da lombada: escurece a borda interna das duas páginas. */
.page--left::after, .page--right::after {
  content: ''; position: absolute; top: 0; bottom: 0; width: 10%; pointer-events: none;
}
.page--left::after { right: 0; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.18)); }
.page--right::after { left: 0; background: linear-gradient(270deg, transparent, rgba(0,0,0,0.22)); }
.page--single::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 6%; pointer-events: none;
  background: linear-gradient(90deg, rgba(0,0,0,0.18), transparent);
}
.book__spine {
  position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px;
  background: rgba(0,0,0,0.35); pointer-events: none;
}
.book--single .book__spine { display: none; }

/* Blocos de páginas restantes: espessura proporcional à posição no livro. */
.book__edge {
  position: absolute; top: 2px; bottom: 2px; width: 14px; pointer-events: none;
  background: repeating-linear-gradient(180deg, #efe6cf 0 1px, #d9cfb4 1px 2px);
}
.book__edge--left { right: 100%; transform: scaleX(calc(var(--progress) * 1)); transform-origin: right; }
.book__edge--right { left: 100%; transform: scaleX(calc(1 - var(--progress))); transform-origin: left; }
.book--single .book__edge--left { display: none; }
```

`src/styles/reader.css`:
```css
.reader {
  position: relative; height: 100%;
  display: flex; flex-direction: column;
  background: radial-gradient(ellipse at 50% 40%, var(--wood-800), var(--wood-900) 75%);
}
.reader__back {
  position: absolute; top: 14px; left: 16px; z-index: 5;
  padding: 6px 12px; border-radius: 999px;
  color: var(--gold-300); font-size: 13px;
  background: rgba(0,0,0,0.35);
}
.reader__indicator { text-align: center; color: var(--cream-200); font-size: 13px; margin: 8px 0; }
```

Em `src/main.tsx`: importar `book.css` e `reader.css`. Em `App.tsx`, no ramo `reading`: `return <ReaderView book={state.book} onBack={() => dispatch({ type: 'back-to-library' })} />;`.

- [ ] **Step 6: Verificar no navegador**

`npm run dev`; abrir um PDF: duas páginas lado a lado (capa sozinha à direita), clique esquerdo/direito muda o spread instantaneamente (sem animação ainda), indicador atualiza, "← Biblioteca" volta e "Continuar lendo" retoma. Redimensionar a janela abaixo de 900px mostra uma página. Console limpo.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(reader): livro com spread/single, navegação e visual de papel"
```

---

### Task 11: Animação de virada (Sheet)

**Files:**
- Create: `src/reader/Sheet.tsx`
- Modify: `src/reader/Book.tsx`, `src/reader/ReaderView.tsx`, `src/styles/book.css`

**Interfaces:**
- Consumes: `Flip`, `Page`, `PageMetrics`.
- Produces: `export function Sheet(props: { flip: Flip; metrics: PageMetrics; mode: ViewMode; onDone: () => void }): JSX.Element;`

- [ ] **Step 1: Implementar Sheet**

`src/reader/Sheet.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import type { Flip } from '../book/useBookNavigation';
import type { ViewMode } from '../book/spreadLayout';
import type { PageMetrics } from './Book';
import { Page } from './Page';

interface Props { flip: Flip; metrics: PageMetrics; mode: ViewMode; onDone: () => void }

/**
 * Folha que gira sobre a lombada (spread) ou sobre a borda esquerda (single).
 * A frente é a página que sai; o verso, a que entra. A animação é CSS; o React
 * só espera `animationend` para confirmar o novo spread.
 */
export function Sheet({ flip, metrics, mode, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: AnimationEvent) => { if (e.target === el) done.current(); };
    el.addEventListener('animationend', handler);
    // Fallback: se o navegador pular a animação (aba oculta), não travar o livro.
    const t = window.setTimeout(() => done.current(), 900);
    return () => { el.removeEventListener('animationend', handler); window.clearTimeout(t); };
  }, [flip]);

  return (
    <div ref={ref} className={`sheet sheet--${flip.direction} sheet--${mode}`} style={{ width: metrics.cssWidth, height: metrics.cssHeight }} aria-hidden="true">
      <div className="sheet__face sheet__face--front">
        <Page page={flip.front} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side={mode === 'spread' ? 'right' : 'single'} />
        <div className="sheet__shade" />
      </div>
      <div className="sheet__face sheet__face--back">
        <Page page={flip.back} scale={metrics.scale} cssWidth={metrics.cssWidth} cssHeight={metrics.cssHeight} side="left" />
        <div className="sheet__shade" />
      </div>
      <div className="sheet__cast" />
    </div>
  );
}
```

- [ ] **Step 2: Integrar no Book**

Em `src/reader/Book.tsx`:
- adicionar prop `onFlipDone: () => void`;
- após `<div className="book__spine" />`, renderizar:
```tsx
{nav.flip && <Sheet flip={nav.flip} metrics={metrics} mode={nav.mode} onDone={onFlipDone} />}
```
- remover a prop `children`.

Em `ReaderView.tsx`: `<Book ... onFlipDone={nav.finishFlip} />`.

- [ ] **Step 3: CSS da virada**

Adicionar em `src/styles/book.css`:
```css
/* ---- Virada de página ---- */
.sheet {
  position: absolute; top: 0; left: 50%;
  transform-style: preserve-3d;
  transform-origin: left center;
  will-change: transform;
  z-index: 3;
}
.book--single .sheet { left: 0; }

.sheet__face {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
.sheet__face--back { transform: rotateY(180deg); }
/* Verso vazio (modo single ou fim do livro): papel em branco. */
.sheet__face--back .page__blank { background: var(--cream-100); }

.sheet__shade {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(90deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05) 40%, rgba(255,255,255,0.12) 60%, rgba(0,0,0,0.25));
  opacity: 0;
}
/* Sombra projetada na página que está por baixo. */
.sheet__cast {
  position: absolute; top: 0; bottom: 0; right: 100%; width: 100%;
  pointer-events: none; opacity: 0;
  background: linear-gradient(270deg, rgba(0,0,0,0.45), transparent 70%);
}

.sheet--forward { animation: flip-forward var(--flip-duration) var(--ease-page) forwards; }
.sheet--backward { animation: flip-backward var(--flip-duration) var(--ease-page) forwards; }
.sheet--forward .sheet__shade, .sheet--backward .sheet__shade { animation: shade var(--flip-duration) var(--ease-page) forwards; }
.sheet--forward .sheet__cast { animation: cast var(--flip-duration) var(--ease-page) forwards; }
.sheet--backward .sheet__cast { animation: cast var(--flip-duration) var(--ease-page) reverse forwards; }

@keyframes flip-forward {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(-180deg); }
}
@keyframes flip-backward {
  0%   { transform: rotateY(-180deg); }
  100% { transform: rotateY(0deg); }
}
/* A luz "passa" pela folha: mais escura a meio caminho, quando está de perfil. */
@keyframes shade {
  0% { opacity: 0; } 50% { opacity: 0.9; } 100% { opacity: 0; }
}
@keyframes cast {
  0% { opacity: 0; } 40% { opacity: 0.7; } 100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sheet { animation-duration: 150ms !important; }
  .sheet__shade, .sheet__cast { animation: none !important; }
}
```

- [ ] **Step 4: Verificar no navegador**

`npm run dev`; virar para frente: a página direita gira sobre a lombada e revela o verso à esquerda; a base já mostra a próxima direita. Voltar: sentido contrário. Duas teclas rápidas viram duas páginas. Em `single` a página gira sobre a borda esquerda. Sem flash de branco entre base e sheet (se houver, conferir se `left/right` da base seguem a regra "lo.left / hi.right").

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(reader): animação de virada de página em CSS 3D com luz e sombra"
```

---

### Task 12: Controles do leitor, zoom, tela cheia e prefetch com escala

**Files:**
- Create: `src/reader/ReaderControls.tsx`, `src/reader/PageIndicator.tsx`, `src/reader/PageIndicator.test.tsx`, `src/reader/ZoomControls.tsx`, `src/reader/FullscreenButton.tsx`, `src/shared/useFullscreen.ts`, `src/shared/useAutoHide.ts`
- Modify: `src/reader/ReaderView.tsx`, `src/reader/Book.tsx`, `src/styles/reader.css`

**Interfaces:**
- Produces:
```tsx
export function PageIndicator(props: { page: number; pageCount: number; onGoTo: (p: number) => void }): JSX.Element;
export function ZoomControls(props: { zoom: number; onZoomIn: () => void; onZoomOut: () => void }): JSX.Element;
export function FullscreenButton(props: { active: boolean; onToggle: () => void }): JSX.Element;
export function ReaderControls(props: { visible: boolean; page: number; pageCount: number; zoom: number; fullscreen: boolean; onPrev: () => void; onNext: () => void; onGoTo: (p: number) => void; onZoomIn: () => void; onZoomOut: () => void; onToggleFullscreen: () => void }): JSX.Element;
export function useFullscreen(target: RefObject<HTMLElement | null>): { active: boolean; toggle: () => void };
export function useAutoHide(delayMs: number): { visible: boolean; poke: () => void; hold: (on: boolean) => void };
// Book ganha prop `onMetrics?: (m: PageMetrics) => void`
```

- [ ] **Step 1: Teste do indicador**

`src/reader/PageIndicator.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageIndicator } from './PageIndicator';

describe('PageIndicator', () => {
  it('mostra página atual / total e abre input ao clicar', () => {
    render(<PageIndicator page={14} pageCount={286} onGoTo={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /ir para uma página/i });
    expect(btn).toHaveTextContent('Página 14 / 286');
    fireEvent.click(btn);
    expect(screen.getByRole('spinbutton')).toHaveValue(14);
  });
  it('Enter salta e Esc cancela', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '33' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onGoTo).toHaveBeenCalledWith(33);
    expect(screen.queryByRole('spinbutton')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Escape' });
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(onGoTo).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/reader`
Expected: FAIL. (Se `toHaveTextContent` não existir, usar `expect(btn.textContent).toContain(...)` em vez de instalar `jest-dom`.)

- [ ] **Step 3: Implementar componentes e hooks**

`src/reader/PageIndicator.tsx`:
```tsx
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Props { page: number; pageCount: number; onGoTo: (p: number) => void }

export function PageIndicator({ page, pageCount, onGoTo }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(page));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { setValue(String(page)); inputRef.current?.select(); } }, [editing, page]);

  function commit() {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) onGoTo(n);
    setEditing(false);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    // Parar propagação: as setas aqui editam o número, não viram a página.
    e.stopPropagation();
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <span className="indicator">
        <label className="visually-hidden" htmlFor="goto-page">Ir para a página</label>
        <input id="goto-page" ref={inputRef} type="number" min={1} max={pageCount} value={value}
          className="indicator__input" autoFocus
          onChange={(e) => setValue(e.target.value)} onKeyDown={onKey} onBlur={commit} />
        <span className="indicator__total"> / {pageCount}</span>
      </span>
    );
  }
  return (
    <button type="button" className="indicator" onClick={() => setEditing(true)} aria-label={`Página ${page} de ${pageCount}. Ir para uma página`}>
      Página {page} / {pageCount}
    </button>
  );
}
```

`src/reader/ZoomControls.tsx`:
```tsx
interface Props { zoom: number; onZoomIn: () => void; onZoomOut: () => void }

export function ZoomControls({ zoom, onZoomIn, onZoomOut }: Props) {
  return (
    <span className="zoom" role="group" aria-label="Zoom">
      <button type="button" onClick={onZoomOut} aria-label="Diminuir zoom" disabled={zoom <= 50}>−</button>
      <span className="zoom__value" aria-live="polite">{zoom}%</span>
      <button type="button" onClick={onZoomIn} aria-label="Aumentar zoom" disabled={zoom >= 200}>+</button>
    </span>
  );
}
```

`src/reader/FullscreenButton.tsx`:
```tsx
interface Props { active: boolean; onToggle: () => void }

export function FullscreenButton({ active, onToggle }: Props) {
  return (
    <button type="button" onClick={onToggle} aria-label={active ? 'Sair da tela cheia' : 'Tela cheia'} aria-pressed={active}>
      {active ? '⤡' : '⤢'}
    </button>
  );
}
```

`src/reader/ReaderControls.tsx`:
```tsx
import { PageIndicator } from './PageIndicator';
import { ZoomControls } from './ZoomControls';
import { FullscreenButton } from './FullscreenButton';

interface Props {
  visible: boolean;
  page: number; pageCount: number; zoom: number; fullscreen: boolean;
  onPrev: () => void; onNext: () => void; onGoTo: (p: number) => void;
  onZoomIn: () => void; onZoomOut: () => void; onToggleFullscreen: () => void;
}

export function ReaderControls(p: Props) {
  return (
    <div className="controls" data-visible={p.visible ? 'true' : 'false'} role="toolbar" aria-label="Controles de leitura">
      <button type="button" onClick={p.onPrev} aria-label="Página anterior" disabled={p.page <= 1}>‹</button>
      <PageIndicator page={p.page} pageCount={p.pageCount} onGoTo={p.onGoTo} />
      <button type="button" onClick={p.onNext} aria-label="Próxima página" disabled={p.page >= p.pageCount}>›</button>
      <span className="controls__sep" aria-hidden="true" />
      <ZoomControls zoom={p.zoom} onZoomIn={p.onZoomIn} onZoomOut={p.onZoomOut} />
      <span className="controls__sep" aria-hidden="true" />
      <FullscreenButton active={p.fullscreen} onToggle={p.onToggleFullscreen} />
    </div>
  );
}
```

`src/shared/useFullscreen.ts`:
```ts
import { useCallback, useEffect, useState, type RefObject } from 'react';

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement === target.current && !!target.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [target]);
  const toggle = useCallback(() => {
    const el = target.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  }, [target]);
  return { active, toggle };
}
```

`src/shared/useAutoHide.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react';

/** Visível após atividade; some após `delayMs` parado; `hold(true)` segura (foco/hover na barra). */
export function useAutoHide(delayMs: number) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | null>(null);
  const held = useRef(false);

  const arm = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { if (!held.current) setVisible(false); }, delayMs);
  }, [delayMs]);

  const poke = useCallback(() => { setVisible(true); arm(); }, [arm]);
  const hold = useCallback((on: boolean) => { held.current = on; if (on) setVisible(true); else arm(); }, [arm]);

  useEffect(() => { arm(); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, [arm]);
  return { visible, poke, hold };
}
```

- [ ] **Step 4: Book expõe métricas**

Em `src/reader/Book.tsx`: adicionar prop `onMetrics?: (m: PageMetrics) => void` e
```tsx
useEffect(() => { onMetrics?.(metrics); }, [metrics.scale, metrics.cssWidth, metrics.cssHeight]); // eslint-disable-line react-hooks/exhaustive-deps -- onMetrics é estável por useCallback no pai; incluir `metrics` re-dispararia a cada render
```
Melhor sem disable: memoizar `metrics` com `useMemo` sobre `[area, pageSize, mode, zoom]` em `usePageMetrics` e usar `[metrics, onMetrics]` como deps.

- [ ] **Step 5: ReaderView completo**

Substituir `src/reader/ReaderView.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OpenBook } from '../app/appState';
import { RendererProvider, useRenderer } from '../pdf/RendererContext';
import { useBookNavigation } from '../book/useBookNavigation';
import { useViewMode, usePrefersReducedMotion } from '../shared/useMediaQuery';
import { pagesToPrefetch } from '../book/spreadLayout';
import { nextZoom, prevZoom } from '../book/zoomLevels';
import { useFullscreen } from '../shared/useFullscreen';
import { useAutoHide } from '../shared/useAutoHide';
import { saveReadingState } from '../persistence/readingState';
import { Book, type PageMetrics } from './Book';
import { ReaderControls } from './ReaderControls';

interface Props { book: OpenBook; onBack: () => void }

export function ReaderView({ book, onBack }: Props) {
  return (
    <RendererProvider book={book}>
      <ReaderInner book={book} onBack={onBack} />
    </RendererProvider>
  );
}

function ReaderInner({ book, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mode = useViewMode();
  const reduced = usePrefersReducedMotion();
  const nav = useBookNavigation(book.loaded.pageCount, mode, book.initialPage, !reduced);
  const [zoom, setZoom] = useState(book.initialZoom);
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);
  const renderer = useRenderer();
  const { active: fullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
  const { visible, poke, hold } = useAutoHide(2500);

  const onMetrics = useCallback((m: PageMetrics) => setMetrics(m), []);

  // Prefetch na escala corrente; cancela o que saiu da janela.
  useEffect(() => {
    if (!metrics) return;
    const pages = pagesToPrefetch(nav.spreadIndex, nav.mode, nav.pageCount, 4);
    renderer.retainOnly(new Set(pages));
    for (const p of pages) renderer.request(p, metrics.scale, 'prefetch').catch(() => undefined);
  }, [renderer, nav.spreadIndex, nav.mode, nav.pageCount, metrics]);

  // Persistência com debounce: virar 10 páginas rápido gera 1 escrita.
  useEffect(() => {
    const t = window.setTimeout(() => saveReadingState({ name: book.name, size: book.size, page: nav.currentPage, zoom }), 300);
    return () => window.clearTimeout(t);
  }, [book.name, book.size, nav.currentPage, zoom]);

  return (
    <div className="reader" ref={rootRef} onMouseMove={poke} onTouchStart={poke} data-fullscreen={fullscreen}>
      <button type="button" className="reader__back" data-visible={visible} onClick={onBack}>← Biblioteca</button>
      <Book nav={nav} pageSize={book.loaded.pageSize} zoom={zoom} onMetrics={onMetrics}
        onClickSide={(s) => (s === 'right' ? nav.next() : nav.prev())} onFlipDone={nav.finishFlip} />
      <div onMouseEnter={() => hold(true)} onMouseLeave={() => hold(false)} onFocus={() => hold(true)} onBlur={() => hold(false)}>
        <ReaderControls
          visible={visible}
          page={nav.currentPage} pageCount={nav.pageCount} zoom={zoom} fullscreen={fullscreen}
          onPrev={nav.prev} onNext={nav.next} onGoTo={nav.goToPage}
          onZoomIn={() => setZoom((z) => nextZoom(z))} onZoomOut={() => setZoom((z) => prevZoom(z))}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: CSS dos controles**

Adicionar em `src/styles/reader.css`:
```css
.reader__back[data-visible='false'], .controls[data-visible='false'] { opacity: 0; pointer-events: none; }
.reader__back, .controls { transition: opacity var(--controls-fade) ease; }

.controls {
  position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 5;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 999px;
  background: rgba(26, 17, 11, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(201, 164, 92, 0.25);
  color: var(--cream-200); font-size: 13px;
}
.controls button { padding: 4px 10px; border-radius: 999px; color: var(--gold-300); font-size: 16px; line-height: 1; }
.controls button:hover:not(:disabled) { background: rgba(201, 164, 92, 0.12); }
.controls button:disabled { opacity: 0.35; cursor: default; }
.controls__sep { width: 1px; height: 18px; background: rgba(201, 164, 92, 0.25); margin: 0 4px; }
.indicator { padding: 4px 8px; font-variant-numeric: tabular-nums; color: var(--cream-100); }
.indicator__input {
  width: 4.5em; font: inherit; text-align: right;
  background: rgba(0,0,0,0.4); color: var(--cream-100);
  border: 1px solid var(--gold-500); border-radius: 4px; padding: 2px 6px;
}
.zoom { display: inline-flex; align-items: center; gap: 2px; }
.zoom__value { min-width: 3.5em; text-align: center; font-variant-numeric: tabular-nums; }

.reader[data-fullscreen='true'] { background: var(--wood-900); }

@media (max-width: 480px) {
  .controls { flex-wrap: wrap; justify-content: center; max-width: 92vw; bottom: 10px; }
  .controls__sep { display: none; }
}
```

- [ ] **Step 7: Rodar testes e verificar**

Run: `npx vitest run && npm run lint`, depois `npm run dev`: barra some após 2,5 s e volta ao mover; indicador clicável salta; zoom re-renderiza sem flash (bitmap antigo fica até o novo); tela cheia entra/sai; recarregar a página e clicar "Continuar lendo" retoma na página e zoom certos.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(reader): controles com auto-ocultar, salto de página, zoom, tela cheia e prefetch"
```

---

### Task 13: Teclado e swipe

**Files:**
- Create: `src/shared/useKeyboardNav.ts`, `src/shared/useSwipe.ts`, `src/shared/useSwipe.test.ts`
- Modify: `src/reader/ReaderView.tsx`

**Interfaces:**
- Produces:
```ts
export function useKeyboardNav(handlers: { next: () => void; prev: () => void; first: () => void; last: () => void; exitFullscreen: () => void }, enabled?: boolean): void;
export function detectSwipe(start: { x: number; y: number }, end: { x: number; y: number }, threshold?: number): 'left' | 'right' | null;
export function useSwipe(ref: RefObject<HTMLElement | null>, onSwipe: (dir: 'left' | 'right') => void): void;
```

- [ ] **Step 1: Teste do detector de swipe**

`src/shared/useSwipe.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { detectSwipe } from './useSwipe';

describe('detectSwipe', () => {
  it('esquerda quando dx negativo além do limiar', () => {
    expect(detectSwipe({ x: 200, y: 100 }, { x: 120, y: 110 })).toBe('left');
  });
  it('direita quando dx positivo', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 180, y: 90 })).toBe('right');
  });
  it('ignora curto ou predominantemente vertical', () => {
    expect(detectSwipe({ x: 100, y: 100 }, { x: 130, y: 100 })).toBeNull();
    expect(detectSwipe({ x: 100, y: 100 }, { x: 170, y: 200 })).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/shared/useSwipe.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/shared/useSwipe.ts`:
```ts
import { useEffect, type RefObject } from 'react';

export function detectSwipe(start: { x: number; y: number }, end: { x: number; y: number }, threshold = 50): 'left' | 'right' | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < threshold) return null;
  // Predominantemente horizontal: evita disparar em rolagem vertical com zoom.
  if (Math.abs(dy) > Math.abs(dx) * 0.6) return null;
  return dx < 0 ? 'left' : 'right';
}

export function useSwipe(ref: RefObject<HTMLElement | null>, onSwipe: (dir: 'left' | 'right') => void): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    const onStart = (e: TouchEvent) => { if (e.touches.length === 1) start = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dir = detectSwipe(start, { x: t.clientX, y: t.clientY });
      start = null;
      if (dir) onSwipe(dir);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd); };
  }, [ref, onSwipe]);
}
```

`src/shared/useKeyboardNav.ts`:
```ts
import { useEffect } from 'react';

interface Handlers { next: () => void; prev: () => void; first: () => void; last: () => void; exitFullscreen: () => void }

export function useKeyboardNav(h: Handlers, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // Campos editáveis (input de página) ficam com suas teclas.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': e.preventDefault(); h.next(); break;
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); h.prev(); break;
        case 'Home': e.preventDefault(); h.first(); break;
        case 'End': e.preventDefault(); h.last(); break;
        case 'Escape': h.exitFullscreen(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [h, enabled]);
}
```

Em `ReaderView.tsx` (`ReaderInner`):
```tsx
const handlers = useMemo(() => ({
  next: nav.next, prev: nav.prev,
  first: () => nav.goToPage(1), last: () => nav.goToPage(nav.pageCount),
  exitFullscreen: () => { if (document.fullscreenElement) void document.exitFullscreen(); },
}), [nav]);
useKeyboardNav(handlers);
const onSwipe = useCallback((d: 'left' | 'right') => (d === 'left' ? nav.next() : nav.prev()), [nav]);
useSwipe(rootRef, onSwipe);
```
Adicionar `tabIndex={-1}` ao `.reader` e focá-lo ao montar (`useEffect(() => rootRef.current?.focus(), [])`) para o teclado funcionar sem clique prévio.

- [ ] **Step 4: Rodar e verificar**

Run: `npx vitest run && npm run lint`; no navegador: setas, PageUp/Down, Home/End, Esc em tela cheia; em modo dispositivo móvel do DevTools, swipe vira a página; setas dentro do input de página não viram.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(reader): navegação por teclado e swipe"
```

---

### Task 14: Fixtures, roteiro de validação e passagem pelos critérios

**Files:**
- Create: `scripts/make-fixtures.mjs`, `docs/validation.md`, `fixtures/.gitignore`
- Modify: `CLAUDE.md`, `PRD.md` (versão e data), correções que a validação revelar

- [ ] **Step 1: Gerador de PDFs sem dependência**

`scripts/make-fixtures.mjs`:
```js
// Gera PDFs simples (texto "Página N" em Helvetica) para testar 3, 50 e 800 páginas.
// Escrito à mão para não adicionar dependência só para fixtures.
import { writeFileSync, mkdirSync } from 'node:fs';

function makePdf(pageCount) {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  const pagesId = objects.length + 1 + pageCount * 2; // reservado depois dos conteúdos
  for (let i = 1; i <= pageCount; i++) {
    const text = `BT /F1 36 Tf 200 500 Td (P\\341gina ${i}) Tj ET BT /F1 14 Tf 72 720 Td (Escrivaninha fixture ${pageCount} paginas) Tj ET`;
    const contentId = add(`<< /Length ${text.length} >>\nstream\n${text}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  const realPagesId = add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`);
  if (realPagesId !== pagesId) throw new Error('cálculo do id de /Pages divergiu');
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

mkdirSync('fixtures', { recursive: true });
for (const n of [3, 50, 800]) {
  writeFileSync(`fixtures/livro-${n}.pdf`, makePdf(n));
  console.log(`fixtures/livro-${n}.pdf`);
}
```

`fixtures/.gitignore`: `*.pdf`

Run: `node scripts/make-fixtures.mjs` e abrir `fixtures/livro-3.pdf` num visualizador comum para confirmar que é válido.

- [ ] **Step 2: Roteiro de validação**

`docs/validation.md`:
```markdown
# Validação no navegador

Pré: `node scripts/make-fixtures.mjs`, `npm run dev`, Playwright MCP apontado em http://localhost:5173.

Viewports: 1440×900 (spread), 1024×768 (spread), 390×844 (single).

1. Biblioteca: título, subtítulo, dropzone, botão, rodapé de privacidade. Screenshot.
2. Drag & drop `livro-50.pdf`: dropzone destaca durante o arrasto; loading "Preparando seu livro..."; livro abre na capa sozinha à direita.
3. Botão "Abrir PDF" com `livro-3.pdf`.
4. Arquivo `.txt` renomeado `.pdf`: erro amigável, botão volta.
5. Viradas: clique direito ×3, esquerdo ×2; setas; PageUp/PageDown; Home; End. Indicador coerente. Screenshot no meio de uma virada (usar `browser_take_screenshot` logo após clicar).
6. Salto: clicar indicador, digitar 27, Enter → spread com 26/27. Esc cancela.
7. Zoom: + até 200 % e − até 50 %; página nítida; controles não saem do lugar.
8. Tela cheia: entra, controles somem após 2,5 s, voltam ao mover; Esc sai.
9. Voltar à biblioteca: card "Continuar lendo livro-50.pdf, página N"; clicar retoma.
10. Recarregar a aba: card continua (IndexedDB); retomar funciona.
11. `livro-800.pdf`: abrir, End, Home, saltar para 400; memória estável (DevTools > Memory ≤ ~300 MB); sem travar.
12. 390×844: uma página, swipe esquerda/direita, controles em duas linhas legíveis.
13. Console: zero erros/warnings em todo o roteiro.
14. Checklist da seção 8 do PRD.md preenchido.
```

- [ ] **Step 3: Executar o roteiro com Playwright MCP e corrigir**

Executar cada item; para cada falha, corrigir no módulo responsável, rodar `npm test && npm run lint`, commitar com `fix(...)`. Itens conhecidos a observar: flash branco na base durante a virada; `ResizeObserver loop` no console (envolver `setArea` em `requestAnimationFrame` se aparecer); foco inicial do `.reader`.

- [ ] **Step 4: Revisão visual final**

Comparar screenshots com a referência: hierarquia do título, contraste dourado/creme, dropzone sem cara de card de SaaS, livro com sombra e lombada. Ajustar tokens/CSS se necessário, commitar `style(...)`.

- [ ] **Step 5: Versão e documentação**

Atualizar `CLAUDE.md` e `PRD.md`: `Data de Atualização: <DD-MM-YYYY>_Versão 0.10`; linha no histórico do PRD: "0.10 | data | MVP completo: biblioteca, leitor em modo livro, virada animada, controles, persistência". Marcar os critérios de aceitação verificados com `[x]`.

- [ ] **Step 6: Build final e commit**

```bash
npm run build && npm test && npm run lint
git add -A
git commit -m "chore: fixtures, roteiro de validação e MVP v0.10"
```

---

## Self-review

**Cobertura do spec:** máquina de estados (T6), spreadLayout (T2), animação (T11), render/cache/fila/prefetch (T4, T9, T12), zoom (T6, T12), controles e interação (T12, T13), upload e validação (T3, T7), persistência (T5, T6, T12), estados e mensagens (T3, T8), identidade visual (T1, T7, T10), responsividade (T10, T12), testes e validação (todas + T14). `prefers-reduced-motion`: T10 (`animate=false`) e T11 (CSS).

**Ajuste em relação ao spec:** a virada usa `@keyframes` CSS com `animationend` em vez de WAAPI animando `--flip-progress`; mesmo efeito (luz e sombra sincronizadas), sem depender de `@property`. Registrar essa mudança no spec ao final da Task 11.

**Consistência de tipos:** `PageMetrics` definido em `Book.tsx` e consumido por `Sheet` e `ReaderView`; `Flip` definido em `useBookNavigation.ts` e consumido por `Book`/`Sheet`; `OpenBook` em `appState.ts` consumido por `RendererProvider`/`ReaderView`; `sheetForTransition` devolve `{front, back, direction}` e `Flip` espalha esses campos.
