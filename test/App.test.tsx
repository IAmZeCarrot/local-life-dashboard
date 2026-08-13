import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('crypto', { randomUUID: () => 'new-id' });
  vi.stubGlobal('confirm', () => true);
});

describe('dashboard', () => {
  it('adds and filters a local item', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /add something/i }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Buy seed packets' },
    });
    fireEvent.change(screen.getByLabelText(/tags/i), {
      target: { value: 'garden, spring' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save locally/i }));
    expect(screen.getByText('Buy seed packets')).toBeInTheDocument();
    expect(localStorage.length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });
});
