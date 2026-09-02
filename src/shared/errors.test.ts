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
