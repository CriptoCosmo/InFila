/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { OwnerRoute } from '../../src/components/OwnerRoute.jsx';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as hooks from '../../src/lib/hooks.js';

vi.mock('../../src/lib/hooks.js', () => ({
  useOwnerAuth: vi.fn()
}));

describe('OwnerRoute', () => {
  it('mostra il Loader se loading è true', () => {
    vi.mocked(hooks.useOwnerAuth).mockReturnValue({ loading: true, owner: null });
    
    const { container } = render(
      <MemoryRouter>
        <OwnerRoute>
          <div>Children Content</div>
        </OwnerRoute>
      </MemoryRouter>
    );

    // Loader is rendered, so we check for 'caricamento' class or 'Un istante…'
    expect(container.textContent).toContain('Un istante…');
    expect(container.textContent).not.toContain('Children Content');
  });

  it('redirige a /login se non loggato', () => {
    vi.mocked(hooks.useOwnerAuth).mockReturnValue({ loading: false, owner: null });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<OwnerRoute><div>Children Content</div></OwnerRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // We should be redirected to /login
    expect(container.textContent).toContain('Login Page');
    expect(container.textContent).not.toContain('Children Content');
  });

  it('renderizza i figli se loggato', () => {
    vi.mocked(hooks.useOwnerAuth).mockReturnValue({ loading: false, owner: { uid: '123' } });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<OwnerRoute><div>Children Content</div></OwnerRoute>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // We should see children content
    expect(container.textContent).toContain('Children Content');
    expect(container.textContent).not.toContain('Login Page');
  });
});
