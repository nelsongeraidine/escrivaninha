import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { PdfDropzone } from './PdfDropzone';

// vitest roda com globals: false, entao o auto-cleanup do RTL nao registra;
// desmonta manualmente para nao acumular arvores entre os testes.
afterEach(cleanup);

function pdf(name = 'a.pdf') {
  return new File(['%PDF-'], name, { type: 'application/pdf' });
}

describe('PdfDropzone', () => {
  it('chama onFile ao escolher pelo input', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    const input = screen.getByLabelText('Abrir PDF', { selector: 'input' });
    // jsdom nao permite atribuir `files` via fireEvent target; define a propriedade antes.
    Object.defineProperty(input, 'files', { value: [pdf()], configurable: true });
    fireEvent.change(input);
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.pdf' }));
  });

  it('destaca durante o arrasto e aceita o drop', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    const zone = screen.getByTestId('dropzone');
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'] } });
    // Sem jest-dom: le o atributo direto do elemento.
    expect(zone.getAttribute('data-dragging')).toBe('true');
    fireEvent.drop(zone, { dataTransfer: { files: [pdf('b.pdf')], types: ['Files'] } });
    expect(zone.getAttribute('data-dragging')).toBe('false');
    expect(onFile).toHaveBeenCalledWith(expect.objectContaining({ name: 'b.pdf' }));
  });

  it('ignora drop sem arquivo', () => {
    const onFile = vi.fn();
    render(<PdfDropzone onFile={onFile} />);
    fireEvent.drop(screen.getByTestId('dropzone'), { dataTransfer: { files: [], types: [] } });
    expect(onFile).not.toHaveBeenCalled();
  });
});
