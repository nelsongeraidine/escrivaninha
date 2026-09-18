# PRD: Escrivaninha

Data de Atualização: 18-09-2026_Versão 0.15

## 1. Produto

**Escrivaninha. Sua biblioteca particular.**

Aplicativo web que abre um PDF local e o apresenta como um livro físico: páginas em spread, virada de página animada, navegação por mouse, teclado e touch. O arquivo nunca sai do dispositivo do usuário.

Princípio central: em toda decisão de UX/UI perguntar "isso faz o usuário sentir que está lendo um livro ou usando um visualizador de PDF?". Se a resposta for "visualizador", repensar.

## 2. Público e contexto de uso

Leitor individual, em desktop, notebook, tablet ou smartphone, que quer uma experiência contemplativa de leitura de PDFs (livros, apostilas, documentos longos). Sem login, sem conta, sem servidor.

## 3. Fluxo principal

1. Usuário acessa a aplicação e vê a biblioteca (tela inicial).
2. Seleciona um PDF pelo botão "Abrir PDF" ou arrasta o arquivo até a área indicada.
3. A aplicação valida e carrega o documento ("Preparando seu livro...").
4. O PDF abre em modo livro.
5. O usuário navega página por página com animação de virada.
6. Pode voltar à biblioteca e retomar a leitura depois.

## 4. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | Selecionar PDF via botão (input `.pdf`) | Obrigatório |
| RF02 | Selecionar PDF via drag & drop com feedback visual durante o arrasto | Obrigatório |
| RF03 | Validar que o arquivo é PDF (extensão/MIME + assinatura `%PDF-`) | Obrigatório |
| RF04 | Renderizar páginas localmente com PDF.js, sob demanda, com cache e pré-carregamento das vizinhas | Obrigatório |
| RF05 | Exibir o documento como livro: spread de 2 páginas em desktop/paisagem, 1 página em mobile/retrato | Obrigatório |
| RF06 | Animação de virada de página nos dois sentidos, convincente e discreta (CSS 3D próprio) | Obrigatório |
| RF07 | Navegação por mouse: clique na metade direita avança, esquerda volta | Obrigatório |
| RF08 | Navegação por teclado: ← → PageUp PageDown Home End; Esc sai da tela cheia | Obrigatório |
| RF09 | Navegação por touch: swipe horizontal | Obrigatório |
| RF10 | Indicador `Página N / T` com salto direto para uma página | Obrigatório |
| RF11 | Zoom em níveis de 50 % a 200 % preservando nitidez e centralização | Obrigatório |
| RF12 | Modo tela cheia com controles acessíveis e saída por Esc | Obrigatório |
| RF13 | Voltar à biblioteca preservando arquivo, página e estado de leitura | Obrigatório |
| RF14 | Persistir localmente último PDF (IndexedDB, até 150 MB), página atual e zoom | Obrigatório |
| RF15 | Estados explícitos: biblioteca vazia, carregando, lendo, erro, com mensagens amigáveis | Obrigatório |
| RF16 | Controles discretos na parte inferior, com auto-ocultar durante a leitura | Obrigatório |
| RF17 | Arrastar a página com o dedo/mouse (drag curl) | Futuro |
| RF18 | Vários livros na biblioteca | Futuro |
| RF19 | PDFs protegidos por senha | Futuro |

## 5. Requisitos não funcionais

- **Privacidade**: processamento 100% no navegador; nenhum upload.
- **Performance**: documentos com centenas ou milhares de páginas devem permanecer fluidos; nunca renderizar todas as páginas; liberar bitmaps fora da janela de leitura; cancelar renders obsoletos.
- **Responsividade**: desktop, notebook, tablet e smartphone.
- **Acessibilidade**: botões com rótulos, foco visível, contraste adequado, `aria-live` no indicador de página, erros com `role="alert"`, `prefers-reduced-motion` respeitado.
- **Qualidade visual**: produto comercial, não "funcional porém genérico". Sem visual de dashboard, sem excesso de cards/ícones, sem gradientes saturados.
- **Sem erros no console** na navegação completa.

## 6. Identidade visual

