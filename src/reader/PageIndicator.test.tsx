import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageIndicator } from './PageIndicator';

describe('PageIndicator', () => {
  it('mostra página atual / total e abre input ao clicar', () => {
    render(<PageIndicator page={14} pageCount={286} onGoTo={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /ir para uma página/i });
    // `@testing-library/jest-dom` não está instalado: asserção via DOM puro.
    expect(btn.textContent).toContain('Página 14 / 286');
    fireEvent.click(btn);
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('14');
  });

  it('Enter salta e Esc cancela', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '33' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onGoTo).toHaveBeenCalledWith(33);
    expect(screen.queryByRole('spinbutton')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Escape' });
    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(onGoTo).toHaveBeenCalledTimes(1);
  });

  it('Esc seguido de blur não salva o valor digitado', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={5} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '40' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);
    expect(onGoTo).not.toHaveBeenCalled();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('Enter seguido de blur chama onGoTo uma única vez', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(onGoTo).toHaveBeenCalledTimes(1);
    expect(onGoTo).toHaveBeenCalledWith(20);
  });

  it('Enter com página fora do intervalo mostra erro, não salta e mantém o input aberto', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onGoTo).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('1 a 50');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    // O input continua aberto para o usuário corrigir.
    expect(screen.getByRole('spinbutton')).toBe(input);
  });

  it('corrigir o valor depois do erro e apertar Enter de novo salta normalmente', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.change(input, { target: { value: '12' } });
    // Editar de novo já limpa o erro, antes mesmo do próximo Enter.
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onGoTo).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('erro no Enter seguido de blur ainda salta com o valor clampado, sem travar o foco', () => {
    const onGoTo = vi.fn();
    render(<PageIndicator page={1} pageCount={50} onGoTo={onGoTo} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    // O blur não repete a validação: aceita o valor bruto e deixa o clamp para
    // `goToPage`, igual ao comportamento (silencioso) de antes desta mudança.
    expect(onGoTo).toHaveBeenCalledWith(999);
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });
});
