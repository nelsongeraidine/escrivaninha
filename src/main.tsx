import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fontes empacotadas via @fontsource: sem chamada de rede a CDNs de fonte,
// o leitor precisa abrir mesmo offline.
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
// tokens antes de base: base.css consome as custom properties definidas em tokens.css.
import './styles/tokens.css';
import './styles/base.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
