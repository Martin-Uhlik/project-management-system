import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { afterEach, vi } from 'vitest';
import { App } from './App';

// jsdom has no canvas: the charts (chart.js) can't draw, and fail when the cached data makes them draw again
vi.mock('react-chartjs-2', () => ({ Bar: () => null }));

afterEach(() => {
    vi.restoreAllMocks();
});

// the backend's answer to GET /auth/me (and /demo-accounts): 200 = signed in, otherwise 401
const backend = ({ signedIn, demoAccounts = null }: { signedIn: boolean; demoAccounts?: { role: string; name: string; position: string }[] | null }) =>
    vi.spyOn(axios, 'get').mockImplementation((url: string) => {
        if (url.endsWith('/auth/me')) return signedIn ? Promise.resolve({ data: { ID: 1, UserType: 'USER' } }) : Promise.reject({ response: { status: 401 } });
        if (url.endsWith('/demo-accounts')) return demoAccounts ? Promise.resolve({ data: demoAccounts }) : Promise.reject({ response: { status: 403 } });
        return Promise.reject({ response: { status: 404 } });
    });

test('shows the sign-in form on the start page', async () => {
    backend({ signedIn: false });
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByLabelText(/Uživatelské jméno/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heslo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Demo účty')).not.toBeInTheDocument();
});

test('offers the demo accounts with a demo pass, switched on', async () => {
    backend({ signedIn: false, demoAccounts: [{ role: 'USER', name: 'Tomáš Svoboda', position: 'Konstruktér' }] });
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByLabelText('Demo účty')).toBeChecked();
    expect(screen.getByText('Pracovník: Tomáš Svoboda (Konstruktér)')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Uživatelské jméno/)).not.toBeInTheDocument();
});

test('sends a signed-in user from the start page into the app', async () => {
    backend({ signedIn: true });
    window.history.pushState({}, '', '/');
    render(<App />);
    await vi.waitFor(() => expect(window.location.pathname).toBe('/auth/overview'));
});

test('sends a signed-out user from the app to the start page', async () => {
    backend({ signedIn: false });
    window.history.pushState({}, '', '/auth/projects');
    render(<App />);
    await vi.waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(await screen.findByLabelText(/Uživatelské jméno/)).toBeInTheDocument();
});
