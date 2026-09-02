/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Config unica para Vite e Vitest: o bloco `test` fica aqui para nao
// duplicar a resolucao de plugins/alias entre build e testes.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    // globals: false porque cada teste importa explicitamente de vitest;
    // evita poluir o escopo global e mantem o lint honesto.
    globals: false,
  },
});
