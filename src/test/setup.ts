// Ambiente de teste: IndexedDB falso para os módulos de persistência.
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest roda com globals: false, então o auto-cleanup do RTL não registra
// sozinho; desmonta a árvore após cada teste para não acumular DOM entre eles.
afterEach(cleanup);
