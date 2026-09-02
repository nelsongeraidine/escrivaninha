# Validação no navegador

Pré: `node scripts/make-fixtures.mjs`, `npm run dev`, Playwright MCP apontado em http://localhost:5173.

Fixtures: o script grava em `fixtures/livro-{3,50,800}.pdf` (uso humano). Para o Playwright MCP,
que só aceita upload de caminhos dentro do projeto, as mesmas fixtures ficam também em
`.playwright-mcp/livro-{3,50,800}.pdf`. As duas pastas são ignoradas pelo Git.

Viewports: 1440x900 (spread), 1024x768 (spread), 390x844 (single).

1. Biblioteca: título, subtítulo, dropzone, botão, rodapé de privacidade. Screenshot.
2. Drag & drop `livro-50.pdf`: dropzone destaca durante o arrasto; loading "Preparando seu livro..."; livro abre na capa sozinha à direita.
3. Botão "Abrir PDF" com `livro-3.pdf`.
4. Arquivo `.txt` renomeado `.pdf`: erro amigável, botão volta.
5. Viradas: clique direito x3, esquerdo x2; setas; PageUp/PageDown; Home; End. Indicador coerente. Screenshot no meio de uma virada (usar `browser_take_screenshot` logo após clicar).
6. Salto: clicar indicador, digitar 27, Enter -> spread com 26/27. Esc cancela.
7. Zoom: + até 200 % e - até 50 %; página nítida; controles não saem do lugar.
8. Tela cheia: entra, controles somem após 2,5 s, voltam ao mover; Esc sai.
9. Voltar à biblioteca: card "Continuar lendo livro-50.pdf, página N"; clicar retoma.
10. Recarregar a aba: card continua (IndexedDB); retomar funciona.
11. `livro-800.pdf`: abrir, End, Home, saltar para 400; memória estável (DevTools > Memory <= ~300 MB); sem travar.
12. 390x844: uma página, swipe esquerda/direita, controles em duas linhas legíveis.
13. Console: zero erros/warnings em todo o roteiro.
14. Checklist da seção 8 do PRD.md preenchido.
