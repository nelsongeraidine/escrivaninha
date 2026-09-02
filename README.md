# Escrivaninha

**Sua biblioteca particular.** Um leitor de PDF que apresenta o documento como um livro físico: páginas lado a lado, virada de página animada, navegação por mouse, teclado e toque. Tudo roda no navegador; o arquivo nunca sai do seu dispositivo.

Versão 0.11 (02-09-2026).

## Como usar (sem saber programar)

1. Instale o [Node.js](https://nodejs.org) (versão LTS), se ainda não tiver.
2. Baixe este repositório (botão **Code > Download ZIP**) e descompacte.
3. Dê duplo clique em **`Abrir Escrivaninha.bat`**.
   - Na primeira vez ele instala as dependências (leva alguns minutos).
   - Depois abre o navegador em `http://localhost:5173`.
4. Clique em **Abrir PDF** ou arraste um arquivo `.pdf` para a área indicada.
5. Para encerrar, feche a janela preta do terminal.

O último livro aberto fica salvo no próprio navegador (até 150 MB); na próxima visita aparece o card **Continuar lendo** com a página onde você parou.

## Controles do leitor

| Ação | Como |
|------|------|
| Próxima página | clique na metade direita do livro, `→`, `PageDown`, swipe para a esquerda |
| Página anterior | clique na metade esquerda, `←`, `PageUp`, swipe para a direita |
| Primeira / última página | `Home` / `End` |
| Ir para uma página | clique em `Página N / T` na barra inferior, digite o número, `Enter` |
| Zoom | `−` e `+` na barra (50 % a 200 %) |
| Tela cheia | botão na barra; `Esc` sai |
| Voltar à biblioteca | `← Biblioteca` no canto superior esquerdo |

A barra de controles some após 2,5 s sem movimento e volta ao mover o mouse ou tocar na tela. Em telas largas o livro mostra duas páginas; em celulares, uma.

## Para desenvolvedores

Stack: Vite 8, React 19, TypeScript strict, [pdf.js](https://mozilla.github.io/pdf.js/) 6, CSS puro. Sem backend.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produção em dist/
npm test           # Vitest (74 testes)
npm run lint       # oxlint + tsc
node scripts/make-fixtures.mjs   # PDFs de teste (3, 50 e 800 páginas) em fixtures/
```

Estrutura resumida:

- `src/app/`: máquina de estados (`library → loading → reading`, `error → library`) e fluxo de abertura.
- `src/library/`: tela inicial, dropzone, card "Continuar lendo".
- `src/reader/`: leitor, livro, folha animada (CSS 3D), controles, estados de carregamento e erro.
- `src/pdf/`: carga do documento, fila de render cancelável (concorrência 2), cache LRU de bitmaps, prefetch adaptativo ao zoom.
- `src/book/`: mapeamento página/spread/folha (funções puras), navegação, níveis de zoom.
- `src/persistence/`: IndexedDB (arquivo) e localStorage (página, zoom).
- `src/shared/`: erros amigáveis, validação do PDF, tela cheia, teclado, swipe, media queries.

Documentação: [PRD.md](PRD.md) (escopo e critérios de aceitação), [CLAUDE.md](CLAUDE.md) (guia para agentes de código), `docs/superpowers/specs/` (design técnico), `docs/validation.md` (roteiro de validação no navegador).

Deploy: site estático; funciona em Vercel, Netlify ou GitHub Pages com `npm run build`.

## Privacidade

Nenhum dado sai do navegador. Não há servidor, conta, telemetria ou upload. O PDF fica no IndexedDB do seu navegador só para o card "Continuar lendo"; limpar os dados do site apaga tudo.

## Limitações conhecidas (v0.11)

- PDFs protegidos por senha ainda não abrem.
- Um livro por vez na biblioteca (vários livros e marcadores são evoluções previstas).
- A virada de página é por clique/tecla/swipe; arrastar a página com o dedo ainda não existe.
- Arquivos acima de 500 MB são recusados; entre 150 e 500 MB abrem, mas não ficam salvos para "Continuar lendo".
