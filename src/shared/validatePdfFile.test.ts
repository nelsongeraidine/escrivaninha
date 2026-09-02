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