Referência: biblioteca/escritório clássico; madeira escura, marrons, dourado discreto, creme, bordô como detalhe. Títulos em serif elegante (Cormorant Garamond), UI em Inter. Fundo em CSS (sem imagem pesada). Livro com papel creme, sombra de lombada, profundidade, bordas sutis.

## 7. Decisões de produto tomadas

| Data | Decisão |
|------|---------|
| 02-09-2026 | Virada de página com implementação própria em CSS 3D (page-flip/StPageFlip descartado: sem manutenção desde 2022 e integração frágil com React). |
| 02-09-2026 | Persistir o PDF no IndexedDB com teto de 150 MB; acima disso, só metadados. |
| 02-09-2026 | MVP com um único livro atual na biblioteca. |
| 02-09-2026 | Stack: Vite 8, React 19, TypeScript, pdfjs-dist 6, CSS puro; deploy alvo Vercel. |

## 8. Critérios de aceitação

- [x] Abrir a aplicação.
- [x] Arrastar um PDF para a interface.
- [x] Selecionar um PDF pelo botão.
- [x] O PDF é processado localmente.
- [x] O documento aparece como um livro.
- [x] Visualizar as páginas.
- [x] Virar a página para frente.
- [x] Voltar a página.
- [x] A animação parece uma página física sendo virada.
- [x] Navegar usando teclado.
- [x] Navegar usando mouse.
- [x] Navegar usando touch no mobile.
- [x] Visualizar página atual / total.
- [x] Ir diretamente para uma página.
- [x] Utilizar zoom.
- [x] Utilizar fullscreen.
- [x] Voltar para a biblioteca.
- [x] Funciona com PDFs grandes.
- [x] Interface responsiva.
- [x] Visual segue a identidade da referência.
- [x] Sem erros no console.
- [x] Sem elementos quebrados.
- [x] Layout não parece um visualizador de PDF convencional.
- [x] A experiência transmite a sensação de "ler um livro".

Validação executada no navegador (Playwright MCP) a 1440x900, 1024x768 e 390x844
com as fixtures de 3, 50 e 800 páginas. Roteiro em `docs/validation.md`.

## 9. Histórico de versões

| Versão | Data | Alteração |
|--------|------|-----------|
| 0.01 | 02-09-2026 | PRD inicial a partir do briefing e do spec de design. |
| 0.10 | 02-09-2026 | MVP completo: biblioteca, leitor em modo livro, virada animada, controles, persistência. |
| 0.11 | 02-09-2026 | Revisão final: aria-live no indicador, foco revela controles, card "Continuar lendo" confere o livro, prefetch adaptativo ao zoom, testes de useOpenBook, .bat detecta app já aberto. |
| 0.12 | 02-09-2026 | Refino visual (revisão UI/UX): proporção do livro na tela, papel unificado marfim, madeira de verdade no fundo/mesa, vinco e blocos de página, sombra de contato, sombreado da virada, tipografia do título, controles com ícones SVG e vidro quente, polimento mobile e tela cheia. |
| 0.13 | 02-09-2026 | Assinatura discreta "feito por @nelsonggeraidine" (link para o Instagram) abaixo do aviso de privacidade na biblioteca. EPUB avaliado e descartado por ora (exigiria segundo motor de renderização e dependência nova). |
| 0.14 | 18-09-2026 | Correções P1 da revisão UI/UX (`$impeccable critique`): barra de controles não some mais no toque sem antes revelar (faixa morta de 30% em torno da lombada separa "revelar" de "virar página"), fantasma a 14% de opacidade em vez de sumir por completo, "← Biblioteca" e a barra nunca escondem antes da primeira interação real do usuário no livro; biblioteca com um único `<input type="file">` (o pill "Abrir PDF" aciona o mesmo seletor da dropzone) e anel de foco dourado visível no painel inteiro via `:focus-within`. |
| 0.15 | 18-09-2026 | Correções P2 da revisão UI/UX: zoom acima de 100% recentraliza o scroll no vinco ao mudar de nível e barras de rolagem na paleta madeira, em vez de recortar o livro com barras cinzas nativas; tela de erro ganha "Escolher outro arquivo" como ação primária (reabre o seletor direto, sem forçar volta à biblioteca), mantendo "Voltar para a biblioteca" como secundária. |

Spec técnico detalhado: `docs/superpowers/specs/2026-09-02-escrivaninha-design.md`.
