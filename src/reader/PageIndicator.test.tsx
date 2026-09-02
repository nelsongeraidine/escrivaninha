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
});
