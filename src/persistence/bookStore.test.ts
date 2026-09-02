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
