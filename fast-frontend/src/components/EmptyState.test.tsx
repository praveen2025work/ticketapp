import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders message', () => {
    render(<EmptyState message="No tickets found" />);
    expect(screen.getByText('No tickets found')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState message="Empty" className="custom-class" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('custom-class');
  });
});
