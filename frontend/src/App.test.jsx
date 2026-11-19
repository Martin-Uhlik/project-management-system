import { render, screen } from '@testing-library/react';
import { App } from './App';

test('shows the sign-in form on the start page', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByLabelText(/Uživatelské jméno/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heslo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeInTheDocument();
});
